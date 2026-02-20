import { createStore } from "solid-js/store";

export interface Configuration {
  sortingPoints: Record<string, [number, number, number]>;
  pickupPoint?: [number, number, number];
}

export const [configuration, setConfiguration] = createStore<Configuration>({
  sortingPoints: {},
  pickupPoint: undefined,
});
