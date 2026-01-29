import asyncio
import logging
import threading
import websockets
import json

from armPather import arm_pather_global
from dataStores import arm_telemetry, ActiveMode, arm_path_data

logger = logging.getLogger()


class WebSocketServer:
    def __init__(self, host="0.0.0.0", port=8765):
        self.host = host
        self.port = port
        self.clients = set()
        self.thread = None
        self.running = False
        self.loop = None  # Store the event loop reference

    def start(self):
        if self.thread and self.thread.is_alive():
            print(f"Server already running on ws://{self.host}:{self.port}")
            return

        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()

    def _run(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self.loop.run_until_complete(self._main())

    async def _main(self):
        async with websockets.serve(self._handler, self.host, self.port):
            self.running = True
            logger.debug(f"WebSocket server started on ws://{self.host}:{self.port}")
            await asyncio.Future()

    async def _handler(self, websocket):
        self.clients.add(websocket)
        logger.debug("Websocket client connected")
        try:
            async for message in websocket:
                websocket_message_handler(message)
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.clients.remove(websocket)

    def send_to_all(self, message):
        if not self.running or not self.loop:
            return

        async def send():
            if self.clients:
                tasks = []
                for client in list(self.clients):
                    try:
                        tasks.append(client.send(message))
                    except:
                        logger.error("Failed to send websocket message")
                if tasks:
                    await asyncio.gather(*tasks, return_exceptions=True)

        asyncio.run_coroutine_threadsafe(send(), self.loop)


def websocket_message_handler(socket_message):
    parsed_message = json.loads(socket_message)
    message = parsed_message["message"]
    data = parsed_message["data"]
    telemetry = arm_telemetry.get()
    pather_data = arm_path_data.get()

    if (message == "move") and (telemetry.active_mode == ActiveMode.MANUAL) and (pather_data is not None):
        if data["direction"] == "x+":
            updated_point = (telemetry.position[0] + data["step"], telemetry.position[1], telemetry.position[2])
            arm_pather_global.execute_path(arm_pather_global.get_route_to_point(updated_point, steps=2))
        elif data["direction"] == "x-":
            updated_point = (telemetry.position[0] - data["step"], telemetry.position[1], telemetry.position[2])
            arm_pather_global.execute_path(arm_pather_global.get_route_to_point(updated_point, steps=2))

        elif data["direction"] == "y+":
            updated_point = (telemetry.position[0], telemetry.position[1] + data["step"], telemetry.position[2])
            arm_pather_global.execute_path(arm_pather_global.get_route_to_point(updated_point, steps=2))
        elif data["direction"] == "y-":
            updated_point = (telemetry.position[0], telemetry.position[1] - data["step"], telemetry.position[2])
            arm_pather_global.execute_path(arm_pather_global.get_route_to_point(updated_point, steps=2))

        elif data["direction"] == "z+":
            updated_point = (telemetry.position[0], telemetry.position[1], telemetry.position[2] + data["step"])
            arm_pather_global.execute_path(arm_pather_global.get_route_to_point(updated_point, steps=2))
        elif data["direction"] == "z-":
            updated_point = (telemetry.position[0], telemetry.position[1], telemetry.position[2] - data["step"])
            arm_pather_global.execute_path(arm_pather_global.get_route_to_point(updated_point, steps=2))

    if message == "setControlMode":
        if data["mode"] == "manual":
            arm_telemetry.update(lambda d: setattr(d, "active_mode", ActiveMode.MANUAL))
        else:
            arm_telemetry.update(lambda d: setattr(d, "active_mode", ActiveMode.SORTING))
