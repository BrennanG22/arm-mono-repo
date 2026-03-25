import { createSignal, onCleanup, onMount, } from 'solid-js';
import { A, useLocation, useNavigate, } from '@solidjs/router';

import './App.css';
import "./styles/ui.css";
import { startTelemetrySocket, stopTelemetrySocket } from './stores/telemetry/telemetrySocket';
import { appState } from './stores/appStateStore';


const App = (props: any) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = createSignal(false);

  const navButton = (path: string) =>
    `w-full text-left px-4 py-2 rounded-lg font-medium transition-colors
     ${location.pathname === path
      ? "bg-blue-600 text-white"
      : "hover:bg-gray-300"}`;

  onMount(() => {
    console.log("Starting telemetry socket...");
    const WS_URL = import.meta.env.DEV
      ? 'ws://127.0.0.1:8080/ws/browser'
      : `wss://${window.location.hostname}/ws/browser`;
    startTelemetrySocket(WS_URL);
    if (location.pathname === "/") {
      navigate("/monitor", { replace: true });
    }
  });

  onCleanup(() => {
    console.log("Stopping telemetry socket...");
    stopTelemetrySocket();
  });

  return(
    <div class="h-screen w-screen flex flex-col bg-gray-100 overflow-hidden">

      {/* Header */}
      <header class="w-full min-h-16 bg-blue-950 flex items-center shadow-md px-4 md:px-6">

        {/* Mobile Menu Button */}
        <button
          class="md:hidden mr-4 text-white text-2xl"
          onClick={() => setMenuOpen(!menuOpen())}
        >
          ☰
        </button>

        {/* Title */}
        <h1 class="text-lg md:text-3xl font-semibold text-white truncate">
          Robotic Arm Configuration
        </h1>

        {/* Connection Status */}
        <div class="ml-auto hidden sm:flex p-1 rounded-xl bg-gray-800/50 border border-gray-700/50 items-center">
          <span class="text-white pr-2 text-sm md:text-base">
            Status:
          </span>
          <div class="text-sm md:text-base font-semibold text-slate-50">
            {appState.socketConnected ? (
              <span class="text-green-400">Connected</span>
            ) : (
              <span class="text-red-400">Disconnected</span>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <div class="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <nav
          class={`
            fixed md:static top-0 left-0 h-full w-64 bg-gray-200 border-r border-gray-300 p-4 space-y-2 flex flex-col z-50
            transform transition-transform duration-200
            ${menuOpen() ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0
          `}
        >
          {/* Close button (mobile only) */}
          <button
            class="md:hidden mb-4 text-right text-xl"
            onClick={() => setMenuOpen(false)}
          >
            ✕
          </button>

          <A href="/monitor" class={navButton("/monitor")}>Monitor</A>
          <A href="/control" class={navButton("/control")}>Control</A>
          <A href="/configure" class={navButton("/configure")}>Configure</A>
          <A href="/logging" class={navButton("/logging")}>Logging</A>
          <A href="/update" class={navButton("/update")}>Update</A>
        </nav>

        {/* Overlay (mobile only) */}
        {menuOpen() && (
          <div
            class="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main class="flex-1 bg-white p-3 md:p-6 overflow-auto">
          {props.children}
        </main>
      </div>
    </div>
  );
}

export default App;