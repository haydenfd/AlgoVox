import { useEffect, useRef, useState } from "react";

interface Props {
  onProceed: () => void;
  onCancel: () => void;
}

export function AudioCheckModal({ onProceed, onCancel }: Props) {
  const [volume, setVolume] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    let audioContext: AudioContext;
    let analyser: AnalyserNode;

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then((stream) => {
        streamRef.current = stream;
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.2; // more reactive
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          const vol = Math.min(100, (avg / 255) * 100 * 3); // multiply for sensitivity
          setVolume(vol);
          animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch((err) => {
        console.error("[AudioCheck] Mic access denied:", err);
      });

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioContext?.close();
    };
  }, []);

  const handleProceed = () => {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    onProceed();
  };

  const handleCancel = () => {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 w-[480px] relative">
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-white text-2xl font-bold mb-2">Audio Check</h2>
        <p className="text-gray-400 text-sm mb-8">
          Speak to confirm your microphone is working before the session begins.
        </p>

        <div className="w-full bg-gray-700 rounded-full h-3 mb-8">
          <div
            className="bg-white h-3 rounded-full transition-none"
            style={{ width: `${volume}%` }}
          />
        </div>

        <button
          onClick={handleProceed}
          className="w-full py-3 bg-white hover:bg-gray-200 text-black font-semibold rounded-lg transition-colors"
        >
          Proceed with Interview
        </button>
      </div>
    </div>
  );
}
