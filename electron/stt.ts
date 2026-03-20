import { DeepgramClient } from "@deepgram/sdk";

export interface DeepgramCallbacks {
  onOpen: () => void;
  onTranscriptInterim: (text: string) => void;
  onTranscriptFinal: (text: string) => void;
  onSpeechFinal: (text: string) => void;
  onUtteranceEnd: (text: string) => void;
  onError: (error: any) => void;
  onClose: () => void;
}

/**
 * Creates and connects to Deepgram for speech-to-text
 */
export async function createDeepgramConnection(
  apiKey: string,
  callbacks: DeepgramCallbacks
) {
  console.log("[Deepgram] Creating new connection...");
  const deepgram = new DeepgramClient({ apiKey });

  const connection = await deepgram.listen.v1.connect({
    model: "nova-2",
    language: "en",
    encoding: "linear16",
    sample_rate: 16000,
    channels: 1,
    interim_results: true as any,
    endpointing: 1500,
    utterance_end_ms: 2000,
  });

  let lastFinalTranscript = "";
  let utteranceProcessed = false;

  connection.on("open", () => {
    console.log("[Deepgram] Connection opened");
    callbacks.onOpen();
  });

  connection.on("message", async (data: any) => {
    console.log("[Deepgram] Raw event:", JSON.stringify(data, null, 2));

    if (data.type === "Results") {
      const transcript = data.channel?.alternatives?.[0]?.transcript;
      if (!transcript?.trim()) return;

      if (data.is_final) {
        // Accumulate transcript instead of replacing
        lastFinalTranscript += (lastFinalTranscript ? " " : "") + transcript;
        lastFinalTranscript = lastFinalTranscript.trim();
        console.log("[Deepgram] is_final accumulated:", lastFinalTranscript);
        callbacks.onTranscriptFinal(transcript);
      }

      if (data.speech_final) {
        console.log("[Deepgram] speech_final - full transcript:", lastFinalTranscript);
        if (!utteranceProcessed && lastFinalTranscript.trim()) {
          utteranceProcessed = true;
          callbacks.onSpeechFinal(lastFinalTranscript);
          lastFinalTranscript = "";
        }
      } else if (!data.is_final) {
        console.log("[Deepgram] interim:", transcript);
        callbacks.onTranscriptInterim(transcript);
      }
    }

    if (data.type === "UtteranceEnd") {
      if (!utteranceProcessed && lastFinalTranscript.trim()) {
        console.log("[Deepgram] UtteranceEnd — final transcript:", lastFinalTranscript);
        utteranceProcessed = true;
        callbacks.onUtteranceEnd(lastFinalTranscript);
        lastFinalTranscript = "";
      }
      // Reset flag for next utterance
      utteranceProcessed = false;
    }
  });

  connection.on("error", (err: any) => {
    console.error("[Deepgram] Error:", err);
    callbacks.onError(err);
  });

  connection.on("close", () => {
    console.log("[Deepgram] Connection closed");
    callbacks.onClose();
  });

  connection.connect();
  await connection.waitForOpen();
  console.log("[Deepgram] Connection established and ready");

  return connection;
}
