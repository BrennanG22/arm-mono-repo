import json
import logging


class WebSocketHandler(logging.Handler):
    def __init__(self, websocket_send_func):
        super().__init__()
        self.websocket_send_func = websocket_send_func

    def emit(self, record):
        try:
            log_entry = {
                "level": record.levelname,
                "message": self.format(record)
            }
            json_str = {
                "message": "logUpdate",
                "data": log_entry
            }
            self.websocket_send_func(json.dumps(json_str))

        except Exception:
            self.handleError(record)
