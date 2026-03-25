import logging
import time
from typing import List, Tuple

import app.networking.networkContext

from . import currentSensor
from . import armData, armPather, armContext, cartesian_to_joints
from .sorting import sortingStates, armStateMachine, sortingObjectQueue
from app import helpers, dataStores
from app.dataStores import ActiveMode

logger = logging.getLogger()
Point = Tuple[float, float, float]

# Configuration
GRIPPER_INDEX = 0
CURRENT_UPDATE_HOLD_TIME = 1


class ArmManager:
    arm_context: armContext.ArmContext

    ik_active: bool = False
    move_buffer: List[Point] = None

    networking_context: app.networking.networkContext.NetworkingContext

    armController: cartesian_to_joints.ArmController = cartesian_to_joints.ArmController()
    sorting_state_machine: armStateMachine.ArmStateMachine = None
    arm_pather: armPather.ArmPather
    sorting_queue: sortingObjectQueue.SortingObjectQueue = sortingObjectQueue.SortingObjectQueue()

    current_sensor: currentSensor.CurrentSensor = None

    is_active = None
    _current_start = None

    arm_data = armData.ArmData()

    def __init__(self):
        self.arm_context = armContext.ArmContext(self.arm_data,
                                                 self.move_to_point,
                                                 self.set_grip_state,
                                                 self.handel_inet_message,
                                                 self.set_control_mode,
                                                 None,
                                                 self.armController,
                                                 self.sorting_queue)
        self.arm_pather = armPather.ArmPather(self.arm_context)
        self.arm_context.arm_pather = self.arm_pather

    def start(self, networking_context: app.networking.networkContext.NetworkingContext):
        self.networking_context = networking_context

        self.current_sensor = currentSensor.CurrentSensor(self._current_update_callback)
        self.current_sensor.start()

        self.is_active = self.arm_data.parser_args.get().use_ik

        self.sorting_state_machine = sortingStates.init(self.arm_context)

        if self.is_active:
            telem = self.arm_data.telemetry.get()
            self.armController.startup()
            point = (telem.position[0], telem.position[1], telem.position[2])
            self.move_to_point(point)

    def get_context(self):
        return self.arm_context

    def main_loop(self):
        if self.arm_data.telemetry.get().active_mode is dataStores.ActiveMode.SORTING:
            if self.sorting_state_machine.current_state is None:
                self.sorting_state_machine.goto_state("move_to_pickup")
            self.sorting_state_machine.update()
        elif self.arm_data.telemetry.get().active_mode is dataStores.ActiveMode.MANUAL:
            pass

    def move_to_point(self, point: [float, float, float]):
        self.arm_data.telemetry.set(requested_position=point)
        logger.debug(f"Moving to the requested position: {helpers.log_point(point)}")
        if self.is_active:
            self.armController.move_to_position(point[0], point[1], point[2])
        else:
            time.sleep(0.1)
        self.on_move_complete(point)

    def on_move_complete(self, point: [float, float, float]):
        self.arm_data.telemetry.set(requested_position=point)
        logger.debug(f"Move to {helpers.log_point(point)} complete")
        if point is not None:
            self.arm_data.telemetry.set(position=point)

    def set_grip_state(self, state: int):
        if self.is_active:
            self.armController.gripper(state)

    def _current_update_callback(self, currents: List[float]):
        self.armController.current_sense(currents[GRIPPER_INDEX])
        now = time.monotonic()
        if self._current_start is None:
            self._current_start = now
            return
        delta = now - self._current_start
        if delta >= CURRENT_UPDATE_HOLD_TIME:
            self._current_start = now
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

    def handel_inet_message(self, msg):
        self.sorting_queue.update_from_message(msg)

    def set_control_mode(self, mode):
        if mode == "manual":
            self.arm_context.data.telemetry.update(lambda d: setattr(d, "active_mode", ActiveMode.MANUAL))
        else:
            self.arm_context.data.telemetry.update(lambda d: setattr(d, "active_mode", ActiveMode.SORTING))
            self.sorting_state_machine.current_state=None

