import os
import tempfile

import edge_tts
import openai
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from faster_whisper import WhisperModel
from pydantic import BaseModel

from prompts import TOPICS, Topic, build_system_prompt

_llm = openai.OpenAI(
    base_url=os.environ["LITELLM_BASE_URL"],
    api_key=os.environ["LITELLM_API_KEY"],
    max_retries=3,
)


__all__: list[str] = []

app = FastAPI(title="English Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_whisper = WhisperModel("base", device="cpu", compute_type="int8")


@app.get("/topics")
def topics() -> dict:
    return {"topics": TOPICS}


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)) -> dict:
    data = await audio.read()
    return _transcribe_sync(data)


def _transcribe_sync(data: bytes) -> dict:
    if not data:
        return {"text": ""}

    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
        f.write(data)
        tmp_path = f.name

    try:
        segments, _ = _whisper.transcribe(tmp_path, language="en")
        text = " ".join(s.text.strip() for s in segments)
    except EOFError:
        text = ""
    finally:
        os.unlink(tmp_path)

    return {"text": text}


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    topic: Topic


@app.post("/chat")
def chat(body: ChatRequest) -> dict:
    response = _llm.chat.completions.create(
        model="dial/claude-haiku-4-5",
        # model="dial/claude-sonnet-4-6",
        max_tokens=300,
        messages=[
            {"role": "system", "content": build_system_prompt(body.topic)},
            *[m.model_dump() for m in body.messages],
        ],
    )

    return {"text": response.choices[0].message.content}


class SynthesizeRequest(BaseModel):
    text: str


@app.post("/synthesize")
async def synthesize(body: SynthesizeRequest) -> Response:
    chunks: list[bytes] = []
    communicate = edge_tts.Communicate(body.text, voice="en-US-JennyNeural")

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            chunks.append(chunk["data"])

    return Response(content=b"".join(chunks), media_type="audio/mpeg")
