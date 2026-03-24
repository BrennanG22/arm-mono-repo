import logging
import time
from typing import List, Tuple

import app.networking.networkData

from . import currentSensor
from . import armData, armPather, armContext
from .sorting import sortingStates, armStateMachine
from app import helpers, dataStores
from cartesian_to_joints import ArmController

logger = logging.getLogger()
Point = Tuple[float, float, float]

# Configuration
GRIPPER_INDEX = 0
CURRENT_UPDATE_HOLD_TIME = 0.1


class ArmManager:
    arm_context: armContext.ArmContext

    ik_active: bool = False
    move_buffer: List[Point] = None

    networking_context: app.networking.networkData.NetworkingContext

    armController: ArmController = ArmController()
    sorting_state_machine: armStateMachine.ArmStateMachine = None
    arm_pather: armPather.ArmPather = armPather.ArmPather()

    current_sensor: currentSensor.CurrentSensor = None

    is_active = None

    arm_data = armData.ArmData()

    def __init__(self):
        self.arm_context = armContext.ArmContext(self.arm_data, self.move_to_point, self.arm_pather, self.armController)

    def initialize(self, networking_context: app.networking.networkData.NetworkingContext):
        self.networking_context = networking_context

        currentSensor.CurrentSensor(self._current_update_callback)
        self.current_sensor.start()

        self.is_active = self.arm_data.parser_args.get().use_ik

        self.sorting_state_machine = sortingStates.init()

        if self.is_active:
            telem = self.arm_data.telemetry.get()
            self.armController.startup()
            point = (telem.position[0], telem.position[1], telem.position[2])
            self.move_to_point(point)

    def main_loop(self):
        if self.arm_data.telemetry.get().active_mode is dataStores.ActiveMode.SORTING:
            if self.sorting_state_machine.current_state is None:
                self.sorting_state_machine.goto_state("move_to_pickup")
            self.sorting_state_machine.update()
        elif self.arm_data.telemetry.get().active_mode is dataStores.ActiveMode.MANUAL:
            pass

    def move_to_point(self, point: [float, float, float]):
        # arm_telemetry.update(lambda d: setattr(d, "requested_position", point))
        self.arm_data.telemetry.set(requested_position=point)
        logger.debug(f"Moving to the requested position: {helpers.log_point(point)}")
        if self.is_active:
            self.armController.move_to_position(point[0], point[1], point[2])
        else:
            time.sleep(0.1)
        self.on_move_complete(point)

    def on_move_complete(self, point: [float, float, float]):
        # arm_telemetry.update(lambda d: setattr(d, "requested_position", None))
        self.arm_data.telemetry.set(requested_position=point)
        logger.debug(f"Move to {helpers.log_point(point)} complete")
        if point is not None:
            # arm_telemetry.update(lambda d: setattr(d, "position", point))
            self.arm_data.telemetry.set(requested_position=point)

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
            self.networking_context.send_ws_to_all("currentUpdate",
                                                    [
                                                        currents[0],
                                                        currents[1],
                                                        currents[2],
                                                        currents[3],
                                                        currents[4],
                                                        currents[5],
                                                    ]
                                                    )
