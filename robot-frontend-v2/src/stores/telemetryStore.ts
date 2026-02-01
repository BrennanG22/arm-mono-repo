import { createStore } from "solid-js/store";

export interface Telemetry {
  points: [number, number, number][];
  currentPoint?: [number, number, number];
  activeState?: string;
  activeMode?: string;
}

export const [telemetry, setTelemetry] = createStore<Telemetry>({
  points: [],
  currentPoint: [0, 0, 0],
  activeState: "",
});
