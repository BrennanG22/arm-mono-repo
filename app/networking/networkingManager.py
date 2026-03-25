import json
import logging
import queue
import threading

from . import webSocketServer
from . import webServer
from . import socketServer, networkContext
from app.arm.armContext import ArmContext

logger = logging.getLogger()


class NetworkingManager:
    web_socket_server: webSocketServer = None
    network_context: networkContext.NetworkingContext
    arm_context: ArmContext

    prev_path = None
    prev_state = None
    web_socket_previous_point = None

    INET_data_queue = queue.Queue()

    def __init__(self):
        self.network_context = networkContext.NetworkingContext(self.send_ws_message)

    def start(self,
              arm_context: ArmContext,
              ws_host="0.0.0.0",
              ws_port=8080,
              relay_enabled="true",
              relay_url="ws://arm.brennang.com/ws/robot"):

        logger.info(f"Starting web socket server on %s %d", ws_host, ws_port)

        self.arm_context = arm_context

        self.web_socket_server = webSocketServer.WebSocketServer(
            arm_context,
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

    def get_context(self):
        return self.network_context

    def main_loop(self):

        if self.web_socket_previous_point != self.arm_context.data.telemetry.get().position:
            pos = self.arm_context.data.telemetry.get().position

            if pos is not None:
                # json_str = json.dumps({
                #     "message": "currentPoint",
                #     "data": [float(pos[0]), float(pos[1]), float(pos[2])]
                # })
                # web_socket_previous_point = pos
                # ws_server.send_to_all(json_str)
                self.web_socket_previous_point = pos
                self.send_ws_message("currentPoint", [float(pos[0]), float(pos[1]), float(pos[2])])

        # ws_points = dataStores.arm_path_data.get().active_path
        ws_points = self.arm_context.data.path.get().active_path

        ##TEMP FIX
        if ws_points is not None and ws_points != self.prev_path:
            data_serializable = [[float(x), float(y), float(z)] for x, y, z in ws_points]
            json_point_data = json.dumps(data_serializable)
            json_str = "{\"message\": \"path\", \"data\": " + json_point_data + "}"
            # ws_server.send_to_all(json_str)
            self.send_ws_message("path", data_serializable)
            self.prev_path = ws_points
        elif ws_points != self.prev_path:
            # json_str = "{\"message\": \"path\", \"data\": []}"
            self.send_ws_message("path", [])

        sorting_data = self.arm_context.data.sorting.get()

        if self.prev_state != sorting_data.active_state and sorting_data is not None:
            self.prev_state = sorting_data.active_state
            self.send_ws_message("state", sorting_data.active_state)

        try:
            msg = self.INET_data_queue.get_nowait()
            logger.debug(f"Received INET socket message: {msg}")
            self.arm_context.update_sorting_queue(msg)
        except queue.Empty:
            pass

    def send_ws_message(self, message: str, data: any):
        try:
            self.web_socket_server.send_to_all(json.dumps({
                "message": message,
                "data": data
            }))
        except:
            pass

    def handle_inet_message(self, msg):
        self.INET_data_queue.put(msg)

    def _start_socket_server(self):
        socketServer.listen_for_messages(socketServer.create_server(),
                                         lambda msg: self.handle_inet_message(msg))
