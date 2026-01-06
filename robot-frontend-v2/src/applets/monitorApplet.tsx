import TelemetryChart from "../components/telemetryChart";
import ThreeTest from "../components/threeTest";
import { telemetry } from "../stores/telemetryStore";

function MonitorApplet() {


  return (
    <div class="grid grid-cols-2 grid-rows-2 gap-4 h-full p-4 bg-gray-100 rounded-2xl">
      <style>
        {`
      .panel {
        background: rgb(2,6,23);
        border-radius: 14px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.4);
      }

      .panel-header {
        font-size: 1.1rem;
        font-weight: 600;
        letter-spacing: 0.03em;
        color: rgb(248, 250, 252);
        margin-bottom: 0.75rem;
      }

      .metric {
        background: rgba(255,255,255,0.05);
        border-radius: 10px;
        padding: 0.75rem 1rem;
      }

      .metric-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #94a3b8;
      }

      .metric-value {
        font-size: 1.1rem;
        font-weight: 600;
        color: #f8fafc;
      }

      .camera-feed {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        background:
          repeating-linear-gradient(
            45deg,
            #020617,
            #020617 10px,
            #020617 10px,
            #020617 20px
          );
        color: #64748b;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
    `}
      </style>

      <div class="panel p-3">
        <ThreeTest />
      </div>

      <div class="panel row-span-2 p-5 flex flex-col gap-6">
        <div>
          <div class="panel-header">System Status</div>

          <div class="grid grid-cols-3 gap-4">
            <div class="metric">
              <div class="metric-label">Status</div>
              <div class="metric-value">
                {/* Placeholder */}
                Enabled
              </div>
            </div>

            <div class="metric col-span-2">
              <div class="metric-label">Position</div>
              <div class="grid grid-cols-3 gap-2 mt-1">
                <div class="metric-value">
                  X: {telemetry.currentPoint ? telemetry.currentPoint[0].toFixed(2) : "N/A"}
                </div>
                <div class="metric-value">
                  Y: {telemetry.currentPoint ? telemetry.currentPoint[1].toFixed(2) : "N/A"}
                </div>
                <div class="metric-value">
                  Z: {telemetry.currentPoint ? telemetry.currentPoint[2].toFixed(2) : "N/A"}
                </div>
              </div>
            </div>

            <div class="metric col-span-3">
              <div class="metric-label">State</div>
              <div class="metric-value">
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="panel-header">Current Sensing</div>
          <TelemetryChart telemetry={telemetry} />
        </div>

        <div>
          <div class="panel-header">Error Codes</div>
          <div class="metric text-red-400">
            None
          </div>
        </div>
      </div>

      {/* Camera Feed */}
      <div class="camera-feed">
        Live Camera Feed
      </div>
    </div>

  )
}

export default MonitorApplet;