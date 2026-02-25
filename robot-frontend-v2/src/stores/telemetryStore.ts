import { createStore } from "solid-js/store";

export interface currentMagnitudes {
  currents: number[];
  currentHistory: number[][];
  currentUpdateId: number;
}

export interface Telemetry {
  points: [number, number, number][];
  currentMagnitudes?: currentMagnitudes;
  currentPoint?: [number, number, number];
  activeState?: string;
  activeMode?: string;
}

export const [telemetry, setTelemetry] = createStore<Telemetry>({
  points: [],
  currentMagnitudes: {
    currents: [],
    currentHistory: [],
    currentUpdateId: 0,
  },
  currentPoint: [0, 0, 0],
  activeState: "",
});

export function addCurrentUpdate(currents: number[]) {
  const MAX = 10;

  setTelemetry("currentMagnitudes", "currents", currents);

  setTelemetry(
    "currentMagnitudes",
    "currentHistory",
    (history) => {

      if (history.length >= MAX)
        return [...history.slice(1), currents];
      return [...history, currents];
    }
  );

  setTelemetry(
    "currentMagnitudes",
    "currentUpdateId",
    (id) => id + 1
  );


}