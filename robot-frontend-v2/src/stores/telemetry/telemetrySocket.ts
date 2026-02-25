import { telemetryParsers } from "./telemetryParsers";
import { setAppState } from "../appStateStore";

let socket: WebSocket | null = null;
let url: string | null = null;

let reconnectAttempts = 0;
let reconnectTimer: number | undefined;

const MAX_RECONNECT_DELAY = 10_000;

function connect() {
  if (!url) return;
  if (socket) return;

  socket = new WebSocket(url);

  socket.onopen = () => {
    reconnectAttempts = 0;
    setAppState("socketConnected", true);
    console.log("Telemetry connected");
  };

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
    cleanup();
    scheduleReconnect();
  };

  socket.onerror = () => {
    socket?.close();
  };
}

function cleanup() {
  socket = null;
  setAppState("socketConnected", false);
}

function scheduleReconnect() {
  if (!url) return;

  const delay = Math.min(
    1000 * 2 ** reconnectAttempts++,
    MAX_RECONNECT_DELAY
  );

  console.warn(`Telemetry reconnecting in ${delay}ms`);

  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = undefined;
    connect();
  }, delay);
}

export function startTelemetrySocket(wsUrl: string) {
  url = wsUrl;
  connect();
}

export function stopTelemetrySocket() {
  reconnectTimer && clearTimeout(reconnectTimer);
  reconnectTimer = undefined;
  url = null;

  socket?.close();
  cleanup();
}

export function sendTelemetryMessage(message: string, data?: unknown) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn("WebSocket not connected");
    return;
  }

  socket.send(JSON.stringify({ message, data }));
}