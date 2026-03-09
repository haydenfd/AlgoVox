from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from .audio import record
from .transcribe import transcribe

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.websocket("/ws/transcribe")
async def transcribe_endpoint(websocket: WebSocket):
    await websocket.accept()
    loop = asyncio.get_event_loop()
    try:
        while True:
            await websocket.send_json({"type": "status", "value": "listening"})
            audio = await loop.run_in_executor(None, record)
            # only transcribe if we got valid audio
            if len(audio) > 0:
                await websocket.send_json({"type": "status", "value": "processing"})
                text = await loop.run_in_executor(None, transcribe, audio)
                if text.strip():
                    await websocket.send_json({"type": "transcript", "value": text.strip()})
    except WebSocketDisconnect:
        pass
