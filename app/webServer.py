import logging
import threading
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

host = "127.0.0.1"
port = 8000

app = FastAPI()

DIST_DIR = Path("robot-frontend-v2/dist")

app.mount(
    "/assets",
    StaticFiles(directory=DIST_DIR / "assets"),
    name="assets",
)


@app.get("/")
@app.get("/monitor")
@app.get("/configure")
@app.get("/control")
@app.get("/update")
async def serve_spa():
    return FileResponse(DIST_DIR / "index.html")


def run_api():
    uvicorn.run(app, host=host, port=8000, log_level="warning")


def start_api_thread():
    thread = threading.Thread(target=run_api, daemon=True)
    thread.start()
    logging.getLogger().info(f"Web server started on {host}:{port}")
