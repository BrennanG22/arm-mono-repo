import { createStore } from "solid-js/store";

export interface LogEntry {
  message: string;
  levelName: string;
  levelNumber: number
}

const MAX_LOGS = 5000;

export const [logs, setLogs] = createStore<LogEntry[]>([]);

export function addLog(message: string, levelName: string, levelNumber: number) {
  setLogs(prev => {
    const next = [
      ...prev,
      { message, levelName, levelNumber }
    ];

    return next.slice(-MAX_LOGS);
  });
}