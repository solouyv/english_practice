# English Practice

Voice-based English learning assistant. Speak into the microphone, get a spoken reply with corrections and vocabulary tips.

**Stack:** FastAPI · faster-whisper (STT) · LLM via LiteLLM (OpenAI-compatible) · edge-tts (TTS) · Next.js

## Prerequisites

- Python 3.11+
- Node.js 20+
- ffmpeg (`brew install ffmpeg` on macOS, `sudo apt install ffmpeg` on Ubuntu/Debian)

## Run

```bash
make install
```

Create `backend/.env`:

```
LITELLM_BASE_URL=...
LITELLM_API_KEY=...
```

```bash
make run
```

- Frontend: http://localhost:3000 (use Chrome or Safari)
- Backend API docs: http://localhost:8000/docs

On first run faster-whisper downloads the `base` model (~140 MB).

## Usage

1. Select a topic
2. Press **Space** (don't hold) and speak English
3. Press **Space** again to send
4. Listen — the reply appears as text and plays as audio
