import { createSignal, onMount, onCleanup } from 'solid-js'
import './App.css'
import { startTelemetrySocket } from './stores/telemetry/telemetrySocket'
import MonitorApplet from './applets/monitorApplet';


function App() {
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
           <h1>Monitor</h1>
           <h1>Control</h1>
           <h1>Configure</h1>
           <h1>Update</h1> 
          </div>
          <div class={"w-full bg-white p-4 flex"}>
            <MonitorApplet />
          </div>
        </div>
      </div>
    </>
  )
}

export default App