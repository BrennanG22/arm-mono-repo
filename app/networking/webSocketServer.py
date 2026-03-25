import asyncio
import logging
import threading
from typing import Dict

import websockets
import json

import app.configTools
from app import helpers, configTools
from app.configTools import yaml_manager
from app.arm.armContext import ArmContext
import app.helpers
from app.dataStores import ActiveMode, SortingPoint, SortingType

logger = logging.getLogger()

REST_POINT = (30, 0, 10)


class WebSocketServer:
    def __init__(self, arm_context: ArmContext, host="0.0.0.0", port=8080, relay_enabled=False, relay_url="ws://arm.brennang.com/ws/robot"):
        self.host = host
        self.port = port
        self.clients = set()
        self.thread = None
        self.running = False
        self.loop = None  
        self.relay_enabled = relay_enabled
        self.relay_url = relay_url
        self.relay_ws = None

        self.arm_context = arm_context

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
            if self.relay_enabled:
                asyncio.create_task(self._connect_to_relay())
            await asyncio.Future()

    async def _connect_to_relay(self):
        while self.relay_enabled:
            try:
                async with websockets.connect(self.relay_url) as ws:
                    self.relay_ws = ws
                    logger.info("Connected to relay at " + self.relay_url)
                    async for message in ws:
                        self.websocket_message_handler(message)
            except Exception as e:
                logger.warning(f"Relay connection lost: {e}. Reconnecting in 3s...")
                self.relay_ws = None
                await asyncio.sleep(3)

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
            targets = list(self.clients)
            if self.relay_enabled and self.relay_ws:
                targets.append(self.relay_ws)
            tasks = [client.send(message) for client in targets]
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)

        asyncio.run_coroutine_threadsafe(send(), self.loop)

    def _initial_connect_handler(self):
        telemetry = self.arm_context.data.telemetry.get()
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

        boundary = self.arm_context.data.boundary.get()
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
        try:
            data = parsed_message["data"]
        except:
            data = ""
        telemetry = self.arm_context.data.telemetry.get()
        pather_data = self.arm_context.data.path.get()
        pather = self.arm_context.arm_pather

        if message == "initialConnect":
            self._initial_connect_handler()

        if (message == "move") and (telemetry.active_mode == ActiveMode.MANUAL) and (pather_data is not None):
            if data["direction"] == "x+":
                updated_point = (telemetry.position[0] + data["step"], telemetry.position[1], telemetry.position[2])
                pather.execute_path(pather.get_route_to_point(updated_point, steps=0))
            elif data["direction"] == "x-":
                updated_point = (telemetry.position[0] - data["step"], telemetry.position[1], telemetry.position[2])
                pather.execute_path(pather.get_route_to_point(updated_point, steps=0))

            elif data["direction"] == "y+":
                updated_point = (telemetry.position[0], telemetry.position[1] + data["step"], telemetry.position[2])
                pather.execute_path(pather.get_route_to_point(updated_point, steps=0))
            elif data["direction"] == "y-":
                updated_point = (telemetry.position[0], telemetry.position[1] - data["step"], telemetry.position[2])
                pather.execute_path(pather.get_route_to_point(updated_point, steps=0))

            elif data["direction"] == "z+":
                updated_point = (telemetry.position[0], telemetry.position[1], telemetry.position[2] + data["step"])
                pather.execute_path(pather.get_route_to_point(updated_point, steps=0))
            elif data["direction"] == "z-":
                updated_point = (telemetry.position[0], telemetry.position[1], telemetry.position[2] - data["step"])
                pather.execute_path(pather.get_route_to_point(updated_point, steps=0))
            logger.info("Received move command: Direction = %s, Step = %s", data["direction"], data["step"])

        if message == "setControlMode":
            # if data["mode"] == "manual":
            #     self.arm_context.data.telemetry.update(lambda d: setattr(d, "active_mode", ActiveMode.MANUAL))
            # else:
            #     self.arm_context.data.telemetry.update(lambda d: setattr(d, "active_mode", ActiveMode.SORTING))
            self.arm_context.set_control_mode(data["mode"])
            logger.info("Received control mode change to: " + str(data["mode"]))

        if message == "setPickUpPoint":
            # TODO Update this to save to the YAML file
            self.arm_context.data.boundary.update(lambda d: setattr(d, "conveyor_pickup_point", data["point"]))
            boundary = self.arm_context.data.boundary.get()
            pick_up_point = boundary.conveyor_pickup_point
            json_str = json.dumps({
                "message": "pickUpPoint",
                "data": [float(pick_up_point[0]), float(pick_up_point[1]), float(pick_up_point[2])]
            })
            logger.info(f"Received new conveyor point: {helpers.log_point(pick_up_point)}")
            self.send_to_all(json_str)
            data = yaml_manager.map_points_to_data()
            yaml_manager.write(data=data)

        if message == "setSortingPoints":
            data: dict = data
            new_points: Dict[str, SortingPoint] = {}
            for key, p in data.items():
                sp: SortingPoint = SortingPoint(point=p["point"], categories=p["categories"])
                new_points[key] = sp
            self.arm_context.data.boundary.update(lambda d: setattr(d, "sorting_points", new_points))
            logger.info(f"Revived new sorting points: {new_points}")
            sorting_points = self.arm_context.data.boundary.get().sorting_points
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
            data = yaml_manager.map_points_to_data()
            yaml_manager.write(data=data)

        if message == "routeToRest":
            pather.execute_path(pather.get_route_to_point(REST_POINT, steps=0))

        if message == "setSortingMode":
            data: str = data
            mode = SortingType(data["mode"])
            if mode == SortingType.COLOUR:
                self.arm_context.data.sorting.update(lambda d: setattr(d, "sort_type", SortingType.COLOUR))
            else:
                self.arm_context.data.sorting.update(lambda d: setattr(d, "sort_type", SortingType.SHAPE))
