import sounddevice as sd
from kokoro_onnx import Kokoro
import urllib.request
from pathlib import Path
import numpy as np

MODEL_PATH = "kokoro-v1.0.int8.onnx"
VOICES_PATH = "voices-v1.0.bin"
BASE_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"

def _ensure_models():
    if not Path(MODEL_PATH).exists():
        print("Downloading Kokoro model...")
        urllib.request.urlretrieve(f"{BASE_URL}/{MODEL_PATH}", MODEL_PATH)
    if not Path(VOICES_PATH).exists():
        print("Downloading Kokoro voices...")
        urllib.request.urlretrieve(f"{BASE_URL}/{VOICES_PATH}", VOICES_PATH)

_ensure_models()
kokoro = Kokoro(MODEL_PATH, VOICES_PATH)

def generate_audio(text: str):
    """Generate audio samples without playing — returns (samples, sample_rate)."""
    return kokoro.create(text, voice="am_michael", speed=1.0, lang="en-us")

def play_audio(samples, sample_rate: int) -> None:
    """Play pre-generated audio samples."""
    sd.play(samples, sample_rate)
    sd.wait()

def speak(text: str) -> None:
    samples, sample_rate = generate_audio(text)
    play_audio(samples, sample_rate)