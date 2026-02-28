import sys
import threading
import time
import random
import logging
from typing import List, Callable, Any

logger = logging.getLogger()

# Configuration
SPI_BUS = 0
SPI_DEVICE = 0  # Use CE0
MAX_SPEED_HZ = 1_000_00
POLL_RATE = 0.1  # Poll rate in seconds
V_REF = 3.3  # V_ref in volts

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
            # Return fake 12-bit ADC response
            fake_value = random.randint(0, 4095)
            return [0x00, (fake_value >> 8) & 0x0F, fake_value & 0xFF]

        def close(self):
            pass


class CurrentSensor:
    def __init__(self, callback: Callable[[List[float], Any], None], ws_server):
        """
        callback: function that receives current list
        """
        self.spi = SPIInterface()
        self._callback = callback

        # TODO fix the ws server
        self.ws_server = ws_server

        self._running = False
        self._thread = None

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
                logger.error("Failed to callback in current sensors _poll_loop: %s", str(e))

            time.sleep(POLL_RATE)

    def _get_current_array(self) -> List[float]:
        currents = []
        for i in range(6):
            voltage = (self._read_adc(i) / 4095) * V_REF
            current = voltage * 0.4
            currents.append(current)
        return currents

    def _read_adc(self, channel) -> int:
        """
        Read 12-bit value from MCP3208 on 'channel' [0-7].
        Returns an integer between 0 and 4095.
        """
        if channel < 0 or channel > 7:
            raise ValueError("Channel must be 0-7")

        # MCP3208 control bits:
        # Structure is 0000011C CCXXXXXX XXXXXXXX
        byte_a = 0b00000110 | (channel >> 2)
        byte_b = (channel << 6) & 0xFF

        resp = self.spi.xfer2([byte_a, byte_b, 0x00])

        # Parse the 12-bit response:
        # resp[1] & 0x0F are top 4 bits
        # resp[2] are bottom 8 bits
        value = ((resp[1] & 0x0F) << 8) | resp[2]
        return value
