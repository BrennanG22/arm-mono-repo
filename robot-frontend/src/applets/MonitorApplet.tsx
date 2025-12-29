import PointCloud from "../applets/PointCloud";
import { useWebSocketPoints } from "../useWebSocketPoints";

function MonitorApplet() {
  const data = useWebSocketPoints("ws://localhost:8765");
    return (
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
    )
}

export default MonitorApplet;