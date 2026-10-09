# English Practice — AI Conversation Assistant

Voice-based English learning assistant. Speak into the microphone, get a response spoken back with corrections and vocabulary tips.

**Stack:** FastAPI · faster-whisper (STT) · Claude Haiku 4.5 (LLM) · edge-tts (TTS) · Next.js

---

## Prerequisites

- Python 3.11+
- Node.js 20+
- Anthropic API key → https://console.anthropic.com
- ffmpeg (required by faster-whisper)

Install ffmpeg:
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg
```

---

## Project Structure

```
english/
├── backend/
│   ├── main.py          # FastAPI server: /transcribe /chat /synthesize
│   ├── prompts.py       # System prompt builder
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── layout.tsx
    │   └── page.tsx     # Main UI
    ├── components/
    │   ├── VoiceButton.tsx
    │   └── ChatHistory.tsx
    ├── lib/
    │   └── api.ts       # Backend API calls
    └── package.json
```

---

## Setup

### 1. Backend

```bash
cd ~/english/backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure API key
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=sk-ant-...
```

On first run, faster-whisper downloads the `base` model (~140 MB). It's cached at `~/.cache/huggingface/`.

### 2. Frontend

```bash
cd ~/english/frontend

npm install
```

---

## Running

Open two terminal tabs.

**Terminal 1 — Backend:**
```bash
cd ~/english/backend
source .venv/bin/activate
ANTHROPIC_API_KEY=$(grep ANTHROPIC_API_KEY .env | cut -d= -f2) uvicorn main:app --reload
```

Or with a `.env` file loaded automatically:
```bash
cd ~/english/backend
source .venv/bin/activate
export $(cat .env | xargs) && uvicorn main:app --reload
```

Backend starts at http://localhost:8000

**Terminal 2 — Frontend:**
```bash
cd ~/english/frontend
npm run dev
```

Frontend starts at http://localhost:3000

Open http://localhost:3000 in Chrome or Safari (Firefox has limited MediaRecorder support).

---

## Usage

1. Select a topic (travel, work, daily life, hobbies, technology, food)
2. Hold the **🎤 Hold** button and speak in English
3. Release to send
4. Wait for the assistant's response — it will appear as text and play as audio
5. Repeat

The assistant will:
- Answer and ask a follow-up question each turn
- Gently correct grammar mistakes inline
- Introduce a new word every few exchanges

---

## Testing the API

You can test each endpoint independently with curl.

### Health check
```bash
curl http://localhost:8000/docs
# Opens Swagger UI with all endpoints
```

### Test /chat directly (no audio needed)
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "I went to the market yesterday and buyed some vegetables."}],
    "topic": "daily life"
  }'
```

Expected response:
```json
{"text": "That sounds wonderful! (Quick correction: we say 'bought' not 'buyed' — 'buy' is irregular.) Did you find anything unusual or exciting at the market?"}
```

### Test /synthesize
```bash
curl -X POST http://localhost:8000/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello! Let us practice some English today."}' \
  --output test_audio.mp3

# Play the result
afplay test_audio.mp3       # macOS
aplay test_audio.mp3        # Linux
```

### Test /transcribe
```bash
# Record a short clip first (macOS)
rec -r 16000 -c 1 test.wav trim 0 3

# Send to transcribe
curl -X POST http://localhost:8000/transcribe \
  -F "audio=@test.wav"
```

---

## API Reference

| Method | Endpoint | Input | Output |
|--------|----------|-------|--------|
| POST | `/transcribe` | `multipart/form-data` — field `audio` (webm/wav/mp3) | `{"text": "..."}` |
| POST | `/chat` | `{"messages": [...], "topic": "..."}` | `{"text": "..."}` |
| POST | `/synthesize` | `{"text": "..."}` | `audio/mpeg` binary |

**Topics:** `travel`, `work`, `daily life`, `hobbies`, `technology`, `food`

**Message format:**
```json
{"role": "user" | "assistant", "content": "..."}
```

---

## Cost Estimate

At `claude-haiku-4-5` pricing ($1/$5 per MTok input/output):

| Session length | Claude | Whisper* | TTS | Total |
|----------------|--------|----------|-----|-------|
| 10 minutes (~20 turns) | ~$0.05 | $0.00 | $0.00 | **~$0.05** |
| 30 minutes (~60 turns) | ~$0.20 | $0.00 | $0.00 | **~$0.20** |

*Whisper runs locally (faster-whisper), edge-tts uses Microsoft servers but is free.

---

## Troubleshooting

**`No module named 'faster_whisper'`**
```bash
source .venv/bin/activate   # make sure venv is active
pip install -r requirements.txt
```

**`ffmpeg not found`**
```bash
brew install ffmpeg   # macOS
```

**Microphone permission denied in browser**
- Chrome: click the lock icon in the address bar → allow microphone
- Must be on `localhost` or `https` — HTTP on other hosts is blocked by browsers

**`ANTHROPIC_API_KEY` not set**
```bash
export ANTHROPIC_API_KEY=sk-ant-...
uvicorn main:app --reload
```

**CORS error in browser console**
- Make sure the backend is running on port 8000
- Make sure `allow_origins` in `main.py` includes `http://localhost:3000`

**Audio doesn't play after response**
- Browser autoplay policy: the first play must be triggered by a user gesture
- Solution: click anywhere on the page before holding the mic button

**edge-tts `aiohttp` error / no internet**
- edge-tts requires internet (uses Microsoft servers)
- For offline TTS, replace with `piper-tts` (see below)

### Switching to offline TTS with piper

```bash
pip install piper-tts
# Download model
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json
```

Replace the `synthesize` endpoint in `main.py`:
```python
from piper import PiperVoice
import io
import wave

_piper = PiperVoice.load("en_US-lessac-medium.onnx")

@app.post("/synthesize")
def synthesize(body: SynthesizeRequest) -> Response:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav:
        _piper.synthesize(body.text, wav)
    return Response(content=buffer.getvalue(), media_type="audio/wav")
```

Update `synthesizeSpeech` in `frontend/lib/api.ts` — no other changes needed.
