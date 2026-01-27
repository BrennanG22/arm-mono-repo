import { telemetryParsers } from "./telemetryParsers";

let socket: WebSocket | null = null;
let started = false;

export function startTelemetrySocket(url: string) {
  if (started) return;
  started = true;

  socket = new WebSocket(url);

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data) as {
        message: string;
        data: unknown;
      };

      const parser = telemetryParsers[msg.message];
      if (parser) {
        parser(msg.data);
      } else {
        console.warn("Unhandled telemetry message:", msg.message);
      }
    } catch (err) {
      console.error("Bad telemetry packet:", err);
    }
  };


  socket.onclose = () => {
    started = false;
    socket = null;
  };
}

export function sendTelemetryMessage(message: string, data?: unknown) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn("WebSocket not connected");
    return;
  }

  socket.send(
    JSON.stringify({
      message,
      data,
    })
  );
}
