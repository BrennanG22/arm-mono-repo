import time
from typing import List, Tuple

from dataStores import arm_telemetry
from cartesian_to_joints import ArmController

Point = Tuple[float, float, float]


class ArmControllerA:
    is_active = True
    move_buffer: List[Point] = None
    armController = ArmController()

    def __init__(self):
        self.armController.startup()
        self.armController.move_to_position(1, 1, 1)
        pass

    def move_to_point(self, point: [float, float, float]):
        if self.is_active:
            arm_telemetry.update(lambda d: setattr(d, "requested_position", point))
            self.armController.move_to_position(point[0], point[1], point[2])
            self.armController.gripper(0)
            time.sleep(0.1)
            self.on_move_complete(point)

    def on_move_complete(self, point: [float, float, float]):
        arm_telemetry.update(lambda d: setattr(d, "requested_position", None))
        if point is not None:
            arm_telemetry.update(lambda d: setattr(d, "position", point))
