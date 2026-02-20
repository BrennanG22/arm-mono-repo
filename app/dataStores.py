import threading
from dataclasses import dataclass, field
from enum import Enum
from typing import Tuple, List, Optional, TypeVar, Generic, Callable, Dict
import copy

T = TypeVar("T")


class ActiveMode(Enum):
    MANUAL = "manual"
    SORTING = "sorting"


@dataclass
class SortingPoint:
    point: [float, float, float]
    categories: List[str]


@dataclass
class _ArmTelemetryData:
    servo_current: List[float] = field(default_factory=list)
    position: Tuple[float, float, float] = (1.0, 1.0, 1.0)
    requested_position: Optional[Tuple[float, float, float]] = None
    active_mode: ActiveMode = ActiveMode.MANUAL


@dataclass
class _ParserArguments:
    use_ik: bool = False


@dataclass
class _ArmPathData:
    active_path: Optional[Tuple[float, float, float]] = None


@dataclass
class _SortingData:
    active_state: str = None
    sorting_categories: List[str] = None
    object_position: Tuple[float, float, float] = None
    planned_paths: Dict[str, List[Tuple[float, float, float]]] = field(default_factory=dict)
    active_classification: str = None


@dataclass
class _BoundaryData:
    sorting_points: Dict[str, Tuple[float, float, float]] = field(default_factory=dict)
    conveyor_pickup_point: Tuple[float, float, float] = (1, 1, 1)


class DataStore(Generic[T]):
    def __init__(self, init_data: T):
        self._lock = threading.Lock()
        self._data = init_data

    def get(self) -> T:
        with self._lock:
            return copy.deepcopy(self._data)

    def update(self, updater: Callable[[T], None]) -> None:
        with self._lock:
            updater(self._data)


arm_telemetry = DataStore(_ArmTelemetryData())
arm_path_data = DataStore(_ArmPathData())
arm_sorting_data = DataStore(_SortingData())
arm_boundary_data = DataStore(_BoundaryData())
parser_arg_data = DataStore(_ParserArguments())
