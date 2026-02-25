import { onCleanup, onMount, } from 'solid-js';
import { A, useLocation, useNavigate, } from '@solidjs/router';

import './App.css';
import "./styles/ui.css";
import { startTelemetrySocket, stopTelemetrySocket } from './stores/telemetry/telemetrySocket';
import { MetricContainer } from './components/ui/Containers';
import { appState } from './stores/appStateStore';


const App = (props: any) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navButton = (path: string) =>
    `w-full text-left px-4 py-2 rounded-lg font-medium transition-colors
     ${location.pathname === path
      ? "bg-blue-600 text-white"
      : "hover:bg-gray-300"}`;

  onMount(() => {
    console.log("Starting telemetry socket...");
    startTelemetrySocket("ws://localhost:8765");
    if (location.pathname === "/") {
      navigate("/monitor", { replace: true });
    }
  });

  onCleanup(() => {
    console.log("Stopping telemetry socket...");
    stopTelemetrySocket();
  });

  return (
    <div class="h-screen w-screen flex flex-col bg-gray-100">
      <header class="w-full h-16 bg-blue-950 flex items-center shadow-md">
        <h1 class="text-3xl font-semibold text-white px-6">
          Robotic Arm Configuration
        </h1>
        <div class="ml-auto mr-6 p-1 rounded-xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center mt-1 mb-3">
          <h1 class='text-white pr-4'>Connection status: </h1>
          <div class="text-base font-semibold text-slate-50">
            {appState.socketConnected ? (
              <span class="text-green-400">Connected</span>
            ) : (
              <span class="text-red-400">Disconnected</span>
            )}
          </div>
        </div>
      </header>

      <div class="flex flex-1 overflow-hidden">
        <nav class="w-56 bg-gray-200 border-r border-gray-300 p-4 space-y-2 flex flex-col">
          <A href="/monitor" class={navButton("/monitor")}>Monitor</A>
          <A href="/control" class={navButton("/control")}>Control</A>
          <A href="/configure" class={navButton("/configure")}>Configure</A>
          <A href="/logging" class={navButton("/logging")}>Logging</A>
          <A href="/update" class={navButton("/update")}>Update</A>
        </nav>

        <main class="flex-1 bg-white p-6 overflow-auto">
          {props.children}
        </main>
      </div>
    </div>
  );
}

export default App;