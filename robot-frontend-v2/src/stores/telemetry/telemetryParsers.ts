import { setTelemetry } from "../telemetryStore";


export type TelemetryParser = (data: unknown) => void;

export const telemetryParsers: Record<string, TelemetryParser> = {
  path(data) {
    setTelemetry("points", data as [number, number, number][]);
  },

  currentPoint(data) {
    setTelemetry("currentPoint", data as [number, number, number]);
  },

  temperature(data) {
    setTelemetry("temperature", Number(data));
  },

  velocity(data) {
    setTelemetry("velocity", Number(data));
  },
};
