import argparse
import json
import logging
import os
import queue
import random
import threading
import time

import configTools
import dataStores
import socketServer
import sortingStates
import webServer
import webSocketServer
import webSocketLogHandler
from dataStores import arm_telemetry, ActiveMode, parser_arg_data
from armPather import init_arm_pather
from sortingObjectQueue import sorting_queue

INET_data_queue = queue.Queue()
webSocket_points_data_queue = queue.Queue()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

LOG_FILE = os.path.join(BASE_DIR, "../logs/app.log")

DEFAULT_CONFIG_PATH = "/etc/armController/waypoint_config.yaml"

start = time.monotonic()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--config",
        default=DEFAULT_CONFIG_PATH,
        help="Path to config file"
    )

    parser.add_argument(
        "-d",
        action="store_false",
        help="Disable IK"
    )

    args = parser.parse_args()
    config_path = args.config

    parser_arg_data.update(lambda d: setattr(d, "use_ik", args.d))

    ws_server = webSocketServer.WebSocketServer(host="localhost")
    ws_server.start()

    init_logger(ws_server)
    logger = logging.getLogger()

    web_socket_previous_point = [0, 0, 0]
    prev_path = None
    prev_state = None

    logger.info("Starting main")

    points_loader = configTools.YAMLLoader(config_path)
    points_loader.load()
    configTools.map_points_file(points_loader.data, True)

    logger.debug("Starting socket server")
    socket_thread = threading.Thread(target=start_socket_server, daemon=True)
    socket_thread.start()

    logger.debug("Starting web server")
    webServer.start_api_thread()

    logger.debug("Starting websocket server")

    init_arm_pather()

    # Start new state machine
    sorting_state_machine = sortingStates.init()
    if arm_telemetry.get().active_mode == ActiveMode.SORTING:
        sorting_state_machine.goto_state("move_to_pickup")

    # TEMP FIX: Part of temp fix below
    mode = arm_telemetry.get().active_mode

    while True:
        time.sleep(0.001)
        send_test_current(ws_server)
        # TEMP FIX: Remedy issue of transition from manual to sorting
        if mode == ActiveMode.SORTING and arm_telemetry.get().active_mode == ActiveMode.MANUAL:
            sorting_state_machine.current_state = None
        mode = arm_telemetry.get().active_mode

        try:
            ws_points = dataStores.arm_path_data.get().active_path
            ##TEMP FIX
            if ws_points is not None and ws_points != prev_path:
                data_serializable = [[float(x), float(y), float(z)] for x, y, z in ws_points]
                json_point_data = json.dumps(data_serializable)
                json_str = "{\"message\": \"path\", \"data\": " + json_point_data + "}"
                ws_server.send_to_all(json_str)
                prev_path = ws_points
            elif ws_points != prev_path:
                json_str = "{\"message\": \"path\", \"data\": []}"
                prev_path = []
                ws_server.send_to_all(json_str)

            sorting_data = dataStores.arm_sorting_data.get()
            state = "Manual"
            if sorting_data.active_state is not None and mode == ActiveMode.SORTING:
                state = sorting_data.active_state

            if prev_state != state:
                state_str = "{\"message\": \"state\", \"data\": \"" + state + "\"}"
                ws_server.send_to_all(state_str)
                prev_state = state

        except queue.Empty:
            pass

        try:
            msg = INET_data_queue.get_nowait()
            cls = msg["colour"]
            dataStores.arm_sorting_data.update(lambda d: setattr(d, "active_classification", cls))
            sorting_queue.update_from_message(msg)
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

        if arm_telemetry.get().active_mode is dataStores.ActiveMode.SORTING:
            if sorting_state_machine.current_state is None:
                sorting_state_machine.goto_state("move_to_pickup")
            sorting_state_machine.update()
        elif arm_telemetry.get().active_mode is dataStores.ActiveMode.MANUAL:
            pass
        pass


def start_socket_server():
    socketServer.listen_for_messages(socketServer.create_server(),
                                     lambda msg: INET_data_queue.put(msg))


def send_test_current(ws_server):
    now = time.monotonic()
    if not hasattr(send_test_current, "start"):
        send_test_current.start = now
        return
    delta = now - send_test_current.start
    if delta >= 0.2:
        send_test_current.start = now
        ws_server.send_to_all(json.dumps({
            "message": "currentUpdate",
            "data": [
                random.uniform(0, 2),
                random.uniform(0, 2),
                random.uniform(0, 2),
                random.uniform(0, 2),
                random.uniform(0, 2),
                random.uniform(0, 2),
            ]
        }))


def init_logger(ws_server: webSocketServer):
    if os.path.exists(LOG_FILE):
        os.remove(LOG_FILE)
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG)

    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )

    # Console handler
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    console.setFormatter(formatter)

    # File handler
    file = logging.FileHandler(LOG_FILE, mode="a")
    file.setLevel(logging.DEBUG)
    file.setFormatter(formatter)

    # Web socket handler
    ws_handler = webSocketLogHandler.WebSocketHandler(ws_server.send_to_all)
    ws_handler.setLevel(logging.DEBUG)
    ws_handler.setFormatter(formatter)

    logger.handlers.clear()
    logger.addHandler(console)
    logger.addHandler(file)
    logger.addHandler(ws_handler)

    logging.getLogger("websockets").setLevel(logging.WARNING)


if __name__ == "__main__":
    main()
