import logging
import socket
import json
import os
import sys

SOCKET_PATH = "my_socket.sock"
logger = logging.getLogger(__name__)

def create_server():
    """Create a cross-platform Unix-style socket server."""

    if os.path.exists(SOCKET_PATH):
        os.remove(SOCKET_PATH)

    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind(("127.0.0.1", 9999))
    server.listen(1)
    logger.debug("INET socket started on port 9999")
    return server


def listen_for_messages(server, callback):
    while True:
        conn, _ = server.accept()
        print("[SERVER] Client connected")
        with conn:
            buffer = b""
            while True:
                data = conn.recv(4096)
                if not data:
                    break  # client disconnected
                buffer += data
                while b"\n" in buffer:
                    line, buffer = buffer.split(b"\n", 1)
                    try:
                        msg = json.loads(line.decode())
                        callback(msg)
                    except Exception as e:
                        print("[ERROR] Invalid JSON:", e)

