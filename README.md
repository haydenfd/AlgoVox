# AlgoVox

AlgoVox is a desktop mock-interview app built with Electron, React, TypeScript, and Vite. The current codebase is centered around a local voice-loop prototype: microphone audio goes to live STT, the transcript is sent to an LLM, the LLM response is streamed into TTS, and the spoken response is played back in the app.

The repo no longer uses the old Tauri/Rust setup described in previous docs. It is now an Electron app with IPC between the renderer and the main process. Supabase is not wired into the tracked code at the moment, so this README documents the current implementation rather than the longer-term plan.

---

## Current Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                        Electron App                          │
├──────────────────────────────────────────────────────────────┤
│ Renderer (React/Vite)                                       │
│ - Landing page                                               │
│ - Home dashboard                                             │
│ - Mic Test UI                                                │
│ - Session editor shell                                       │
│ - Report view                                                │
└───────────────┬──────────────────────────────────────────────┘
                │ IPC via preload bridge
┌───────────────▼──────────────────────────────────────────────┐
│ Electron Main Process                                       │
│ - Owns app lifecycle                                        │
│ - Opens/closes microphone                                   │
│ - Manages Deepgram live transcription connection            │
│ - Calls Anthropic streaming API for each completed turn     │
│ - Opens Cartesia TTS websocket for each response            │
│ - Sends transcript / agent text / audio chunks to renderer  │
└───────┬───────────────────────────────┬──────────────────────┘
        │                               │
        │                               │
┌───────▼──────────┐          ┌─────────▼──────────────────────┐
│ Deepgram         │          │ Anthropic + Cartesia           │
│ Live STT         │          │ - Anthropic streams text       │
│ - Persistent     │          │ - Cartesia streams PCM audio   │
│   while listening│          │ - Cartesia WS is per turn now  │
└──────────────────┘          └────────────────────────────────┘
```

---

## What Exists Right Now

- The app shell is Electron + React, not Tauri.
- The main interactive voice prototype lives in the `Mic Test` tab inside `Home`.
- `Session.tsx` is currently a separate coding-session UI shell with a timer, transcript panel placeholder, and Monaco editor.
- The current voice loop is not yet mounted into the session screen.
- `SYSTEM_PROMPT.md` exists as interviewer behavior guidance, but the runtime currently uses an inline Anthropic system prompt in the Electron main process.
- I did not find Supabase code in the tracked files. If Supabase is part of the target architecture, it has not been integrated into this repo yet.

---

## Tech Stack

### Desktop App
- Electron
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

### Voice / AI
- Deepgram SDK for live STT
- Anthropic streaming Messages API for response generation
- Cartesia websocket TTS for streamed audio output
- `mic` for microphone capture

---

## Project Structure

```text
algovox/
├── electron/
│   ├── main.ts              # Electron main process, voice loop orchestration
│   └── preload.ts           # Safe IPC bridge exposed to the renderer
├── src/
│   ├── App.tsx              # Router
│   ├── Landing.tsx          # Entry screen
│   ├── Home.tsx             # Dashboard + Mic Test voice loop UI
│   ├── Session.tsx          # Editor/session shell
│   ├── Report.tsx           # Mock report screen
│   ├── main.tsx             # React entry
│   ├── index.css            # App styling
│   └── electron.d.ts        # Renderer typings for window.electron
├── SYSTEM_PROMPT.md         # Draft interviewer prompt/spec
├── vite.config.ts           # Vite + Electron plugin config
├── package.json
└── README.md
```

---

## Setup

### Prerequisites

- Node.js 18+ and npm
- macOS with `sox` installed if you are using the current microphone setup

```bash
brew install sox
```

### Install

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root with:

```env
DEEPGRAM_API_KEY=...
ANTHROPIC_API_KEY=...
CARTESIA_API_KEY=...
```

### Run Locally

```bash
npm run dev
```

That starts the Vite dev server and launches Electron through `vite-plugin-electron`.

### Build

```bash
npm run build
```

That runs TypeScript compilation, builds the renderer, and then packages the Electron app with `electron-builder`.

---

## Voice Loop: Current Runtime Flow

### Start Listening

1. The renderer calls `window.electron.startListening()`.
2. Electron main creates a Deepgram live transcription connection.
3. Electron main opens the local mic and streams PCM chunks into Deepgram.
4. The renderer begins showing interim transcript updates from IPC events.

### When the User Finishes Speaking

1. Deepgram emits transcript results.
2. On a completed utterance, Electron main stops the mic for the turn.
3. The final transcript is sent to the renderer.
4. Electron main starts `handleTurn(transcript)`.

### LLM to TTS

1. Electron main opens a new Cartesia websocket for that turn.
2. Electron main sends a streaming request to Anthropic.
3. As Anthropic returns text deltas, Electron forwards each token chunk into Cartesia.
4. Cartesia returns PCM audio chunks over websocket.
5. Electron wraps each PCM chunk in a WAV header and sends base64 audio to the renderer.

### Playback and Turn Reset

1. The renderer queues audio chunks and plays them sequentially.
2. After each chunk ends, the renderer calls `window.electron.playbackDone()`.
3. When all TTS chunks have finished, Electron main reopens the mic.
4. Listening continues until the user clicks stop.

### Stop Listening

1. The renderer calls `window.electron.stopListening()`.
2. Electron main stops the mic.
3. Electron main finishes the Deepgram connection and resets turn state.
4. The current listening session ends.

---

## Websocket Lifecycle: Current State

The current behavior is only partially aligned with the goal of “keep all websockets alive until stop.”

- Deepgram is intended to stay open for the full listening session.
- Cartesia does not stay open for the full listening session right now. A new websocket is opened for each response turn and then closed.
- Anthropic is currently used through a streaming HTTP response per turn, not a persistent websocket.

So today the app behaves more like:

`Start listening` -> open Deepgram -> repeat per turn: `Anthropic stream + Cartesia websocket` -> `Stop listening` -> close Deepgram

not:

`Start listening` -> keep all live connections open -> `Stop listening` -> close all

---

## Current Rough Edges

These are the main reasons the setup feels janky right now:

- The session-level “persistent websocket” model is only implemented for Deepgram. Cartesia is still opened and closed inside each turn.
- Turn recovery logic is spread across multiple places in `electron/main.ts` (`Cartesia close`, `Cartesia error`, `Deepgram close`, and `playback-done`), which makes reconnect behavior brittle.
- Mic reopen timing depends on renderer playback acknowledgements, so audio playback issues can affect backend state progression.
- The audio queue is managed in the renderer with ad hoc state and object URLs rather than a more explicit audio streaming pipeline.
- The voice loop currently lives in `Home.tsx`, while the actual coding interview UI in `Session.tsx` is still mostly a shell.
- The repo docs previously claimed Supabase/Tauri behavior that does not exist in the current tracked implementation.

---

## Files To Read First

- `electron/main.ts`: core voice-loop orchestration
- `electron/preload.ts`: renderer IPC surface
- `src/Home.tsx`: current Mic Test UI and audio playback queue
- `src/Session.tsx`: target interview surface, not yet voice-enabled
- `SYSTEM_PROMPT.md`: intended interviewer behavior spec

---

## Near-Term Architecture Goal

The target behavior appears to be:

- Clicking `Start Listening` should open the session-level realtime connections once.
- Those live connections should stay open across multiple back-and-forth turns.
- The mic should pause only while the agent is speaking, then resume without tearing down the session transport.
- Clicking `Stop Listening` should close the mic and all session-scoped connections cleanly.

That is not the current runtime shape yet, but it is the right direction for simplifying turn state and reducing reconnect churn.

---

## Useful guide documents 

**TTS Streaming w/ Continuations (Cartesia)** - https://docs.cartesia.ai/build-with-cartesia/capability-guides/stream-inputs-using-continuations
