import { createSignal, onMount, onCleanup } from 'solid-js'
import './App.css'
import { startTelemetrySocket } from './stores/telemetry/telemetrySocket'
import MonitorApplet from './applets/monitorApplet';


function App() {

  const [activeApplet, setActiveApplet] = createSignal<"Monitor" | "Control" | "Configure" | "Update">("Monitor");

  onMount(() => {
    console.log("Starting telemetry socket...");
    startTelemetrySocket("ws://localhost:8765");
  });

  return (
    <>
      <div style="height: 100vh; width: 100vw;">
        <div class={"w-full h-1/12 bg-blue-950 flex items-center"}>
          <h1 class={"text-5xl font-bold mb-4 text-white p-4"}>Robotic Arm Configuration</h1>
        </div>
        <div class={"flex h-11/12"}>
          <div class={"hamburger-item flex flex-col w-50 bg-gray-200 p-4 "}>
           <button onClick={() => setActiveApplet("Monitor")}>Monitor</button>
           <button onClick={() => setActiveApplet("Control")}>Control</button>
           <button onClick={() => setActiveApplet("Configure")}>Configure</button>
           <button onClick={() => setActiveApplet("Update")}>Update</button> 
          </div>
          <div class={"w-full bg-white p-4 flex"}>
            {activeApplet() === "Monitor" && <MonitorApplet />}
            {/* {activeApplet() === "Control" && <ControlApplet />} */}
            {/* {activeApplet() === "Configure" && <ConfigureApplet />} */}
            {/* {activeApplet() === "Update" && <UpdateApplet />} */}
          </div>
        </div>
      </div>
    </>
  )
}

export default App