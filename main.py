import sounddevice as sd
import numpy as np
from faster_whisper import WhisperModel

SAMPLE_RATE = 16000
DURATION = 5

model = WhisperModel("small.en", device="cpu", compute_type="int8")

def record():
    print("Recording... speak now")
    audio = sd.rec(
        int(DURATION * SAMPLE_RATE),
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype='int16'
    )
    sd.wait()
    print("Done recording")
    return audio

def transcribe(audio: np.ndarray) -> str:
    audio_float = audio.flatten().astype(np.float32) / 32768.0
    segments, _ = model.transcribe(audio_float, beam_size=5)
    return " ".join(segment.text for segment in segments)

def main():
    audio = record()
    print("Transcribing...")
    transcript = transcribe(audio)
    print(f"You said: {transcript}")

if __name__ == "__main__":
    main()