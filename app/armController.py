import time
from typing import List, Tuple

from dataStores import arm_telemetry

Point = Tuple[float, float, float]


class ArmController:
    is_active = True
    move_buffer: List[Point] = None

    def move_to_point(self, point: [float, float, float]):
        if self.is_active:
            arm_telemetry.update(lambda d: setattr(d, "requested_position", point))
            # Call Gavin code in thread
            time.sleep(0.1)
            self.on_move_complete(point)

    def on_move_complete(self, point: [float, float, float]):
        arm_telemetry.update(lambda d: setattr(d, "requested_position", None))
        if point is not None:
            arm_telemetry.update(lambda d: setattr(d, "position", point))
