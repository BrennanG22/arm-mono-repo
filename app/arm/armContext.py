from .cartesian_to_joints import ArmController
from . import armData
from .sorting import sortingObjectQueue
from typing import TYPE_CHECKING, Optional, Callable

if TYPE_CHECKING:
    from . import armPather


class ArmContext:
    data: Optional[armData.ArmData] = None

    arm_pather: "armPather.ArmPather"
    arm_controller: ArmController
    sorting_queue: sortingObjectQueue.SortingObjectQueue

    move_to_point: Optional[Callable] = None
    update_sorting_queue: Optional[Callable] = None
    set_control_mode: Optional[Callable] = None

    def __init__(self,
                 data: armData.ArmData,
                 move_to_point: Callable,
                 set_gripper: Callable,
                 update_sorting_queue: Callable,
                 set_control_mode: Callable,
                 arm_pather: "armPather.ArmPather",
                 arm_controller: ArmController,
                 sorting_queue: sortingObjectQueue.SortingObjectQueue):
        self.data = data

        self.move_to_point = move_to_point
        self.set_gripper = set_gripper
        self.update_sorting_queue = update_sorting_queue
        self.set_control_mode = set_control_mode

        self.arm_pather = arm_pather
        self.arm_controller = arm_controller
        self.sorting_queue = sorting_queue
