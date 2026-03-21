import logging
import time
from typing import List, Tuple

import helpers
import app.networking.networkingManager

import currentSensor
from dataStores import arm_telemetry, parser_arg_data
from cartesian_to_joints import ArmController

logger = logging.getLogger()
Point = Tuple[float, float, float]

# Configuration
GRIPPER_INDEX = 0
CURRENT_UPDATE_HOLD_TIME = 0.1

class ArmManager:
    ik_active: bool = False
    move_buffer: List[Point] = None

    networking_manager: app.networking.networkingManager.NetworkingManager = None
    armController = ArmController()

    current_sensor: currentSensor.CurrentSensor = None

    def __init__(self):
        self.is_active = parser_arg_data.get().use_ik

        if self.is_active:
            telem = arm_telemetry.get()
            self.armController.startup()
            point = (telem.position[0], telem.position[1], telem.position[2])
            self.move_to_point(point)
        pass

    def initialize(self, networking_manager: app.networking.networkingManager.NetworkingManager):
        self.networking_manager = networking_manager

        currentSensor.CurrentSensor(self._current_update_callback)
        self.current_sensor.start()

    def move_to_point(self, point: [float, float, float]):
        arm_telemetry.update(lambda d: setattr(d, "requested_position", point))
        logger.debug(f"Moving to the requested position: {helpers.log_point(point)}")
        if self.is_active:
            self.armController.move_to_position(point[0], point[1], point[2])
        else:
            time.sleep(0.1)
        self.on_move_complete(point)

    def on_move_complete(self, point: [float, float, float]):
        arm_telemetry.update(lambda d: setattr(d, "requested_position", None))
        logger.debug(f"Move to {helpers.log_point(point)} complete")
        if point is not None:
            arm_telemetry.update(lambda d: setattr(d, "position", point))

    def set_grip_state(self, state: int):
        if self.is_active:
            self.armController.gripper(state)

    def _current_update_callback(self, currents: List[float]):
        self.armController.current_sense(currents[GRIPPER_INDEX])
        now = time.monotonic()
        if not hasattr(self._current_update_callback, "start"):
            self._current_update_callback.start = now
            return
        delta = now - self._current_update_callback.start
        if delta >= CURRENT_UPDATE_HOLD_TIME:
            self._current_update_callback.start = now
            self.networking_manager.send_ws_message("currentUpdate",
                                                    [
                                                        currents[0],
                                                        currents[1],
                                                        currents[2],
                                                        currents[3],
                                                        currents[4],
                                                        currents[5],
                                                    ]
                                                    )
