import logging

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import threading
import uvicorn

app = FastAPI()

app.mount("/", StaticFiles(directory="robot-frontend-v2/dist", html=True), name="static")

def run_api():
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")

def start_api_thread():
    thread = threading.Thread(target=run_api, daemon=True)
    thread.start()
    logging.getLogger().debug("Web server started")


