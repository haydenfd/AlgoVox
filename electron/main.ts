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
let turnInProgress = false;
let ttsChunksSent = 0;
let ttsChunksPlayed = 0;
let currentSystemPrompt = "";
let conversationHistory: { role: string; content: string }[] = [];
let currentSessionState: SessionState | null = null;

// Session state types
interface Question {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  examples: string[];
  constraints: string[];
}

interface SessionState {
  phase: string;
  question: Question;
  conversationHistory: Array<{ role: string; content: string }>;
  hasProposedApproach: boolean;
  codingStarted: boolean;
  code: string;
  startedAt: Date;
}

const BASE_PROMPT = `You are a senior software engineer conducting a technical interview at a top tech company.
You are professional, direct, and concise.
Never give away the solution directly.
Respond in plain spoken English only. No markdown, no bullet points, no special characters.
When describing the problem, speak naturally — never read special characters or symbols literally.
Keep responses short and conversational as they will be read aloud.
Do not use filler phrases like "great question", "good thinking", "happy to help", "certainly", or "of course".
Respond directly and naturally like a real interviewer would, not like an AI assistant.`;

const INTRO_PROMPT = `You are opening the interview.
Start by asking if the candidate can hear you clearly.
Once they confirm, introduce yourself briefly.
Then give a one sentence plain English summary of the problem.
Then say exactly: "I'll paste the full problem statement in the editor for you to follow along."
Then walk through one example in plain spoken English — no special characters.
Then ask if they have any clarifying questions.
Do NOT ask them to start coding yet.`;

const DISCUSSION_PROMPT = `The candidate has finished asking clarifying questions and is now in the discussion phase.
Your job is to understand how they think before they write any code.
Ask them to walk you through their approach at a high level.
Ask questions like: "How would you approach this?", "What data structure are you thinking?", "Why that approach?"
Do NOT say "let's start coding" or "ready to code" until the candidate has clearly explained a complete approach.
Only move to coding when the candidate has explained their full approach and you are satisfied with their thinking.
When you are ready to move to coding say exactly: "That sounds good, let's go ahead and code that up."`;

const CODING_PROMPT = `The candidate is now writing their solution in the code editor.
Stay silent unless the candidate directly asks you a question.
Do not offer unsolicited commentary or feedback.
If the candidate asks for help, give a small nudge only — do not give away the solution.`;

function buildSystemPrompt(state: SessionState): string {
  const questionBlock = `Current Problem:
Title: ${state.question.title}
Difficulty: ${state.question.difficulty}
Description: ${state.question.description}`;

  const stateBlock = `Current Interview State:
- Phase: ${state.phase}
- Turns so far: ${state.conversationHistory.length}`;

  const stagePrompt =
    state.phase === "intro" ? INTRO_PROMPT :
    state.phase === "coding" ? CODING_PROMPT :
    DISCUSSION_PROMPT;

  return [BASE_PROMPT, stagePrompt, questionBlock, stateBlock].join("\n\n");
}

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
    } else {
      console.log("[Mic] GATED - aiSpeaking:", aiSpeaking, "hasConnection:", !!activeConnection);
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
 * Handles the session kickoff - streams Claude's opening message
 */
async function handleKickoff(sessionState: SessionState) {
  console.log("[Kickoff] Starting session with state:", sessionState);

  aiSpeaking = true;
  mainWindow?.webContents.send("agent-thinking");

  try {
    console.log("[Kickoff] System prompt:", currentSystemPrompt);

    const userMessage = "Please begin the interview.";
    conversationHistory.push({ role: "user", content: userMessage });

    let fullText = "";

    // Stream Claude response token by token
    // Empty user message to trigger intro from system prompt
    for await (const token of streamClaudeResponse(
      process.env.ANTHROPIC_API_KEY!,
      userMessage,
      currentSystemPrompt
    )) {
      fullText += token;
      mainWindow?.webContents.send("agent-token", token);
    }

    conversationHistory.push({ role: "assistant", content: fullText });

    console.log("[Kickoff] Full response:", fullText);
    mainWindow?.webContents.send("agent-response", fullText);

    // Update phase to discussion
    if (currentSessionState) {
      currentSessionState.phase = "discussion";
      currentSystemPrompt = buildSystemPrompt(currentSessionState);
      console.log("[Session] Phase updated to discussion");
    }

    aiSpeaking = false;
    console.log("[Kickoff] Complete, mic ready for candidate response");
  } catch (err) {
    console.error("[Kickoff] Error:", err);
    aiSpeaking = false;
  }
}

/**
 * Handles a real turn - user spoke, Claude responds (no TTS)
 */
async function handleRealTurn(transcript: string) {
  if (turnInProgress) {
    console.log("[Turn] Already in progress, ignoring");
    return;
  }
  if (!transcript?.trim()) return;
  if (transcript.trim().split(" ").length < 6) {
    console.log("[Turn] Too short, ignoring:", transcript);
    return;
  }

  turnInProgress = true;
  console.log("[Turn] User said:", transcript);
  mainWindow?.webContents.send("agent-thinking");

  conversationHistory.push({ role: "user", content: transcript });

  try {
    let fullText = "";

    for await (const token of streamClaudeResponse(
      process.env.ANTHROPIC_API_KEY!,
      transcript,
      currentSystemPrompt,
      conversationHistory
    )) {
      fullText += token;
      mainWindow?.webContents.send("agent-token", token);
    }

    conversationHistory.push({ role: "assistant", content: fullText });

    console.log("[Turn] Claude response:", fullText);

    // Check for coding transition phrase
    const CODING_TRIGGER = "let's go ahead and code that up";
    if (fullText.toLowerCase().includes(CODING_TRIGGER)) {
      console.log("[Session] Coding phase triggered");
      if (currentSessionState) {
        currentSessionState.phase = "coding";
        currentSystemPrompt = buildSystemPrompt(currentSessionState);
      }
      mainWindow?.webContents.send("coding-started");
    }

    mainWindow?.webContents.send("agent-response", fullText);
  } catch (err) {
    console.error("[Turn] Error:", err);
  } finally {
    turnInProgress = false;
    await new Promise(resolve => setTimeout(resolve, 1500));
    reopenMic();
  }
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
      if (turnInProgress) return; // UtteranceEnd already handled it
      mainWindow?.webContents.send("transcript-final", text);
      // await handleRealTurn(text); // temporarily disabled
    },
    onUtteranceEnd: async (text) => {
      if (!text?.trim()) return;
      console.log("[Main] UtteranceEnd firing turn:", text);
      mainWindow?.webContents.send("transcript-final", text);
      // await handleRealTurn(text); // temporarily disabled
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
  currentSystemPrompt = "";
  conversationHistory = [];
  currentSessionState = null;
  console.log("[Main] Stopped");
});

ipcMain.handle("playback-done", async () => {
  // TODO: Re-enable when TTS is wired up
  console.log("[Main] playback-done called (TTS not wired up yet)");
});

ipcMain.handle("begin-session", async (_, sessionState: SessionState) => {
  console.log("[Main] begin-session called with state:", sessionState);
  currentSessionState = sessionState;
  currentSystemPrompt = buildSystemPrompt(sessionState);
  await handleKickoff(sessionState);
});
