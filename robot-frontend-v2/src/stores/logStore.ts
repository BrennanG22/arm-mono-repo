import { createStore } from "solid-js/store";

export interface LogEntry {
  message: string;
  level?: string; 
}

const MAX_LOGS = 500;

export const [logs, setLogs] = createStore<LogEntry[]>([]);

export function addLog(message: string, level: LogEntry["level"] = "info") {
  setLogs(prev => {
    const next = [
      ...prev,
      { message, level}
    ];

    return next.slice(-MAX_LOGS);
  });
}