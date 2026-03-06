import sounddevice as sd
import numpy as np
import webrtcvad
from faster_whisper import WhisperModel
from collections import deque
import time

SAMPLE_RATE = 16000
FRAME_DURATION = 30
FRAME_SIZE = int(SAMPLE_RATE * FRAME_DURATION / 1000)
SILENCE_THRESHOLD = 30
MAX_WAIT_TIME = 10
VAD_AGGRESSIVENESS = 2

model = WhisperModel("small.en", device="cpu", compute_type="int8")
vad = webrtcvad.Vad(VAD_AGGRESSIVENESS)

def record() -> np.ndarray:
    print("Listening...")
    frames = []
    silent_frames = 0
    started_speaking = False
    pre_buffer = deque(maxlen=10)  # ~300ms pre-roll
    start_time = time.time()

    with sd.RawInputStream(samplerate=SAMPLE_RATE, channels=1, dtype='int16', blocksize=FRAME_SIZE) as stream:
        while True:
            if not started_speaking and time.time() - start_time > MAX_WAIT_TIME:
                print("No speech detected.")
                return np.array([], dtype=np.int16)

            frame, _ = stream.read(FRAME_SIZE)
            is_speech = vad.is_speech(frame, SAMPLE_RATE)

            if not started_speaking:
                pre_buffer.append(frame)

            if is_speech:
                if not started_speaking:
                    print("Speech detected.")
                    frames.extend(pre_buffer)
                started_speaking = True
                silent_frames = 0
                frames.append(frame)
            elif started_speaking:
                silent_frames += 1
                frames.append(frame)
                if silent_frames >= SILENCE_THRESHOLD:
                    print("Done listening.")
                    break

    return np.frombuffer(b"".join(frames), dtype=np.int16)

def transcribe(audio: np.ndarray) -> str:
    audio_float = audio.astype(np.float32) / 32768.0
    segments, _ = model.transcribe(audio_float, beam_size=1)
    return " ".join(segment.text for segment in segments)

def main():
    audio = record()
    if len(audio) == 0:
        return
    print("Transcribing...")
    transcript = transcribe(audio)
    print(f"You said: {transcript}")

if __name__ == "__main__":
    main()