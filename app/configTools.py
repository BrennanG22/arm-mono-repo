import dataclasses
import logging
import os.path
import shutil
import tempfile
from typing import List, Tuple, Dict, Any

import yaml

import dataStores


@dataclasses.dataclass
class WayPoint:
    name: str = None
    point: Tuple[float, float, float] = None


class YAMLManager:
    _initialized = False
    _path = None
    _mtime = None

    def __init__(self):
        pass

    def initialize(self, path):
        self._initialized = True
        self._path = path
        self._mtime = None

    def load(self):
        if not self._initialized:
            return
        try:
            with open(self._path) as f:
                data = yaml.safe_load(f)

            self._mtime = os.path.getmtime(self._path)
            logging.getLogger().debug("YAML file reloaded at path: " + self._path)
            return data
        except OSError as e:
            logging.getLogger().error("YAML file failed to load: " + self._path + "with error: " + str(e))

    def write(self, data=None):

        if not self._initialized:
            return
        if data is None:
            return
        try:
            dir_name = os.path.dirname(self._path) or "."
            with tempfile.NamedTemporaryFile("w", delete=False, dir=dir_name) as tmp:
                yaml.safe_dump(data, tmp, sort_keys=False)
                temp_name = tmp.name

            shutil.move(temp_name, self._path)
            self._mtime = os.path.getmtime(self._path)

            logging.getLogger().debug("YAML file written safely: " + self._path)

        except OSError as e:
            logging.getLogger().error(
                "YAML file failed to write: " + self._path + " with error: " + str(e)
            )

    def check_reload(self) -> bool:
        if not self._initialized:
            return
        mtime = os.path.getmtime(self._path)
        if self._mtime is None or mtime > self._mtime:
            self.load()
            return True
        return False


def map_points_file(data, update_data_store=False) -> List[WayPoint]:
    points: List[WayPoint] = []
    p: WayPoint = WayPoint()
    sp: dataStores.SortingPoint = dataStores.SortingPoint()

    d = data["pickUpPoint"]
    p.point = (d["x"], d["y"], d["z"])
    points.append(p)
    if update_data_store:
        dataStores.arm_boundary_data.update(lambda store: setattr(store, "conveyor_pickup_point", p.point))

    d = data["sortingPoints"]
    for i in d:
        sp = dataStores.SortingPoint()
        name = i["name"]
        sp.point = (i["points"]["x"], i["points"]["y"], i["points"]["z"])
        sp.categories = i["categories"]
        points.append(sp.point)
        if update_data_store:
            dataStores.arm_boundary_data.update(lambda store: store.sorting_points.__setitem__(name, sp))

    logging.getLogger().debug("Loaded the following points: " + str(points))
    return points


def map_points_to_data() -> Dict[str, Any]:

    data = {}
    boundary = dataStores.arm_boundary_data.get()
    pickup_point = boundary.conveyor_pickup_point
    sorting_points = boundary.sorting_points

    data["pickUpPoint"] = {
        "x": pickup_point[0],
        "y": pickup_point[1],
        "z": pickup_point[2],
    }

    sorting_list = []

    for name, sp in sorting_points.items():
        sorting_list.append({
            "name": name,
            "points": {
                "x": sp.point[0],
                "y": sp.point[1],
                "z": sp.point[2],
            },
            "categories": sp.categories,
        })

    data["sortingPoints"] = sorting_list

    return data


yaml_manager = YAMLManager()
