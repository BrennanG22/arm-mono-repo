import time
from typing import List, Tuple

from dataStores import arm_telemetry, parser_arg_data
from cartesian_to_joints import ArmController

Point = Tuple[float, float, float]


class ArmControllerA:
    ik_active: bool = False
    move_buffer: List[Point] = None
    armController = ArmController()

    def __init__(self):
        self.is_active = parser_arg_data.get().use_ik

        if self.is_active:
            self.armController.startup()
            self.armController.move_to_position(1, 1, 1)
        pass

    def move_to_point(self, point: [float, float, float]):
        if self.is_active:
            arm_telemetry.update(lambda d: setattr(d, "requested_position", point))
            if self.is_active:
                self.armController.move_to_position(point[0], point[1], point[2])
                self.armController.gripper(0)
            else:
                time.sleep(0.1)
            self.on_move_complete(point)

    def on_move_complete(self, point: [float, float, float]):
        arm_telemetry.update(lambda d: setattr(d, "requested_position", None))
        if point is not None:
            arm_telemetry.update(lambda d: setattr(d, "position", point))
