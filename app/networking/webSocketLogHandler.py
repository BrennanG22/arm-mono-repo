import json
import logging


class WebSocketHandler(logging.Handler):
    def __init__(self, websocket_send_func):
        super().__init__()
        self.websocket_send_func = websocket_send_func

    def emit(self, record):
        try:
            log_entry = {
                "levelName": record.levelname,
                "message": self.format(record),
                "messageRaw": record.message,
                "level": record.levelno
            }
            self.websocket_send_func("logUpdate", log_entry)

        except Exception:
            self.handleError(record)
