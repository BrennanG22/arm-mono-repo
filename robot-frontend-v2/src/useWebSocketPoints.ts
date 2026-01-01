import { createStore } from "solid-js/store";
import { onCleanup } from "solid-js";

export interface WebSocketData {
  points: [number, number, number][];
  currentPoint: [number, number, number];
}

export function useWebSocketPoints(url: string) {
  const [telemetry, setTelemetry] = createStore<WebSocketData>({
    points: [],
    currentPoint: [0, 0, 0],
  });

  const ws = new WebSocket(url);

  ws.onmessage = (event) => {
    const tempData = JSON.parse(event.data);

    if (tempData.message === "path") {
      setTelemetry("points", tempData.data);
    }

    if (tempData.message === "currentPoint") {
      setTelemetry("currentPoint", tempData.data);
    }
  };

  onCleanup(() => ws.close());

  return telemetry;
}
