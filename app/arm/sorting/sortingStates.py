import logging
from typing import Tuple

import numpy as np

from app.arm.sorting import armStateMachine
from app.arm import armPather, armContext, expresionEngine
import app.dataStores


def init(arm_context: armContext.ArmContext):
    asm = armStateMachine.ArmStateMachine(arm_context)

    move_to_pickup = _MoveToPickup(asm, arm_context)
    wait_for_pickup = _WaitForPickup(asm, arm_context)
    lift_up = _LiftUp(asm, arm_context)
    move_to_sort = _MoveToSort(asm, arm_context)

    asm.arm_states["move_to_pickup"] = armStateMachine.ArmState(move_to_pickup.move_to_pickup_update,
                                                                move_to_pickup.move_to_pickup_start)
    asm.arm_states["wait_for_pickup"] = armStateMachine.ArmState(wait_for_pickup.wait_for_pickup_update,
                                                                 wait_for_pickup.wait_for_pickup_start)
    asm.arm_states["lift_up"] = armStateMachine.ArmState(lift_up.lift_up_update, lift_up.lift_up_start)
    asm.arm_states["move_to_sort"] = armStateMachine.ArmState(move_to_sort.move_to_sort_update,
                                                              move_to_sort.move_to_sort_start)

    return asm


class _MoveToPickup:
    pick_up_point: Tuple[float, float, float] = None
    machine: armStateMachine.ArmStateMachine
    pather: armPather.ArmPather

    def __init__(self, machine, arm_context: armContext.ArmContext):
        self.machine = machine
        self.pather = arm_context.arm_pather
        self.arm_context = arm_context

    def move_to_pickup_start(self):
        self.arm_context.set_gripper(0)
        # data = dataStores.arm_boundary_data.get()
        data = self.arm_context.data.boundary.get()
        self.pick_up_point = data.conveyor_pickup_point
        path = self.pather.get_route_to_point(self.pick_up_point)
        self.pather.execute_path(path)

    def move_to_pickup_update(self):
        # current_data = dataStores.arm_telemetry.get()
        current_data = self.arm_context.data.telemetry.get()

        pos = np.array(current_data.position, dtype=float)
        target = np.array(self.pick_up_point, dtype=float)

        if np.allclose(pos, target, atol=1e-3):
            self.machine.goto_state("wait_for_pickup")


class _WaitForPickup:
    def __init__(self, machine, arm_context: armContext.ArmContext):
        self.machine = machine
        self.arm_context = arm_context
        self.pather = arm_context.arm_pather

    def wait_for_pickup_start(self):
        logging.info("Waiting for pickup")

    def wait_for_pickup_update(self):
        data = self.arm_context.sorting_queue.pop_if_ready()

        if data:
            # self.arm_context.data.sorting.update(
            #     lambda d: setattr(d, "active_classification", data)
            # )
            self.arm_context.data.sorting.set(active_classification=data)
            logging.info("Object detected")
            self.machine.goto_state("lift_up")


class _LiftUp:
    lift_up_point: Tuple[float, float, float] = None

    def __init__(self, machine, arm_context):
        self.machine = machine
        self.arm_context = arm_context
        self.pather = arm_context.arm_pather

    def lift_up_start(self):
        self.arm_context.set_gripper(1)

        current_data = self.arm_context.data.telemetry.get()
        x, y, z = current_data.position

        self.lift_up_point = (x, y, z + 10)

        path = self.pather.get_route_to_point(self.lift_up_point)
        self.pather.execute_path(path)

    def lift_up_update(self):
        current_data = self.arm_context.data.telemetry.get()

        pos = np.array(current_data.position, dtype=float)
        target = np.array(self.lift_up_point, dtype=float)

        if np.allclose(pos, target, atol=1e-5):
            self.machine.goto_state("move_to_sort")


class _MoveToSort:
    sorting_point: Tuple[float, float, float] = None

    def __init__(self, machine, arm_context):
        self.machine = machine
        self.arm_context = arm_context
        self.pather = arm_context.arm_pather

    def move_to_sort_start(self):
        current_sorting_data = self.arm_context.data.sorting.get()
        current_boundary_data = self.arm_context.data.boundary.get()

        classified_object = current_sorting_data.active_classification

        points = current_boundary_data.sorting_points

        for name, sp in points.items():
            if expresionEngine.evaluate_expression(sp.expression, classified_object):
                logging.info(f"Sorting to point: {name}")
                self.sorting_point = sp.point

                path = self.pather.get_route_to_point(self.sorting_point)
                self.pather.execute_path(path)
                return

        # fallback
        self.machine.goto_state("move_to_pickup")

    def move_to_sort_update(self):
        current_data = self.arm_context.data.telemetry.get()

        pos = np.array(current_data.position, dtype=float)
        target = np.array(self.sorting_point, dtype=float)

        if np.allclose(pos, target, atol=1e-5):
            # self.pather.controller.set_grip_state(0) # GAVIN - see if this fixes the stutter problem
            self.machine.goto_state("move_to_pickup")
