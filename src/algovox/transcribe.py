import numpy as np
from faster_whisper import WhisperModel

# small.en -> 500 MB model that downloads once from HF Hub and gets cached on future invocations
# int8 quantization for faster inference
model = WhisperModel("small.en", device="cpu", compute_type="int8")

def transcribe(audio: np.ndarray) -> str:
    """
    Transcribes numpy array of int16 audio samples to text.
    Converts to float32 and normalizes to [-1.0, 1.0], which is what Whisper expects.
    Returns the full transcript as a single string.
    """    
    audio_float = audio.astype(np.float32) / 32768.0
    segments, _ = model.transcribe(audio_float, beam_size=1)
    return " ".join(segment.text for segment in segments)