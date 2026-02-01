import { onCleanup, onMount, } from 'solid-js';
import {  A, useLocation, } from '@solidjs/router';

import './App.css';
import "./styles/ui.css";
import { startTelemetrySocket, stopTelemetrySocket } from './stores/telemetry/telemetrySocket';


const App = (props: any ) => {
  const location = useLocation();

  const navButton = (path: string) =>
    `w-full text-left px-4 py-2 rounded-lg font-medium transition-colors
     ${location.pathname === path
      ? "bg-blue-600 text-white"
      : "hover:bg-gray-300"}`;

  onMount(() => {
    console.log("Starting telemetry socket...");
    startTelemetrySocket("ws://localhost:8765");
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
      </header>

      <div class="flex flex-1 overflow-hidden">
        <nav class="w-56 bg-gray-200 border-r border-gray-300 p-4 space-y-2 flex flex-col">
          <A href="/monitor" class={navButton("/monitor")}>Monitor</A>
          <A href="/control" class={navButton("/control")}>Control</A>
          <A href="/configure" class={navButton("/configure")}>Configure</A>
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