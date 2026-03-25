import ThreeTest from "../components/threeTest";
import { appState } from "../stores/appStateStore";
import { telemetry } from "../stores/telemetryStore";
import { LargeContainer, MetricContainer } from "../components/ui/Containers";
import TelemetryCurrentChart from "../components/propChart";

function MonitorApplet() {
  return (
    <div class="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-4 md:h-full p-2 md:p-4 bg-gray-100 rounded-2xl">
      
      {/* Three.js Visualization Panel */}
      <LargeContainer class="h-[300px] md:h-auto">
        <ThreeTest />
      </LargeContainer>

      {/* Right Panel */}
      <LargeContainer class="flex flex-col gap-6 h-full md:row-span-2 md:overflow-y-auto">
        
        {/* System Status */}
        <div>
          <div class="text-lg font-semibold tracking-wider text-slate-50 mb-3">
            System Status
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            <MetricContainer metricName="Status">
              <div class="text-base font-semibold text-slate-50">
                {appState.socketConnected ? (
                  <span class="text-green-400">Connected</span>
                ) : (
                  <span class="text-red-400">Disconnected</span>
                )}
              </div>
            </MetricContainer>

            <MetricContainer metricName="Current Position" class="sm:col-span-2">
              <div class="grid grid-cols-3 gap-2 text-sm md:text-base">
                <div class="text-slate-50">
                  X: {telemetry.currentPoint ? telemetry.currentPoint[0].toFixed(2) : "N/A"}
                </div>
                <div class="text-slate-50">
                  Y: {telemetry.currentPoint ? telemetry.currentPoint[1].toFixed(2) : "N/A"}
                </div>
                <div class="text-slate-50">
                  Z: {telemetry.currentPoint ? telemetry.currentPoint[2].toFixed(2) : "N/A"}
                </div>
              </div>
            </MetricContainer>

            <MetricContainer metricName="Active State" class="col-span-1 sm:col-span-2 md:col-span-3">
              <div class="text-base font-semibold text-slate-50">
                {telemetry.activeState || "Unknown"}
              </div>
            </MetricContainer>
          </div>
        </div>

        {/* Chart */}
        <div>
          <div class="text-lg font-semibold tracking-wider text-slate-50 mb-3">
            Current Sensing
          </div>

          <MetricContainer metricName="Current (A)">
            <div class="h-50 md:h-auto">
              <TelemetryCurrentChart />
            </div>
          </MetricContainer>
        </div>

        {/* Errors */}
        <div>
          <div class="text-lg font-semibold tracking-wider text-slate-50 mb-3">
            Error Codes
          </div>

          <MetricContainer metricName="Latest Error">
            <div class="text-base font-semibold text-slate-50">
              Test
            </div>
          </MetricContainer>
        </div>
      </LargeContainer>

      {/* Camera Feed */}
      <div class="flex items-center justify-center h-[200px] md:h-auto rounded-2xl bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 shadow-2xl border border-slate-800/50">
        <span class="text-sm uppercase tracking-widest text-slate-400 text-center px-4">
          Live Camera Feed
        </span>
      </div>
    </div>
  );
}

export default MonitorApplet;