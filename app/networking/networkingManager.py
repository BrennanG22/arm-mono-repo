import json
import logging
import queue
import threading

import webSocketServer
import webServer
import socketServer
from app import arm

logger = logging.getLogger()


class NetworkingManager:
    web_socket_server: webSocketServer = None

    INET_data_queue = queue.Queue()

    arm_manager: arm.armManager.ArmManager = None

    def __init__(self):
        pass

    def initialize(self,
                   ws_host="0.0.0.0",
                   ws_port=8080,
                   relay_enabled="true",
                   relay_url="ws://arm.brennang.com/ws/robot"):

        logger.info(f"Starting web socket server on %s %d", ws_host, ws_port)
        self.web_socket_server = webSocketServer.WebSocketServer(
            host=ws_host,
            port=ws_port,
            relay_enabled=relay_enabled,
            relay_url=relay_url)

        self.web_socket_server.start()

        logger.info("Starting web server")
        webServer.start_api_thread()

        logger.info("Starting INET socket server")
        socket_thread = threading.Thread(target=self._start_socket_server, daemon=True)
        socket_thread.start()

    def network_loop_update(self):
        pass

    def send_ws_message(self, message: str, data: any):
        self.web_socket_server.send_to_all(json.dumps({
            "message": message,
            "data": data
        }))

    def handle_INET_message(self, msg):
        self.INET_data_queue.put(msg)

    def _start_socket_server(self):
        socketServer.listen_for_messages(socketServer.create_server(),
                                         lambda msg: self.handle_INET_message(msg))
