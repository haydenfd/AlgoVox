import WebSocket from "ws";
import crypto from "crypto";

export interface CartesiaCallbacks {
  onOpen: () => void;
  onAudioChunk: (pcmData: Buffer) => void;
  onDone: () => void;
  onError: (error: any) => void;
  onClose: () => void;
}

export interface CartesiaConfig {
  apiKey: string;
  voiceId: string;
  modelId?: string;
  sampleRate?: number;
  maxBufferDelayMs?: number;
}

/**
 * Creates a Cartesia WebSocket connection for text-to-speech
 */
export function createCartesiaConnection(
  config: CartesiaConfig,
  callbacks: CartesiaCallbacks
): WebSocket {
  const {
    apiKey,
    voiceId,
    modelId = "sonic-english",
    sampleRate = 44100,
    maxBufferDelayMs = 3000,
  } = config;

  console.log("[Cartesia] Opening WebSocket...");
  const ws = new WebSocket(
    `wss://api.cartesia.ai/tts/websocket?api_key=${apiKey}&cartesia_version=2024-06-10`
  );

  const contextId = crypto.randomUUID();
  let chunkCount = 0;

  ws.on("open", () => {
    console.log("[Cartesia] WebSocket open");
    callbacks.onOpen();
  });

  ws.on("message", (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());
      console.log("[Cartesia] Received message type:", msg.type);

      if (msg.type === "chunk" && msg.data) {
        const pcmData = Buffer.from(msg.data, "base64");
        chunkCount++;
        console.log(
          `[Cartesia] Chunk ${chunkCount}: ${pcmData.length} bytes PCM`
        );

        // Verify chunk is valid (16-bit samples = even number of bytes)
        if (pcmData.length % 2 !== 0) {
          console.warn(
            `[Cartesia] WARNING: Odd PCM chunk size ${pcmData.length}`
          );
        }

        // Log first few samples for debugging
        if (pcmData.length > 0) {
          const firstSamples = [];
          for (let i = 0; i < Math.min(6, pcmData.length - 1); i += 2) {
            firstSamples.push(pcmData.readInt16LE(i));
          }
          console.log(`[Cartesia] First samples:`, firstSamples);
        }

        callbacks.onAudioChunk(pcmData);
      }

      if (msg.type === "done") {
        console.log("[Cartesia] Stream done - total chunks:", chunkCount);
        callbacks.onDone();
        ws.close();
      }

      if (msg.type === "error") {
        console.error("[Cartesia] Error from server:", msg);
        console.error("[Cartesia] Error details:", JSON.stringify(msg, null, 2));
        callbacks.onError(msg);
        ws.close();
      }
    } catch (err) {
      console.error("[Cartesia] Message parse error:", err);
      console.error(
        "[Cartesia] Raw data (first 200 chars):",
        data.toString().substring(0, 200)
      );
    }
  });

  ws.on("close", () => {
    console.log("[Cartesia] WebSocket closed");
    callbacks.onClose();
  });

  ws.on("error", (err: Error) => {
    console.error("[Cartesia] WebSocket error:", err);
    callbacks.onError(err);
  });

  // Helper to send text to Cartesia
  (ws as any).sendText = (text: string, isFinal: boolean = false) => {
    const payload = {
      model_id: modelId,
      transcript: text,
      voice: {
        mode: "id",
        id: voiceId,
      },
      output_format: {
        container: "raw",
        encoding: "pcm_s16le",
        sample_rate: sampleRate,
      },
      context_id: contextId,
      continue: !isFinal,
      max_buffer_delay_ms: maxBufferDelayMs,
    };

    console.log(
      `[Cartesia] Sending text (${text.length} chars, final: ${isFinal})`
    );
    ws.send(JSON.stringify(payload));
  };

  return ws;
}
