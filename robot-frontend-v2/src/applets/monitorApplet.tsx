import TelemetryChart from "../components/telemetryChart";
import ThreeTest from "../components/threeTest";
import { appState } from "../stores/appStateStore";
import { telemetry } from "../stores/telemetryStore";

function MonitorApplet() {
  return (
    <div class="grid grid-cols-2 grid-rows-2 gap-4 h-full p-4 bg-gray-100 rounded-2xl">
      {/* Three.js Visualization Panel */}
      <div class="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-2xl shadow-2xl p-3 border border-slate-800/50">
        <ThreeTest />
      </div>

      {/* Status & Telemetry Panel */}
      <div class="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-2xl shadow-2xl p-5 flex flex-col gap-6 row-span-2 border border-slate-800/50">
        {/* System Status Section */}
        <div>
          <div class="text-lg font-semibold tracking-wider text-slate-50 mb-3">
            System Status
          </div>

          <div class="grid grid-cols-3 gap-4">
            {/* Connection Status */}
            <div class="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30">
              <div class="text-xs uppercase tracking-widest text-slate-400 mb-1">
                Status
              </div>
              <div class="text-base font-semibold text-slate-50">
                {appState.socketConnected ? (
                  <span class="text-green-400">Connected</span>
                ) : (
                  <span class="text-red-400">Disconnected</span>
                )}
              </div>
            </div>

            {/* Position Metrics */}
            <div class="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 col-span-2">
              <div class="text-xs uppercase tracking-widest text-slate-400 mb-2">
                Position
              </div>
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
            </div>

            {/* State Metric */}
            <div class="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 col-span-3">
              <div class="text-xs uppercase tracking-widest text-slate-400 mb-1">
                State
              </div>
              <div class="text-base font-semibold text-slate-50">
                {telemetry.activeState || "Unknown"}
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Chart Section */}
        <div>
          <div class="text-lg font-semibold tracking-wider text-slate-50 mb-3">
            Current Sensing
          </div>
          <TelemetryChart telemetry={telemetry} />
        </div>

        {/* Error Codes Section */}
        <div>
          <div class="text-lg font-semibold tracking-wider text-slate-50 mb-3">
            Error Codes
          </div>
          <div class="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 text-green-400">
            None
          </div>
        </div>
      </div>

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