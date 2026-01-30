import math
import threading
from typing import List, Tuple

import coordConverter
import armControllerA
import dataStores


class ArmPather:
    active_routing = False

    current_pos: float = [0, 0, 0]
    current_pathing_pos: [float, float, float] = None

    def __init__(self):
        self.controller = armControllerA.ArmControllerA()
        pass

    def route_to_new_point(self, new_point: [float, float, float]):
        cartesian_points_3d, r_points_3d, theta_points_3d, phi_points_3d = (
            coordConverter.process_3d_trajectory(
                self.current_pos, new_point, num_points=20,
                r_constraint=(0.5, 5.0), theta_constraint=(0, 2 * math.pi), phi_constraint=(0, math.pi / 2)
            )
        )
        self.current_pos = new_point
        self.active_routing = True

        move_thread = threading.Thread(target=self._send_commands, args=(cartesian_points_3d,), daemon=True)
        move_thread.start()

        return cartesian_points_3d

    def get_route_to_point(self, route_point: Tuple[float, float, float], steps=20):
        cartesian_points_3d, r_points_3d, theta_points_3d, phi_points_3d = (
            coordConverter.process_3d_trajectory(
                dataStores.arm_telemetry.get().position, route_point, num_points=steps,
                r_constraint=(0.5, 5.0), theta_constraint=(0, 2 * math.pi), phi_constraint=(0, math.pi / 2)
            )
        )

        return cartesian_points_3d

    def execute_path(self, path: List[Tuple[float, float, float]]):
        dataStores.arm_path_data.update(lambda d: setattr(d, "active_path", path))
        move_thread = threading.Thread(target=self._send_commands, args=(path,), daemon=True)
        move_thread.start()

    def send_path(self):
        pass

    def _send_commands(self, path):
        self.active_routing = True
        for x, y, z in path:
            self.controller.move_to_point([x, y, z])
            self.current_pathing_pos = [x, y, z]
        self.active_routing = False


arm_pather_global = ArmPather()
