import sys
import threading
import time
import random
import logging
from typing import List, Callable, Any
from collections import deque

logger = logging.getLogger()

# Configuration
SPI_BUS = 0
SPI_DEVICE = 0
MAX_SPEED_HZ = 1000000
V_REF = 3.4

NUM_CHANNELS = 6
ROLLING_WINDOW = 500

IS_LINUX = sys.platform.startswith("linux")

if IS_LINUX:
    import spidev

    class SPIInterface:
        def __init__(self):
            logger.info("Starting SPI")
            self.spi = spidev.SpiDev()
            self.spi.open(SPI_BUS, SPI_DEVICE)
            self.spi.max_speed_hz = MAX_SPEED_HZ
            self.spi.mode = 0

        def xfer2(self, data):
            return self.spi.xfer2(data)

        def close(self):
            self.spi.close()

else:
    class SPIInterface:
        def __init__(self):
            logger.warning("Non linux OS detected, starting mock SPI")

        def xfer2(self, data):
            fake_value = random.randint(0, 4095)
            return [0x00, (fake_value >> 8) & 0x0F, fake_value & 0xFF]

        def close(self):
            pass


class CurrentSensor:
    def __init__(self, callback: Callable[[List[float], Any], None], ws_server):
        self.spi = SPIInterface()
        self._callback = callback
        self.ws_server = ws_server

        self._running = False
        self._thread = None

        # Rolling buffers (one per channel)
        self._buffers = [
            deque(maxlen=ROLLING_WINDOW) for _ in range(NUM_CHANNELS)
        ]

        # Running sums for fast rolling average
        self._sums = [0.0] * NUM_CHANNELS

    def start(self):
        if self._running:
            logger.warning("Tried to start current sensor while already started")
            return

        self._running = True
        self._thread = threading.Thread(
            target=self._poll_loop,
            daemon=True
        )
        self._thread.start()

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join()
        self.spi.close()

    def _poll_loop(self):
        while self._running:
            currents = self._get_current_array()

            try:
                self._callback(currents, self.ws_server)
            except Exception as e:
                logger.error("Callback failure in _poll_loop: %s", str(e))


    def _get_current_array(self) -> List[float]:
        for ch in range(NUM_CHANNELS):
            adc_value = self._read_adc(ch)

            voltage = (adc_value / 4095.0) * V_REF
            current = (voltage - V_REF / 2) / 0.4

            # If buffer full, subtract outgoing value from sum
            if len(self._buffers[ch]) == ROLLING_WINDOW:
                self._sums[ch] -= self._buffers[ch][0]

            # Append new value
            self._buffers[ch].append(current)
            self._sums[ch] += current

        # Compute rolling averages
        averages = [
            self._sums[ch] / len(self._buffers[ch])
            if self._buffers[ch]
            else 0.0
            for ch in range(NUM_CHANNELS)
        ]

        return averages

    def _read_adc(self, channel) -> int:
        if channel < 0 or channel > 7:
            raise ValueError("Channel must be 0-7")

        byte_a = 0b00000110 | (channel >> 2)
        byte_b = (channel << 6) & 0xFF

        resp = self.spi.xfer2([byte_a, byte_b, 0x00])
        value = ((resp[1] & 0x0F) << 8) | resp[2]

        return value