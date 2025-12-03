import PointCloud from "./applets/PointCloud";
import { useWebSocketPoints } from "./useWebSocketPoints";

import "./App.css";

export default function App() {
  const data = useWebSocketPoints("ws://localhost:8765");

  return (
    <div className="app-container">
      <header className="top-banner">
        <h1>Robotic Arm Configuration</h1>
      </header>

      <div className="main-content">
        <div className="hamburger-menu">

          <ul className="menu-items">
            <li>Monitor</li>
            <li>Control</li>
            <li>Configure</li>
            <li>Update</li>
          </ul>
        </div>

        <div className="container">
          <div className="left-panel">
            <div className="point-cloud">
              <PointCloud points={data.points} currentPoint={data.currentPoint} />
            </div>
            <div className="camera-feed">
              <h2>Live Camera Feed Placeholder</h2>
            </div>
          </div>

          <div className="right-panel">
            <h2>Active State</h2>
            <h2>Current Sensing</h2>
            <h2>Error Codes</h2>
          </div>
        </div>
      </div>
    </div>

  );
}