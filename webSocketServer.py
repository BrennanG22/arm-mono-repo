# simple_ws.py
import asyncio
import threading
import websockets


class WebSocketServer:
    def __init__(self, host="0.0.0.0", port=8765):
        self.host = host
        self.port = port
        self.clients = set()
        self.thread = None
        self.running = False
        self.loop = None  # Store the event loop reference

    def start(self):
        if self.thread and self.thread.is_alive():
            print(f"Server already running on ws://{self.host}:{self.port}")
            return

        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()

    def _run(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self.loop.run_until_complete(self._main())

    async def _main(self):
        async with websockets.serve(self._handler, self.host, self.port):
            self.running = True
            print(f"WebSocket server started on ws://{self.host}:{self.port}")
            await asyncio.Future()  # Run forever

    async def _handler(self, websocket):
        self.clients.add(websocket)
        print("Web Socket Client Connected")
        try:
            async for message in websocket:
                # Echo messages back to client
                await websocket.send(f"Server received: {message}")
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.clients.remove(websocket)

    def send_to_all(self, message):
        if not self.running or not self.loop:
            return

        async def send():
            if self.clients:  # Check if there are clients
                tasks = []
                for client in list(self.clients):
                    try:
                        tasks.append(client.send(message))
                    except:
                        pass
                if tasks:
                    await asyncio.gather(*tasks, return_exceptions=True)

        asyncio.run_coroutine_threadsafe(send(), self.loop)