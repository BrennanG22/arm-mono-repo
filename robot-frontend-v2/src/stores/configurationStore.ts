import { createStore } from "solid-js/store";

export interface Configuration {
  sortingPoints: Record<string, { point: [number, number, number], categories: string[] }>;
  pickupPoint?: [number, number, number];
}

export const [configuration, setConfiguration] = createStore<Configuration>({
  sortingPoints: {},
  pickupPoint: undefined,
});
