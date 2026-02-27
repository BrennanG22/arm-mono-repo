import logging
import time
from typing import List, Tuple

import helpers
from dataStores import arm_telemetry, parser_arg_data
from cartesian_to_joints import ArmController

logger = logging.getLogger()

Point = Tuple[float, float, float]


class ArmManager:
    ik_active: bool = False
    move_buffer: List[Point] = None
    armController = ArmController()

    def __init__(self):
        self.is_active = parser_arg_data.get().use_ik

        if self.is_active:
            telem = arm_telemetry.get()
            self.armController.startup()
            point = (telem.position[0], telem.position[1], telem.position[2])
            self.move_to_point(point)
        pass

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
