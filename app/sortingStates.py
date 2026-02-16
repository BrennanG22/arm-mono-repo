from typing import Tuple

import numpy as np

import armStateMachine
from armPather import get_arm_pather, ArmPather
import dataStores


def init():
    asm = armStateMachine.ArmStateMachine()

    move_to_pickup = _MoveToPickup(asm)
    lift_up = _LiftUp(asm)
    move_to_sort = _MoveToSort(asm)

    asm.arm_states["move_to_pickup"] = armStateMachine.ArmState(move_to_pickup.move_to_pickup_update,
                                                                move_to_pickup.move_to_pickup_start)
    asm.arm_states["lift_up"] = armStateMachine.ArmState(lift_up.lift_up_update, lift_up.lift_up_start)
    asm.arm_states["move_to_sort"] = armStateMachine.ArmState(move_to_sort.move_to_sort_update,
                                                              move_to_sort.move_to_sort_start)

    return asm


class _MoveToPickup:
    pick_up_point: Tuple[float, float, float] = None
    machine: armStateMachine.ArmStateMachine
    pather: ArmPather

    def __init__(self, machine):
        self.machine = machine
        self.pather = get_arm_pather()

    def move_to_pickup_start(self):
        data = dataStores.arm_boundary_data.get()
        self.pick_up_point = data.conveyor_pickup_point
        path = self.pather.get_route_to_point(self.pick_up_point)
        self.pather.execute_path(path)

    def move_to_pickup_update(self):
        current_data = dataStores.arm_telemetry.get()

        pos = np.array(current_data.position, dtype=float)
        target = np.array(self.pick_up_point, dtype=float)

        if np.allclose(pos, target, atol=1e-3):
            self.machine.goto_state("lift_up")


class _WaitForPickup:
    def __init__(self, machine):
        self.machine = machine
        self.pather = get_arm_pather()

    def wait_for_pickup_start(self):
        pass

    def wait_for_pickup_update(self):
        pass


class _LiftUp:
    lift_up_point: Tuple[float, float, float] = None
    machine: armStateMachine.ArmStateMachine
    pather: ArmPather

    def __init__(self, machine):
        self.machine = machine
        self.pather = get_arm_pather()

    def lift_up_start(self):
        current_data = dataStores.arm_telemetry.get()
        x, y, z = current_data.position
        self.lift_up_point = (x, y, z + 1)
        path = self.pather.get_route_to_point(self.lift_up_point)
        self.pather.execute_path(path)

    def lift_up_update(self):
        current_data = dataStores.arm_telemetry.get()

        pos = np.array(current_data.position, dtype=float)
        target = np.array(self.lift_up_point, dtype=float)

        if np.allclose(pos, target, atol=1e-5):
            self.machine.goto_state("move_to_sort")


class _MoveToSort:
    sorting_point: tuple[float, float, float] = None
    pather: ArmPather

    def __init__(self, machine):
        self.machine = machine
        self.pather = get_arm_pather()

    def move_to_sort_start(self):
        current_sorting_data = dataStores.arm_sorting_data.get()
        current_boundary_data = dataStores.arm_boundary_data.get()
        classification = current_sorting_data.active_classification
        boundaries = current_boundary_data.sorting_points

        if classification in boundaries and classification is not None:
            self.sorting_point = boundaries[classification]
            path = self.pather.get_route_to_point(self.sorting_point)
            self.pather.execute_path(path)
        else:
            self.machine.goto_state("move_to_pickup")

    def move_to_sort_update(self):
        current_data = dataStores.arm_telemetry.get()

        pos = np.array(current_data.position, dtype=float)
        target = np.array(self.sorting_point, dtype=float)

        if np.allclose(pos, target, atol=1e-5):
            self.machine.goto_state("move_to_pickup")
