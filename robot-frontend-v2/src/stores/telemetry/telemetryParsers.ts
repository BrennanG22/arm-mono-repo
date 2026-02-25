import { setTelemetry, addCurrentUpdate } from "../telemetryStore";
import { setConfiguration } from "../configurationStore";
import { addLog } from "../logStore";


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

  activeMode(data) {
    setTelemetry("activeMode", data as string);
  },

  sortingPoints(data) {
    const pointsData = data as Record<string, { point: [number, number, number], categories: string[] }>;

    const transformedData: Record<string, [number, number, number]> = {};
    for (const [key, value] of Object.entries(pointsData)) {
      transformedData[key] = value.point;
    }

    setConfiguration("sortingPoints", pointsData);
  },

  pickUpPoint(data) {
    setConfiguration("pickupPoint", data as [number, number, number]);
  },

  logUpdate(data: any) {
    addLog(data["message"] as string, data["levelName"] as string, data["level"] as number);
  },

  currentUpdate(data) {
    addCurrentUpdate(data as number[]);
  }
};
