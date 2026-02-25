import queue
from collections import deque
from dataclasses import dataclass


@dataclass
class ObjectData:
    index: int
    colour: str
    shape: str
    is_ready: bool


class SortingObjectQueue:
    _queue = deque()
    _items: dict[int, ObjectData] = {}

    def update_from_message(self, message: str):
        index = message["index"]
        data = ObjectData(
            index=index,
            colour=message["colour"],
            shape=message["shape"],
            is_ready=True if message["Object Ready"] == "Ready" else False
        )
        if index not in self._items:
            self._queue.append(index)
        self._items[index] = data

    def pop_if_ready(self) -> ObjectData:
        if not self._queue:
            return None

        index = self._queue[0]
        data: ObjectData = self._items[index]

        if data.is_ready:
            self._queue.popleft()
            self._items.pop(index)

            return data
        return None

    def dump_all(self):
        print("Queue: " + str(self._queue))
        print("Dict: " + str(self._items))


sorting_queue: SortingObjectQueue = SortingObjectQueue()
