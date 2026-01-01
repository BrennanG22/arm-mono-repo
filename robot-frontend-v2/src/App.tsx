import { createSignal, onMount, onCleanup } from 'solid-js'
import './App.css'
import { startTelemetrySocket } from './stores/telemetry/telemetrySocket'


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
          <div class={"w-50 bg-gray-200 p-4"}>
            
          </div>
        </div>
      </div>
    </>
  )
}

export default App