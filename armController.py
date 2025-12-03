import math
import threading
import time

import coordConverter
# import pathPlotter


class ArmController:
    plotter = None
    active_routing = False

    current_pos: float = [0, 0, 0]
    current_pathing_pos: [float, float, float] = None

    def __init__(self):
        pass

    def route_to_new_point(self, new_point: [float, float, float]):
        cartesian_points_3d, r_points_3d, theta_points_3d, phi_points_3d = (
            coordConverter.process_3d_trajectory(
                self.current_pos, new_point, num_points=20,
                r_constraint=(0.5, 5.0), theta_constraint=(0, 2*math.pi), phi_constraint=(0, math.pi/2)
            )
        )
        self.current_pos = new_point
        self.active_routing = True

        move_thread = threading.Thread(target=self._send_commands, args=(cartesian_points_3d, ), daemon=True)
        move_thread.start()

        return cartesian_points_3d

    def send_path(self):
        pass

    def plot_path(self, path):
        self.plotter.update_plot(path)
        pass

    def _send_commands(self, path):
        self.active_routing = True
        for x, y, z in path:
            time.sleep(0.1)
            self.current_pathing_pos = [x, y, z]
        self.active_routing = False

