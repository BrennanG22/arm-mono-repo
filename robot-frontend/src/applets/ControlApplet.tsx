import { useState } from "react";
import PointCloud from "./PointCloud";
import { useWebSocketPoints } from "../useWebSocketPoints";

function ControlApplet() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [z, setZ] = useState(0);
  const [mode, setMode] = useState<"pointTrack" | "servoTrack">("pointTrack");
  const data = useWebSocketPoints("ws://localhost:8765");

  return (
    <div>
      <div>
        <PointCloud points={data.points} currentPoint={data.currentPoint} />
      </div>
      <div>
        <select value={mode} onChange={(e) => setMode(e.target.value as "pointTrack" | "servoTrack")}>
          <option value="pointTrack">Point Track</option>
          <option value="servoTrack">Servo Track</option>
        </select>
        <label> X, Y, Z Positions: </label>
        <input type="number" step={0.1} value={x} onChange={(e) => setX(Number(e.target.value))} placeholder="X Position"></input>
        <input type="number" step={0.1} value={y} onChange={(e) => setY(Number(e.target.value))} placeholder="Y Position"></input>
        <input type="number" step={0.1} value={z} onChange={(e) => setZ(Number(e.target.value))} placeholder="Z Position"></input>
      </div>

    </div>
  );
}

export default ControlApplet;