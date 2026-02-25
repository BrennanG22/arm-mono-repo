import asyncio
import logging
import threading
from typing import Dict

import websockets
import json

from armPather import get_arm_pather
from dataStores import arm_telemetry, ActiveMode, arm_path_data, arm_boundary_data, SortingPoint
import helpers

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
            logger.info(f"WebSocket server started on ws://{self.host}:{self.port}")
            await asyncio.Future()

    async def _handler(self, websocket):
        self.clients.add(websocket)
        logger.info("Websocket client connected")
        self._initial_connect_handler()
        try:
            async for message in websocket:
                logger.debug("Received websocket message: " + str(message))
                self.websocket_message_handler(message)
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

    def _initial_connect_handler(self):
        telemetry = arm_telemetry.get()
        pos = telemetry.position

        if pos is not None:
            json_str = json.dumps({
                "message": "currentPoint",
                "data": [float(pos[0]), float(pos[1]), float(pos[2])]
            })
            self.send_to_all(json_str)

        mode = telemetry.active_mode
        json_str = json.dumps({
            "message": "activeMode",
            "data": mode.value
        })
        self.send_to_all(json_str)

        boundary = arm_boundary_data.get()
        pick_up_point = boundary.conveyor_pickup_point
        json_str = json.dumps({
            "message": "pickUpPoint",
            "data": [float(pick_up_point[0]), float(pick_up_point[1]), float(pick_up_point[2])]
        })
        self.send_to_all(json_str)

        sorting_points = boundary.sorting_points
        json_str = json.dumps({
            "message": "sortingPoints",
            "data": {
                key: {
                    "point": [float(p.point[0]), float(p.point[1]), float(p.point[2])],
                    "categories": p.categories
                }
                for key, p in sorting_points.items()
            }
        })
        self.send_to_all(json_str)

    def websocket_message_handler(self, socket_message):
        parsed_message = json.loads(socket_message)
        message = parsed_message["message"]
        data = parsed_message["data"]
        telemetry = arm_telemetry.get()
        pather_data = arm_path_data.get()
        pather = get_arm_pather()

        if (message == "move") and (telemetry.active_mode == ActiveMode.MANUAL) and (pather_data is not None):
            if data["direction"] == "x+":
                updated_point = (telemetry.position[0] + data["step"], telemetry.position[1], telemetry.position[2])
                pather.execute_path(pather.get_route_to_point(updated_point, steps=2))
            elif data["direction"] == "x-":
                updated_point = (telemetry.position[0] - data["step"], telemetry.position[1], telemetry.position[2])
                pather.execute_path(pather.get_route_to_point(updated_point, steps=2))

            elif data["direction"] == "y+":
                updated_point = (telemetry.position[0], telemetry.position[1] + data["step"], telemetry.position[2])
                pather.execute_path(pather.get_route_to_point(updated_point, steps=2))
            elif data["direction"] == "y-":
                updated_point = (telemetry.position[0], telemetry.position[1] - data["step"], telemetry.position[2])
                pather.execute_path(pather.get_route_to_point(updated_point, steps=2))

            elif data["direction"] == "z+":
                updated_point = (telemetry.position[0], telemetry.position[1], telemetry.position[2] + data["step"])
                pather.execute_path(pather.get_route_to_point(updated_point, steps=2))
            elif data["direction"] == "z-":
                updated_point = (telemetry.position[0], telemetry.position[1], telemetry.position[2] - data["step"])
                pather.execute_path(pather.get_route_to_point(updated_point, steps=2))
            logger.info("Received move command: Direction = %s, Step = %s", data["direction"], data["step"])

        if message == "setControlMode":
            if data["mode"] == "manual":
                arm_telemetry.update(lambda d: setattr(d, "active_mode", ActiveMode.MANUAL))
            else:
                arm_telemetry.update(lambda d: setattr(d, "active_mode", ActiveMode.SORTING))
            logger.info("Received control mode change to: " + str(data["mode"]))

        if message == "setPickUpPoint":
            # TODO Update this to save to the YAML file
            arm_boundary_data.update(lambda d: setattr(d, "conveyor_pickup_point", data["point"]))
            boundary = arm_boundary_data.get()
            pick_up_point = boundary.conveyor_pickup_point
            json_str = json.dumps({
                "message": "pickUpPoint",
                "data": [float(pick_up_point[0]), float(pick_up_point[1]), float(pick_up_point[2])]
            })
            logger.info(f"Received new conveyor point: {helpers.log_point(pick_up_point)}")
            self.send_to_all(json_str)

        if message == "setSortingPoints":
            data: dict = data
            new_points: Dict[str, SortingPoint] = {}
            for key, p in data.items():
                sp: SortingPoint = SortingPoint(point=p["point"], categories=p["categories"])
                new_points[key] = sp
            arm_boundary_data.update(lambda d: setattr(d, "sorting_points", new_points))
            logger.info(f"Revived new sorting points: {new_points}")
            sorting_points = arm_boundary_data.get().sorting_points
            json_str = json.dumps({
                "message": "sortingPoints",
                "data": {
                    key: {
                        "point": [float(p.point[0]), float(p.point[1]), float(p.point[2])],
                        "categories": p.categories
                    }
                    for key, p in sorting_points.items()
                }
            })
            logger.debug("Setting sorting points as: " + json_str)
            self.send_to_all(json_str)
