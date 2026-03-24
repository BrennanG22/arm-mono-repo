from .cartesian_to_joints import ArmController
from . import armData
from typing import TYPE_CHECKING, Optional, Callable

if TYPE_CHECKING:
    from . import armPather


class ArmContext:
    data: Optional[armData.ArmData] = None

    arm_pather: "armPather.ArmPather"
    arm_controller: ArmController

    move_to_point: Optional[Callable] = None

    def __init__(self,
                 data: armData.ArmData,
                 move_to_point: Callable,
                 arm_pather: "armPather.ArmPather",
                 arm_controller: ArmController):
        self.data = data
        self.move_to_point = move_to_point
        self.arm_pather = arm_pather
        self.arm_controller = arm_controller
