import { setTelemetry } from "../telemetryStore";
import { setConfiguration } from "../configurationStore";


export type TelemetryParser = (data: unknown) => void;

export const telemetryParsers: Record<string, TelemetryParser> = {
  path(data) {
    setTelemetry("points", data as [number, number, number][]);
  },

  currentPoint(data) {
    setTelemetry("currentPoint", data as [number, number, number]);
  },

  state(data) {
    setTelemetry("activeState", data as string);
  },

  configuration(data) {
    const jsonData = JSON.parse(data as string);
    setConfiguration("sortingPoints", jsonData.sortingPoints as Record<string, [number, number, number]>);
  }
};
