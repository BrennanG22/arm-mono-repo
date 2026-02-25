import dataclasses
import logging
import os.path
from typing import List, Tuple

import yaml

import dataStores


@dataclasses.dataclass
class WayPoint:
    name: str = None
    point: Tuple[float, float, float] = None


class YAMLLoader:
    def __init__(self, path):
        self.path = path
        self._mtime = None
        self.data = None

    def load(self):
        try:
            with open(self.path) as f:
                self.data = yaml.safe_load(f)

            self._mtime = os.path.getmtime(self.path)
            logging.getLogger().debug("YAML file reloaded at path: " + self.path)
        except OSError as e:
            logging.getLogger().error("YAML file failed to load: " + self.path + "with error: " + str(e))

    def check_reload(self) -> bool:
        mtime = os.path.getmtime(self.path)
        if self._mtime is None or mtime > self._mtime:
            self.load()
            return True
        return False


def map_points_file(data, update_data_store=False) -> List[WayPoint]:
    points: List[WayPoint] = []
    p: WayPoint = WayPoint
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
