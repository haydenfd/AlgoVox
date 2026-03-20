interface Window {
  electron: {
    startListening: () => Promise<void>;
    stopListening: () => Promise<void>;
    onTranscript: (
      callback: (type: "interim" | "final", text: string) => void
    ) => void;
    onConnectionClosed: (callback: () => void) => void;
    onAgentThinking: (cb: () => void) => void;
    onAgentResponse: (cb: (text: string) => void) => void;
    onAgentToken: (cb: (token: string) => void) => void;
    onCodingStarted: (cb: () => void) => void;
    onTTSAudio: (cb: (base64: string) => void) => void;
    playbackDone: () => Promise<void>;
    beginSession: (sessionState: any) => Promise<void>;
  };
}
