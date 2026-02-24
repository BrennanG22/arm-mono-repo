import TelemetryChart from "../components/telemetryChart";
import ThreeTest from "../components/threeTest";
import { appState } from "../stores/appStateStore";
import { telemetry } from "../stores/telemetryStore";
import { LargeContainer, MetricContainer } from "../components/ui/Containers";
import PropChart from "../components/propChart";
import TelemetryCurrentChart from "../components/propChart";

function MonitorApplet() {
  return (
    <div class="grid grid-cols-2 grid-rows-2 gap-4 h-full p-4 bg-gray-100 rounded-2xl">
      {/* Three.js Visualization Panel */}
      <LargeContainer>
        <ThreeTest />
      </LargeContainer>

      <LargeContainer class="flex flex-col gap-6 h-full row-span-2 overflow-x-scroll scrollbar-hide">
        <div>
          <div class="text-lg font-semibold tracking-wider text-slate-50 mb-3">
            System Status
          </div>

          <div class="grid grid-cols-3 gap-4">
            <MetricContainer metricName="Status">
              <div class="text-base font-semibold text-slate-50">
                {appState.socketConnected ? (
                  <span class="text-green-400">Connected</span>
                ) : (
                  <span class="text-red-400">Disconnected</span>
                )}
              </div>
            </MetricContainer>

            <MetricContainer metricName="Current Position" class="col-span-2">
              <div class="grid grid-cols-3 gap-2">
                <div class="text-base font-semibold text-slate-50">
                  X: {telemetry.currentPoint ? telemetry.currentPoint[0].toFixed(2) : "N/A"}
                </div>
                <div class="text-base font-semibold text-slate-50">
                  Y: {telemetry.currentPoint ? telemetry.currentPoint[1].toFixed(2) : "N/A"}
                </div>
                <div class="text-base font-semibold text-slate-50">
                  Z: {telemetry.currentPoint ? telemetry.currentPoint[2].toFixed(2) : "N/A"}
                </div>
              </div>
            </MetricContainer>

            {/* State Metric */}
            <MetricContainer metricName="Active State" class="col-span-3">
              <div class="text-base font-semibold text-slate-50">
                {telemetry.activeState || "Unknown"}
              </div>
            </MetricContainer>
          </div>
        </div>

        {/* Telemetry Chart Section */}
        <div class="text-lg font-semibold tracking-wider text-slate-50 mb-3">
          Current Sensing
        </div>
        <MetricContainer metricName="Current (A)" class="col-span-3">
          <div class="">
            <TelemetryCurrentChart />
          </div>
        </MetricContainer>

        {/* Error Codes Section */}
        <div>
          <div class="text-lg font-semibold tracking-wider text-slate-50 mb-3">
            Error Codes
          </div>
          <MetricContainer metricName="Latest Error" class="col-span-3">
            <div class="text-base font-semibold text-slate-50">
              Test
            </div>
          </MetricContainer>
        </div>
      </LargeContainer>

      {/* Camera Feed */}
      <div class="flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-2xl border border-slate-800/50 bg-[repeating-linear-gradient(45deg,_#020617,_#020617_10px,_#0f172a_10px,_#0f172a_20px)]">
        <span class="text-sm uppercase tracking-widest text-slate-400">
          Live Camera Feed
        </span>
      </div>
    </div>
  );
}

export default MonitorApplet;