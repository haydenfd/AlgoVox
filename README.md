# AlgoVox

A local voice-powered AI interviewer for algorithm and coding practice. Built with Tauri (Rust + React + TypeScript) and powered by Deepgram for speech processing and Anthropic Claude for interview intelligence.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AlgoVox Desktop App                       │
│                         (Tauri v2)                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴────────────────┐
                │                                │
        ┌───────▼────────┐              ┌───────▼────────┐
        │   Frontend     │              │    Backend     │
        │  (React + TS)  │              │     (Rust)     │
        └───────┬────────┘              └───────┬────────┘
                │                                │
        ┌───────▼────────┐              ┌───────▼────────┐
        │  React Router  │              │ Tauri Commands │
        │  - /login      │              │  - test_stt    │
        │  - /home       │              │  - test_tts    │
        │  - /session    │◄─────────────┤  - oauth_*     │
        │  - /report/:id │   invoke()   └───────┬────────┘
        └───────┬────────┘                      │
                │                                │
        ┌───────▼────────┐              ┌───────▼────────┐
        │  UI Components │              │  External APIs │
        │  - AuthContext │              │                │
        │  - Home.tsx    │              │  • Deepgram    │
        │  - Session.tsx │              │    - STT (base)│
        │  - Report.tsx  │              │    - TTS (aura)│
        │  - Login.tsx   │              │                │
        └────────────────┘              │  • Anthropic   │
                                        │    - Claude    │
                                        │                │
                                        │  • OAuth       │
                                        │    - GitHub    │
                                        │    - Google    │
                                        └────────────────┘

              Local Storage                    .env
        ┌──────────────────┐          ┌──────────────────┐
        │ • Auth tokens    │          │ • API Keys       │
        │ • User session   │          │ • OAuth secrets  │
        └──────────────────┘          └──────────────────┘
```

---

## Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Lucide React** - Icons

### Backend
- **Rust** - Native performance
- **Tauri v2** - Desktop framework
- **reqwest** - HTTP client
- **dotenvy** - Environment variables
- **serde** - JSON serialization
- **tokio** - Async runtime

### APIs & Services
- **Deepgram** - Speech-to-Text & Text-to-Speech
- **Anthropic Claude** - AI interviewer intelligence
- **GitHub/Google OAuth** - Authentication

---

## Project Structure

```
algovox/
├── src/                          # React frontend
│   ├── App.tsx                   # Main app + routing
│   ├── AuthContext.tsx           # Auth state management
│   ├── Login.tsx                 # OAuth login page
│   ├── Home.tsx                  # Dashboard + STT/TTS tests
│   ├── Session.tsx               # Interview session UI
│   └── Report.tsx                # Post-interview report
│
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── lib.rs                # Tauri commands
│   │   └── main.rs               # Entry point
│   ├── Cargo.toml                # Rust dependencies
│   ├── tauri.conf.json           # Tauri configuration
│   └── capabilities/             # Permission configs
│
├── public/                       # Static assets
├── .env                          # API keys (gitignored)
├── .env.example                  # Template
├── package.json                  # npm dependencies
├── vite.config.ts                # Vite configuration
├── tailwind.config.js            # Tailwind configuration
└── SYSTEM_PROMPT.md              # AI interviewer prompt
```

---

## Setup

### Prerequisites
- **Node.js** 18+ and npm
- **Rust** (install via [rustup](https://rustup.rs/))
- **Tauri prerequisites** (see [Tauri docs](https://tauri.app/v1/guides/getting-started/prerequisites))

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd algovox
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:
   ```env
   DEEPGRAM_API_KEY=your_deepgram_key
   ANTHROPIC_API_KEY=your_anthropic_key
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GOOGLE_CLIENT_SECRET=your_google_secret
   ```

4. **Run the development server:**
   ```bash
   npm run tauri dev
   ```

---

## How It Works

### Authentication Flow
1. User clicks "Sign in with GitHub" or "Sign in with Google"
2. Tauri spawns local HTTP server on `localhost:8080`
3. Opens OAuth provider in system browser
4. Provider redirects to `localhost:8080/callback` with auth code
5. Rust backend exchanges code for tokens
6. Frontend stores session in localStorage
7. User is redirected to `/home`

### Interview Session Flow
1. User selects a problem from the dashboard
2. Session screen loads with:
   - Monaco code editor (right 70%)
   - Transcript panel (left 30%)
   - Timer (top center)
   - Mic status indicator (bottom)
3. Voice loop (when implemented):
   - User speaks → Deepgram STT → Claude processes → Claude responds → Deepgram TTS → Audio plays
4. Code edits saved in real-time
5. Session ends → Report generated

### STT/TTS Testing
- **Test STT button**: Sends Deepgram sample audio → Returns transcript
- **Test TTS button**: Sends text → Returns audio → Plays in browser
- Uses Deepgram `base` model (cheapest for STT)
- Uses Deepgram `aura-asteria` voice (TTS)

---

## Development

### Running the App
```bash
npm run tauri dev
```
- Starts Vite dev server on `http://localhost:1420`
- Compiles Rust backend
- Opens Tauri window

### Building for Production
```bash
npm run tauri build
```
- Creates optimized bundles in `src-tauri/target/release/bundle/`
- Generates installers for macOS (.app, .dmg)

### Key Files to Know

#### Frontend
- `src/Home.tsx` - Dashboard with problem selection + API tests
- `src/Session.tsx` - Interview session (editor + transcript)
- `src/AuthContext.tsx` - Global auth state
- `src/App.tsx` - Routing configuration

#### Backend
- `src-tauri/src/lib.rs` - Tauri commands (STT, TTS, OAuth)
- `src-tauri/tauri.conf.json` - App metadata, permissions, build config
- `src-tauri/Cargo.toml` - Rust dependencies

#### Configuration
- `.env` - API keys and secrets (NOT committed)
- `SYSTEM_PROMPT.md` - AI interviewer behavior configuration

---

## API Cost Optimization

### Deepgram Pricing
- **STT (base model)**: ~$0.0025/minute (cheapest)
- **TTS (aura)**: ~$0.015/1000 characters

**Current setup uses the cheapest options to minimize costs during development.**

---

## Roadmap

- [ ] Implement real-time voice loop during sessions
- [ ] Connect Claude API for interviewer responses
- [ ] Save session transcripts and code to database
- [ ] Generate AI-powered feedback reports
- [ ] Add more coding problems
- [ ] Implement difficulty-based question selection
- [ ] Add hints system
- [ ] Code execution and test runner

---

## License

MIT
