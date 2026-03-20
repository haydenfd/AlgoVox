import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  startListening: () => ipcRenderer.invoke("start-listening"),
  stopListening: () => ipcRenderer.invoke("stop-listening"),
  onTranscript: (callback: (type: "interim" | "final", text: string) => void) => {
    ipcRenderer.on("transcript-interim", (_, text) => callback("interim", text));
    ipcRenderer.on("transcript-final", (_, text) => callback("final", text));
  },
  onConnectionClosed: (callback: () => void) => {
    ipcRenderer.on("connection-closed", callback);
  },
  onAgentThinking: (cb: () => void) => ipcRenderer.on("agent-thinking", () => cb()),
  onAgentResponse: (cb: (text: string) => void) => ipcRenderer.on("agent-response", (_, text) => cb(text)),
  onAgentToken: (cb: (token: string) => void) => ipcRenderer.on("agent-token", (_, token) => cb(token)),
  onCodingStarted: (cb: () => void) => ipcRenderer.on("coding-started", () => cb()),
  onTTSAudio: (cb: (base64: string) => void) => ipcRenderer.on("tts-audio", (_, base64) => cb(base64)),
  playbackDone: () => ipcRenderer.invoke("playback-done"),
  beginSession: (sessionState: any) => ipcRenderer.invoke("begin-session", sessionState),
});
