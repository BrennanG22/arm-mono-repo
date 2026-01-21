import json
import queue
import threading
import time
import logging


import re

import dataStores
import sortingStates


from servers import webServer, webSocketServer, socketServer

from dataStores import arm_telemetry

INET_data_queue = queue.Queue()
webSocket_points_data_queue = queue.Queue()


test_sort_point = [3, 3, 1]
reset_point = [1, 0, 1]


def main():
    web_socket_previous_point = [0, 0, 0]

    logger = logging.getLogger()

    logging.basicConfig(level=logging.WARNING)

    logging.getLogger("root").setLevel(logging.DEBUG)

    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )

    # Console handler
    console = logging.StreamHandler()
    console.setLevel(logging.DEBUG)
    console.setFormatter(formatter)

    # File handler
    file = logging.FileHandler("app.log", mode='w')
    file.setLevel(logging.DEBUG)
    file.setFormatter(formatter)

    logger.addHandler(console)
    logger.addHandler(file)

    logger.info("Starting Main")
    # Socket server startup
    socket_thread = threading.Thread(target=start_socket_server, daemon=True)
    socket_thread.start()
    print("Server is ready and listening! Executing post-startup code...")

    # Start web server
    webServer.start_api_thread()

    ws_server = webSocketServer.WebSocketServer(host="localhost")
    ws_server.start()

    # Start new state machine
    sorting_state_machine = sortingStates.init()
    sorting_state_machine.goto_state("move_to_pickup")

    dataStores.arm_boundary_data.update(default_setup)

    while True:
        time.sleep(0.001)
        try:
            ws_points = dataStores.arm_path_data.get().active_path
            data_serializable = [[float(x), float(y), float(z)] for x, y, z in ws_points]
            json_point_data = json.dumps(data_serializable)
            json_str = "{\"message\": \"path\", \"data\": " + json_point_data + "}"
            ws_server.send_to_all(json_str)

            state_str = "{\"message\": \"state\", \"data\": \"" + dataStores.arm_sorting_data.get().active_state + "\"}"
            ws_server.send_to_all(state_str)
        except queue.Empty:
            pass

        try:
            msg = INET_data_queue.get_nowait()
            cls = msg["class"]
            dataStores.arm_sorting_data.update(lambda d: setattr(d, "active_classification", cls))
            print(dataStores.arm_sorting_data.get().active_state)
        except queue.Empty:
            pass

        if web_socket_previous_point != arm_telemetry.get().position:
            pos = arm_telemetry.get().position

            if pos is not None:
                json_str = json.dumps({
                    "message": "currentPoint",
                    "data": [float(pos[0]), float(pos[1]), float(pos[2])]
                })
                web_socket_previous_point = pos
                ws_server.send_to_all(json_str)

        sorting_state_machine.update()

        pass


def convert_and_pass_message(msg, controller):
    pattern = r'\(([^,]+),([^,]+),([^)]+)\)'
    matches = re.findall(pattern, msg['point'])
    if len(matches) >= 1:
        point = tuple(float(x) for x in matches[0])

        webSocket_points_data_queue.put(controller.route_to_new_point(point))
    pass


def start_socket_server():
    socketServer.listen_for_messages(socketServer.create_server(),
                                     lambda msg: INET_data_queue.put(msg))

def default_setup(d: dataStores._BoundaryData):
    d.sorting_points["orange"] = (-1, 1.5, 0.5)


if __name__ == "__main__":
    main()
