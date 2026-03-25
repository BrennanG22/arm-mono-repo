from typing import Callable


class NetworkingContext:
    def __init__(self, send_ws_to_all: Callable):
        self.send_ws_to_all = send_ws_to_all
