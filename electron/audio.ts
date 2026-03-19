import Mic from "mic";

/**
 * Creates a WAV header for PCM audio data
 */
export function createWavHeader(
  dataLength: number,
  sampleRate: number,
  channels: number,
  bitsPerSample: number
): Buffer {
  const header = Buffer.alloc(44);

  // "RIFF" chunk descriptor
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLength, 4); // file size - 8
  header.write("WAVE", 8);

  // "fmt " sub-chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // sub-chunk size
  header.writeUInt16LE(1, 20); // audio format (1 = PCM)
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE((sampleRate * channels * bitsPerSample) / 8, 28); // byte rate
  header.writeUInt16LE((channels * bitsPerSample) / 8, 32); // block align
  header.writeUInt16LE(bitsPerSample, 34);

  // "data" sub-chunk
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);

  return header;
}

/**
 * Converts PCM data to WAV format
 */
export function pcmToWav(pcmData: Buffer, sampleRate: number = 44100): Buffer {
  const wavHeader = createWavHeader(pcmData.length, sampleRate, 1, 16);
  return Buffer.concat([wavHeader, pcmData]);
}

/**
 * Creates a microphone instance configured for 16kHz mono signed-integer
 */
export function createMicInstance(onData: (chunk: Buffer) => void) {
  const micInstance = Mic({
    rate: "16000",
    channels: "1",
    encoding: "signed-integer",
    bitwidth: "16",
  });

  const micStream = micInstance.getAudioStream();

  micStream.on("data", (chunk: Buffer) => {
    onData(chunk);
  });

  micStream.on("error", (err: Error) => {
    console.error("[Mic] Error:", err);
  });

  return micInstance;
}
