import sounddevice as sd
import numpy as np
import webrtcvad
from collections import deque
import time

# audio config — these values are required by both webrtcvad and faster-whisper
SAMPLE_RATE = 16000          # 16kHz is what both VAD and Whisper expect
FRAME_DURATION = 30          # ms per frame — webrtcvad supports 10, 20, or 30ms
FRAME_SIZE = int(SAMPLE_RATE * FRAME_DURATION / 1000)  # 480 samples per frame
SILENCE_THRESHOLD = 25       # consecutive silent frames before stopping (~750ms)
MIN_SPEECH_FRAMES = 10       # minimum frames of speech before considering it valid (~300ms)
MAX_WAIT_TIME = 5            # seconds to wait for speech before giving up
VAD_AGGRESSIVENESS = 3       # 0-3, higher = more aggressive noise filtering

vad = webrtcvad.Vad(VAD_AGGRESSIVENESS)


def record() -> np.ndarray:
    """
    Record audio from the microphone using voice activity detection.
    Starts capturing when speech is detected, stops after sustained silence.
    Returns a numpy array of int16 audio samples.
    """
    print("Listening...")
    frames = []           # accumulated audio frames to transcribe
    silent_frames = 0     # counter for consecutive silent frames
    speech_frames = 0     # counter for total speech frames detected
    started_speaking = False
    # pre_buffer holds the last ~300ms of audio before speech is detected
    # this prevents the first syllable from getting clipped
    pre_buffer = deque(maxlen=10)
    start_time = time.time()

    with sd.RawInputStream(
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype="int16",
        blocksize=FRAME_SIZE   # read exactly one VAD frame at a time
    ) as stream:
        while True:
            # timeout — if no speech detected within MAX_WAIT_TIME, bail out
            if not started_speaking and time.time() - start_time > MAX_WAIT_TIME:
                print("No speech detected.")
                return np.array([], dtype=np.int16)

            # read one frame from the mic
            frame, _ = stream.read(FRAME_SIZE)

            # ask webrtcvad if this frame contains speech
            is_speech = vad.is_speech(frame, SAMPLE_RATE)

            # keep rolling pre-buffer before speech starts
            # so we don't miss the beginning of an utterance
            if not started_speaking:
                pre_buffer.append(frame)

            if is_speech:
                if not started_speaking:
                    print("Speech detected.")
                    # flush pre-buffer into frames so we capture
                    # the audio just before speech was confirmed
                    frames.extend(pre_buffer)
                started_speaking = True
                speech_frames += 1
                silent_frames = 0   # reset silence counter on speech
                frames.append(frame)

            elif started_speaking:
                # still recording during silence — speaker might just be pausing
                silent_frames += 1
                frames.append(frame)

                # enough consecutive silence — speaker is done
                if silent_frames >= SILENCE_THRESHOLD:
                    # only process if we got enough speech (filter out brief noises)
                    if speech_frames >= MIN_SPEECH_FRAMES:
                        print("Done listening.")
                        break
                    else:
                        # false alarm - reset and keep listening
                        print("Too short, ignoring...")
                        frames = []
                        silent_frames = 0
                        speech_frames = 0
                        started_speaking = False

    # join all raw byte frames and interpret as int16 PCM audio
    # only return if we have enough speech (final check)
    if speech_frames >= MIN_SPEECH_FRAMES:
        return np.frombuffer(b"".join(frames), dtype=np.int16)
    else:
        print("Not enough speech detected.")
        return np.array([], dtype=np.int16)