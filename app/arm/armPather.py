import logging
import threading
from typing import List, Tuple, Optional

from . import coordConverter
from . import armContext

logger = logging.getLogger()


class ArmPather:
    arm_context: armContext.ArmContext

    active_routing = False
    current_pos: float = [0, 0, 0]
    current_pathing_pos: [float, float, float] = None

    def __init__(self, arm_context: armContext.ArmContext):
        self.arm_context = arm_context

    def get_route_to_point(self, route_point: Tuple[float, float, float], steps=0):
        cartesian_points_3d, r_points_3d, theta_points_3d, phi_points_3d = (
            coordConverter.process_3d_trajectory(
                # dataStores.arm_telemetry.get().position, route_point, num_points=steps
                self.arm_context.data.telemetry.get().position, route_point, num_points=steps
            )
        )

        return cartesian_points_3d

    def execute_path(self, path: List[Tuple[float, float, float]]):
        # dataStores.arm_path_data.update(lambda d: setattr(d, "active_path", path))
        self.arm_context.data.path.set(active_path=path)
        move_thread = threading.Thread(target=self._send_commands, args=(path,), daemon=True)
        move_thread.start()

    def _send_commands(self, path):
        self.active_routing = True
        for x, y, z in path:
            self.arm_context.move_to_point([x, y, z])
            self.current_pathing_pos = [x, y, z]
        # dataStores.arm_path_data.update(lambda d: setattr(d, "active_path", []))
        self.arm_context.data.path.set(active_path=[])
        self.active_routing = False


arm_pather: Optional["ArmPather"] = None


def init_arm_pather() -> None:
    global arm_pather
    if arm_pather is not None:
        logger.critical("ArmPather was reinitialized while already started")
        raise RuntimeError("ArmPather already initialized")

    arm_pather = ArmPather()


def get_arm_pather() -> ArmPather:
    if arm_pather is None:
        logger.critical("ArmPather was accessed before it was initialized")
        raise RuntimeError("ArmPather not initialized yet")
    return arm_pather
