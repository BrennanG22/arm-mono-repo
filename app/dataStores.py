import dataclasses
import threading
from dataclasses import dataclass, field
from enum import Enum
from typing import Tuple, List, Optional, TypeVar, Generic, Callable, Dict
import copy
from app.arm.sorting import sortingObjectQueue

T = TypeVar("T")


class ActiveMode(Enum):
    MANUAL = "manual"
    SORTING = "sorting"


class SortingType(Enum):
    COLOUR = "colour"
    SHAPE = "shape"


@dataclass
class SortingPoint:
    point: [float, float, float] = None
    expression: str = None

    def list_points(self) -> str:
        return f"Point: X:{self.point[0]} Y:{self.point[1]} Z:{self.point[2]}, Expression: {self.expression}"


@dataclass
class _ArmTelemetryData:
    servo_current: List[float] = field(default_factory=list)
    position: Tuple[float, float, float] = (20, 0, 20)
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
    active_classification: sortingObjectQueue.ObjectData = None
    sort_type: SortingType = SortingType.COLOUR


@dataclass
class _BoundaryData:
    sorting_points: Dict[str, SortingPoint] = field(default_factory=dict)
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

    def set(self, **kwargs) -> None:
        with self._lock:
            self._data = dataclasses.replace(self._data, **kwargs)
