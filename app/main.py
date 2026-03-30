import argparse
import logging
import os
import queue
import time
from typing import Callable

from app.networking import networkingManager
from app.arm import armManager
from app.networking import webSocketServer, webSocketLogHandler
from app.configTools import yaml_manager

GRIPPER_INDEX = 0

webSocket_points_data_queue = queue.Queue()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

LOG_FILE = os.path.join(BASE_DIR, "../logs/app.log")

DEFAULT_CONFIG_PATH = "/etc/armController/waypoint_config.yaml"

LOOP_PERIOD = 0.01


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

    networking_manager = networkingManager.NetworkingManager()
    network_context = networking_manager.get_context()

    arm_manager = armManager.ArmManager()
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

    while True:
        start = time.perf_counter()

        arm_manager.main_loop()
        networking_manager.main_loop()

        elapsed = time.perf_counter() - start
        sleep_time = LOOP_PERIOD - elapsed

        if sleep_time > 0:
            time.sleep(sleep_time)


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
