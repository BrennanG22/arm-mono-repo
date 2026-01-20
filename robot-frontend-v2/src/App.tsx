import { createSignal, onMount } from 'solid-js'
import './App.css'
import { startTelemetrySocket } from './stores/telemetry/telemetrySocket'
import MonitorApplet from './applets/monitorApplet';
import ControlApplet from './applets/controlApplet';




function App() {

  const [activeApplet, setActiveApplet] = createSignal<"Monitor" | "Control" | "Configure" | "Update">("Control");


  const navButton = (name:string) =>
    `w-full text-left px-4 py-2 rounded-lg font-medium transition-colors
   ${activeApplet() === name
      ? "bg-blue-600 text-white"
      : "hover:bg-gray-300"}`

  onMount(() => {
    console.log("Starting telemetry socket...");
    startTelemetrySocket("ws://localhost:8765");
  });

  return (
    <>
      <div class="h-screen w-screen flex flex-col bg-gray-100">
        <header class="w-full h-16 bg-blue-950 flex items-center shadow-md">
          <h1 class="text-3xl font-semibold text-white px-6">
            Robotic Arm Configuration
          </h1>
        </header>

        <div class="flex flex-1 overflow-hidden">
          <nav class="w-56 bg-gray-200 border-r border-gray-300 p-4 space-y-2">
            <button
              class={navButton("Monitor")}
              onClick={() => setActiveApplet("Monitor")}
            >
              Monitor
            </button>

            <button
              class={navButton("Control")}
              onClick={() => setActiveApplet("Control")}
            >
              Control
            </button>

            <button
              class={navButton("Configure")}
              onClick={() => setActiveApplet("Configure")}
            >
              Configure
            </button>

            <button
              class={navButton("Update")}
              onClick={() => setActiveApplet("Update")}
            >
              Update
            </button>
          </nav>

          <main class="flex-1 bg-white p-6 overflow-auto">
            {activeApplet() === "Monitor" && <MonitorApplet />}
            {activeApplet() === "Control" && <ControlApplet />}
            {/* {activeApplet() === "Configure" && <ConfigureApplet />} */}
            {/* {activeApplet() === "Update" && <UpdateApplet />} */}
          </main>
        </div>
      </div>
    </>

  )
}

export default App