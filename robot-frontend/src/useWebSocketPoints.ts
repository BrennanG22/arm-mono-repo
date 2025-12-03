import { useEffect, useState } from "react";

export interface WebSocketData {
  points: [number, number, number][];
  currentPoint: [number, number, number];
}

export function useWebSocketPoints(url: string) {
  const [points, setPoints] = useState<[number, number, number][]>([]);
  const [currentPoint, setCurrentPoint] = useState<[number, number, number]>([0,0,0]);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onmessage = (event) => {
      const tempData = JSON.parse(event.data);
      if (tempData["message"] == "path") {
        const data: [number, number, number][] = tempData["data"];
        setPoints(data);
      }
      if (tempData["message"] == "currentPoint") {
        const data: [number, number, number] = tempData["data"];
        setCurrentPoint(data);
      }
    };

    return () => ws.close();
  }, []);

  return {points, currentPoint} as WebSocketData;
}
