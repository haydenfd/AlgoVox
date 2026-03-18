// requires sox: brew install sox
import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import { DeepgramClient } from "@deepgram/sdk";
import Mic from "mic";
import WebSocket from "ws";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

let mainWindow: BrowserWindow | null = null;
let activeMic: any = null;
let activeConnection: any = null;
let lastFinalTranscript = "";
let turnInProgress = false;
let ttsChunksSent = 0;
let ttsChunksPlayed = 0;

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

function startKeepAlive() {
  // Deepgram WebSocket stays open naturally, no manual keepalive needed
  console.log("[Deepgram] Connection will stay open during TTS");
}

function stopKeepAlive() {
  // No-op, keepalive not needed
}

function reopenMic() {
  if (activeMic) {
    activeMic.stop();
    activeMic = null;
  }

  const micInstance = Mic({
    rate: "16000",
    channels: "1",
    encoding: "signed-integer",
    bitwidth: "16",
  });

  const micStream = micInstance.getAudioStream();
  micStream.on("data", (chunk: Buffer) => {
    if (activeConnection) activeConnection.sendMedia(chunk);
  });
  micStream.on("error", (err: Error) => {
    console.error("[Mic] Error:", err);
  });

  micInstance.start();
  activeMic = micInstance;
  console.log("[Mic] Reopened");
}

function createWavHeader(dataLength: number, sampleRate: number, channels: number, bitsPerSample: number): Buffer {
  const header = Buffer.alloc(44);

  // "RIFF" chunk descriptor
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4); // file size - 8
  header.write('WAVE', 8);

  // "fmt " sub-chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // sub-chunk size
  header.writeUInt16LE(1, 20); // audio format (1 = PCM)
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28); // byte rate
  header.writeUInt16LE(channels * bitsPerSample / 8, 32); // block align
  header.writeUInt16LE(bitsPerSample, 34);

  // "data" sub-chunk
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);

  return header;
}

async function handleTurn(transcript: string) {
  if (turnInProgress) return;
  turnInProgress = true;

  console.log("[Turn] Sending to Claude:", transcript);
  mainWindow?.webContents.send("agent-thinking");

  // Reset chunk counters
  ttsChunksSent = 0;
  ttsChunksPlayed = 0;

  // Open Cartesia WebSocket
  const cartesiaWs = new WebSocket(
    "wss://api.cartesia.ai/tts/websocket?api_key=" +
    process.env.CARTESIA_API_KEY +
    "&cartesia_version=2024-06-10"
  );

  startKeepAlive();

  cartesiaWs.on("open", async () => {
    console.log("[Cartesia] WebSocket open");

    // Stream Claude response
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        stream: true,
        system: "You are a helpful conversational assistant. Keep responses concise and conversational. Never use markdown formatting, bullet points, asterisks, headers, or any special characters. Respond in plain spoken English only as your response will be read aloud.",
        messages: [{ role: "user", content: transcript }],
      }),
    });

    let fullText = "";
    const contextId = crypto.randomUUID();

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((l) => l.startsWith("data:"));

      for (const line of lines) {
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const token = parsed?.delta?.text;
          if (token) {
            fullText += token;

            // Send each token to Cartesia as it arrives
            const payload = {
              model_id: "sonic-english",
              transcript: token,
              voice: {
                mode: "id",
                id: "a0e99841-438c-4a64-b679-ae501e7d6091",
              },
              output_format: {
                container: "raw",
                encoding: "pcm_s16le",
                sample_rate: 44100,
              },
              context_id: contextId,
              continue: true,
            };
            console.log("[Cartesia] Sending token, length:", token.length);
            cartesiaWs.send(JSON.stringify(payload));
          }
        } catch {}
      }
    }

    // Signal end of input
    console.log("[Cartesia] Sending final message (continue: false)");
    cartesiaWs.send(
      JSON.stringify({
        model_id: "sonic-english",
        transcript: " ",
        voice: {
          mode: "id",
          id: "a0e99841-438c-4a64-b679-ae501e7d6091",
        },
        output_format: {
          container: "raw",
          encoding: "pcm_s16le",
          sample_rate: 44100,
        },
        context_id: contextId,
        continue: false,
      })
    );

    console.log("[Claude] Full response:", fullText);
    mainWindow?.webContents.send("agent-response", fullText);
  });

  // Receive audio chunks from Cartesia and send to renderer
  cartesiaWs.on("message", (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());
      console.log("[Cartesia] Received message type:", msg.type);

      if (msg.type === "chunk" && msg.data) {
        // Convert raw PCM to WAV
        const pcmData = Buffer.from(msg.data, "base64");
        const wavHeader = createWavHeader(pcmData.length, 44100, 1, 16);
        const wavData = Buffer.concat([wavHeader, pcmData]);
        const wavBase64 = wavData.toString("base64");

        ttsChunksSent++;
        console.log(`[TTS] Sending chunk ${ttsChunksSent}, PCM length:`, pcmData.length, "WAV length:", wavData.length);
        mainWindow?.webContents.send("tts-audio", wavBase64);
      }

      if (msg.type === "done") {
        console.log("[Cartesia] Stream done");
        cartesiaWs.close();
      }

      if (msg.type === "error") {
        console.error("[Cartesia] Error from server:", msg);
      }
    } catch (err) {
      console.error("[Cartesia] Message parse error:", err);
      console.error("[Cartesia] Raw data:", data.toString());
    }
  });

  cartesiaWs.on("close", () => {
    console.log("[Cartesia] WebSocket closed");
    stopKeepAlive();

    // If no chunks were sent, reopen mic immediately
    if (ttsChunksSent === 0) {
      console.log("[Turn] No TTS chunks, reopening mic");
      turnInProgress = false;
      if (activeConnection) reopenMic();
    }
  });

  cartesiaWs.on("error", (err: Error) => {
    console.error("[Cartesia] Error:", err);
    turnInProgress = false;
    stopKeepAlive();
    if (activeConnection) reopenMic();
  });
}

ipcMain.handle("start-listening", async () => {
  if (activeConnection) {
    console.log("[Main] Already listening, ignoring");
    return;
  }

  console.log("[Main] start-listening called");

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    console.error("[Main] DEEPGRAM_API_KEY not set");
    return;
  }

  const deepgram = new DeepgramClient({ apiKey });

  const connection = await deepgram.listen.v1.connect({
    model: "nova-2",
    language: "en",
    encoding: "linear16",
    sample_rate: 16000,
    channels: 1,
    interim_results: true as any,
    endpointing: 1000,
    utterance_end_ms: 1500,
  });

  connection.on("open", () => {
    console.log("[Deepgram] Connection opened, starting mic capture");
    reopenMic();
  });

  connection.on("message", async (data: any) => {
    console.log("[Deepgram] Raw event:", JSON.stringify(data, null, 2));

    // Ignore all transcript events while turn is in progress
    if (turnInProgress && data.type === "Results") {
      console.log("[Deepgram] Ignoring transcript during turn");
      return;
    }

    if (data.type === "Results") {
      const transcript = data.channel?.alternatives?.[0]?.transcript;
      if (!transcript?.trim()) return;

      if (data.is_final) {
        lastFinalTranscript = transcript;
        console.log("[Deepgram] is_final:", transcript);
      }

      if (data.speech_final) {
        console.log("[Deepgram] speech_final:", transcript);
        mainWindow?.webContents.send("transcript-final", transcript);

        // Stop mic before processing turn
        if (activeMic) {
          activeMic.stop();
          activeMic = null;
        }

        if (!turnInProgress) {
          await handleTurn(transcript);
        }
        lastFinalTranscript = "";
      } else {
        console.log("[Deepgram] interim:", transcript);
        mainWindow?.webContents.send("transcript-interim", transcript);
      }
    }

    if (data.type === "UtteranceEnd") {
      if (lastFinalTranscript.trim() && !turnInProgress) {
        console.log("[Deepgram] UtteranceEnd — final transcript:", lastFinalTranscript);
        mainWindow?.webContents.send("transcript-final", lastFinalTranscript);

        // Stop mic before processing turn
        if (activeMic) {
          activeMic.stop();
          activeMic = null;
        }

        await handleTurn(lastFinalTranscript);
        lastFinalTranscript = "";
      }
    }
  });

  connection.on("error", (err: any) => {
    console.error("[Deepgram] Error:", err);
  });

  connection.on("close", () => {
    console.log("[Deepgram] Connection closed");
    activeMic?.stop();
    activeMic = null;
    activeConnection = null;
    lastFinalTranscript = "";
    stopKeepAlive();
    mainWindow?.webContents.send("connection-closed");
  });

  connection.connect();
  await connection.waitForOpen();
  activeConnection = connection;

  console.log("[Main] Deepgram connection established");
});

ipcMain.handle("stop-listening", () => {
  console.log("[Main] stop-listening called");
  activeMic?.stop();
  activeConnection?.finish();
  activeMic = null;
  activeConnection = null;
  lastFinalTranscript = "";
  turnInProgress = false;
  ttsChunksSent = 0;
  ttsChunksPlayed = 0;
  stopKeepAlive();
  console.log("[Main] Stopped");
});

ipcMain.handle("playback-done", async () => {
  ttsChunksPlayed++;
  console.log(`[TTS] Chunk ${ttsChunksPlayed}/${ttsChunksSent} played`);

  if (ttsChunksPlayed >= ttsChunksSent && ttsChunksSent > 0) {
    // All chunks played — reopen mic
    console.log("[Main] All TTS done, reopening mic");
    turnInProgress = false;
    ttsChunksSent = 0;
    ttsChunksPlayed = 0;
    if (activeConnection) reopenMic();
  }
});
