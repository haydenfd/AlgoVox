import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import dotenv from "dotenv";
import { createMicInstance, pcmToWav } from "./audio";
import { createDeepgramConnection } from "./stt";
import { streamClaudeResponse } from "./llm";
import { createCartesiaConnection } from "./tts";

dotenv.config();

let mainWindow: BrowserWindow | null = null;
let activeMic: any = null;
let activeConnection: any = null;
let aiSpeaking = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

/**
 * Opens the microphone and pipes audio to Deepgram
 * Audio is gated when AI is speaking
 */
function reopenMic() {
  if (activeMic) {
    activeMic.stop();
    activeMic = null;
  }

  activeMic = createMicInstance((chunk: Buffer) => {
    // Gate audio while AI is speaking
    if (!aiSpeaking && activeConnection) {
      activeConnection.sendMedia(chunk);
    }
  });

  activeMic.start();
  console.log("[Mic] Reopened and streaming to Deepgram");
}

/**
 * Simulates AI turn - gates mic for 2 seconds
 */
async function simulateAITurn(userTranscript: string) {
  console.log("[AI] Starting simulated turn for:", userTranscript);

  aiSpeaking = true;
  mainWindow?.webContents.send("agent-thinking");

  // Simulate 2 second response time
  await new Promise(resolve => setTimeout(resolve, 6000));

  const simulatedResponse = "Simulated AI response";
  console.log("[AI] Sending simulated response:", simulatedResponse);
  mainWindow?.webContents.send("agent-response", simulatedResponse);

  aiSpeaking = false;
  console.log("[AI] Turn complete, mic ungated");
}

/**
 * Handles a complete turn: user spoke -> Claude responds -> TTS plays
 * TODO: Wire up LLM/TTS
 */
async function handleTurn(transcript: string) {
  if (turnInProgress) {
    console.log("[Turn] Already in progress, ignoring");
    return;
  }

  turnInProgress = true;
  console.log("[Turn] Starting - user said:", transcript);
  mainWindow?.webContents.send("agent-thinking");

  // Reset chunk counters
  ttsChunksSent = 0;
  ttsChunksPlayed = 0;

  // Create Cartesia connection
  const cartesiaWs = createCartesiaConnection(
    {
      apiKey: process.env.CARTESIA_API_KEY!,
      voiceId: "a0e99841-438c-4a64-b679-ae501e7d6091",
    },
    {
      onOpen: async () => {
        let fullText = "";

        // Stream Claude response token by token to Cartesia
        for await (const token of streamClaudeResponse(
          process.env.ANTHROPIC_API_KEY!,
          transcript
        )) {
          fullText += token;
          (cartesiaWs as any).sendText(token, false);
        }

        // Send final message to Cartesia
        (cartesiaWs as any).sendText(" ", true);

        console.log("[Claude] Full response:", fullText);
        mainWindow?.webContents.send("agent-response", fullText);
      },
      onAudioChunk: (pcmData: Buffer) => {
        // Convert PCM to WAV and send to renderer
        const wavData = pcmToWav(pcmData, 44100);
        const wavBase64 = wavData.toString("base64");

        ttsChunksSent++;
        console.log(
          `[TTS] Sending chunk ${ttsChunksSent} to renderer - PCM: ${pcmData.length}bytes, WAV: ${wavData.length}bytes`
        );
        mainWindow?.webContents.send("tts-audio", wavBase64);
      },
      onDone: () => {
        console.log("[TTS] Cartesia stream done");
      },
      onError: (err) => {
        console.error("[TTS] Cartesia error:", err);
        turnInProgress = false;
        if (activeConnection) reopenMic();
      },
      onClose: async () => {
        console.log(
          "[TTS] Cartesia closed - chunks sent:",
          ttsChunksSent,
          "played:",
          ttsChunksPlayed
        );

        // If no chunks were sent, reopen mic immediately
        if (ttsChunksSent === 0) {
          console.log("[Turn] No TTS chunks, reopening mic immediately");
          turnInProgress = false;

          if (activeConnection) {
            console.log("[Turn] Deepgram connection active, reopening mic");
            reopenMic();
          } else {
            console.log("[Turn] Deepgram closed during turn - reconnecting...");
            try {
              activeConnection = await startDeepgramConnection();
              console.log("[Turn] Reconnected successfully, reopening mic");
              reopenMic();
            } catch (err) {
              console.error("[Turn] Failed to reconnect:", err);
              mainWindow?.webContents.send("connection-closed");
            }
          }
        } else {
          console.log("[Turn] Waiting for", ttsChunksSent, "chunks to finish playing");
        }
      },
    }
  );
}

/**
 * Creates and connects to Deepgram
 */
async function startDeepgramConnection() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    console.error("[Main] DEEPGRAM_API_KEY not set");
    throw new Error("DEEPGRAM_API_KEY not set");
  }

  const connection = await createDeepgramConnection(apiKey, {
    onOpen: () => {
      // Connection opened, ready to receive audio
    },
    onTranscriptInterim: (text) => {
      mainWindow?.webContents.send("transcript-interim", text);
    },
    onTranscriptFinal: (_text) => {
      // Final transcript received, but not speech_final yet
    },
    onSpeechFinal: async (text) => {
      mainWindow?.webContents.send("transcript-final", text);
      await simulateAITurn(text);
    },
    onUtteranceEnd: async (_text) => {
      // Ignore - using speech_final only to prevent duplicates
      console.log("[Main] UtteranceEnd ignored");
    },
    onError: (err) => {
      console.error("[Main] Deepgram error:", err);
    },
    onClose: () => {
      console.log("[Main] Deepgram closed");

      // Clear connection and mic
      const wasActive = activeConnection !== null;
      activeMic?.stop();
      activeMic = null;
      activeConnection = null;

      if (wasActive) {
        console.log("[Main] Notifying frontend of connection loss");
        mainWindow?.webContents.send("connection-closed");
      }
    },
  });

  return connection;
}

// IPC Handlers
ipcMain.handle("start-listening", async () => {
  if (activeConnection) {
    console.log("[Main] Already listening, ignoring");
    return;
  }

  console.log("[Main] start-listening called");
  activeConnection = await startDeepgramConnection();
  reopenMic();
  console.log("[Main] Listening started");
});

ipcMain.handle("stop-listening", () => {
  console.log("[Main] stop-listening called");
  activeMic?.stop();
  if (activeConnection) {
    try {
      activeConnection.close();
    } catch (err) {
      console.error("[Main] Error closing connection:", err);
    }
  }
  activeMic = null;
  activeConnection = null;
  console.log("[Main] Stopped");
});

ipcMain.handle("playback-done", async () => {
  // TODO: Re-enable when TTS is wired up
  console.log("[Main] playback-done called (TTS not wired up yet)");
});
