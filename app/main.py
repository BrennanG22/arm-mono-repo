import argparse
import json
import logging
import os
import queue
import time
from typing import Callable


import networking.networkingManager
import arm.armManager
# from app.arm.armPather import init_arm_pather
from app.networking import webSocketServer, webSocketLogHandler
from app.configTools import yaml_manager

GRIPPER_INDEX = 0

webSocket_points_data_queue = queue.Queue()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

LOG_FILE = os.path.join(BASE_DIR, "../logs/app.log")

DEFAULT_CONFIG_PATH = "/etc/armController/waypoint_config.yaml"


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

    networking_manager = networking.networkingManager.NetworkingManager()
    network_context = networking_manager.get_context()

    arm_manager = arm.armManager.ArmManager()
    arm_context = arm_manager.get_context()

    arm_context.data.parser_args.set(use_ik=args.d)

    init_logger(networking_manager.send_ws_message)
    logger = logging.getLogger()

    logger.info("Starting main")

    yaml_manager.initialize(config_path, arm_context)
    data = yaml_manager.load()
    yaml_manager.map_points_file(data, True)

    networking_manager.start(arm_context)
    arm_manager.start(network_context)

    # init_arm_pather()

    # if arm_telemetry.get().active_mode == ActiveMode.SORTING:
    #     sorting_state_machine.goto_state("move_to_pickup")
    #
    # # TEMP FIX: Part of temp fix below
    # mode = arm_telemetry.get().active_mode

    while True:
        time.sleep(0.001)
        arm_manager.main_loop()
        networking_manager.main_loop()

        # # TEMP FIX: Remedy issue of transition from manual to sorting
        # if mode == ActiveMode.SORTING and arm_telemetry.get().active_mode == ActiveMode.MANUAL:
        #     sorting_state_machine.current_state = None
        # mode = arm_telemetry.get().active_mode
        #
        # try:
        #
        #
        #     sorting_data = dataStores.arm_sorting_data.get()
        #     state = "Manual"
        #     if sorting_data.active_state is not None and mode == ActiveMode.SORTING:
        #         state = sorting_data.active_state
        #
        #     if prev_state != state:
        #         state_str = "{\"message\": \"state\", \"data\": \"" + state + "\"}"
        #         ws_server.send_to_all(state_str)
        #         prev_state = state
        #
        # except queue.Empty:
        #     pass
        #
        # try:
        #
        #     # cls = msg["colour"]
        #     # dataStores.arm_sorting_data.update(lambda d: setattr(d, "active_classification", cls))
        #     # sorting_queue.update_from_message(msg)
        # except queue.Empty:
        #     pass


def init_logger(send_to_all: Callable):
    # Ensure log directory exists
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

    # Remove old log file
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

    # File handler (this WILL create file if missing)
    file_handler = logging.FileHandler(LOG_FILE, mode="a", encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)

    # Web socket handler
    ws_handler = webSocketLogHandler.WebSocketHandler(send_to_all)
    ws_handler.setLevel(logging.DEBUG)
    ws_handler.setFormatter(formatter)

    logger.handlers.clear()
    logger.addHandler(console)
    logger.addHandler(file_handler)
    logger.addHandler(ws_handler)

    logging.getLogger("websockets").setLevel(logging.WARNING)


if __name__ == "__main__":
    main()
