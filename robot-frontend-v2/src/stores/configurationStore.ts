import { createStore } from "solid-js/store";

export interface Telemetry {
  sortingPoints: Record<string, [number, number, number]>;
  pickupPoint?: [number, number, number];
}

export const [configuration, setConfiguration] = createStore<Telemetry>({
  sortingPoints: {},
  pickupPoint: undefined,
});
