"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  startListening: () => electron.ipcRenderer.invoke("start-listening"),
  stopListening: () => electron.ipcRenderer.invoke("stop-listening"),
  onTranscript: (callback) => {
    electron.ipcRenderer.on("transcript-interim", (_, text) => callback("interim", text));
    electron.ipcRenderer.on("transcript-final", (_, text) => callback("final", text));
  },
  onConnectionClosed: (callback) => {
    electron.ipcRenderer.on("connection-closed", callback);
  },
  onAgentThinking: (cb) => electron.ipcRenderer.on("agent-thinking", () => cb()),
  onAgentResponse: (cb) => electron.ipcRenderer.on("agent-response", (_, text) => cb(text)),
  onTTSAudio: (cb) => electron.ipcRenderer.on("tts-audio", (_, base64) => cb(base64)),
  playbackDone: () => electron.ipcRenderer.invoke("playback-done")
});
