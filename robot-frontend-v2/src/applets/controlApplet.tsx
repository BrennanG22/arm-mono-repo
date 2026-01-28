import ThreeTest from "../components/threeTest";
import { sendTelemetryMessage } from "../stores/telemetry/telemetrySocket";

function ControlApplet() {
  return (
    <div class="grid grid-cols-2 grid-rows-2 gap-4 h-full w-full">
      <style>
        {`
.camera-feed {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background:
    repeating-linear-gradient(
      45deg,
      #020617,
      #020617 10px,
      #020617 20px
    );
  color: #64748b;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

/* === MOVE BUTTONS === */
.move-button {
  background: linear-gradient(180deg, #0f172a, #020617);
  border: 1px solid #1e293b;
  border-radius: 5px;

  color: #e5e7eb;
  font-weight: 600;
  letter-spacing: 0.08em;

  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.05),
    0 2px 4px rgba(0,0,0,0.6);

  transition:
    transform 0.08s ease,
    box-shadow 0.08s ease,
    background 0.15s ease;
}

.move-button:hover {
  background: linear-gradient(180deg, #1e293b, #020617);
}

.move-button:active {
  transform: translateY(2px);
  box-shadow:
    inset 0 3px 6px rgba(0,0,0,0.6);
}

.move-button:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px #38bdf8,
    inset 0 1px 0 rgba(255,255,255,0.05);
}

.control-wrapper {
  width: 100%;
  height: 100%;
  display: grid;

  overflow: hidden;
}

.control-panel {
  width: min(100%, 420px);
  aspect-ratio: 1;
}

`}
      </style>
      <div>
        <ThreeTest />
      </div>
      <div>
        <div class="camera-feed h-full">
          Live Camera Feed
        </div>
      </div>
      <div class="h-full control-wrapper col-span-2">
        <div class="grid grid-cols-5 grid-rows-4 aspect-square control-panel">
          <button class="move-button col-start-2 row-start-1" onClick={() => sendTelemetryMessage("move", { direction: "x+", step: 0.1 })}>↑</button>
          <button class="move-button col-start-1 row-start-2" onClick={() => sendTelemetryMessage("move", { direction: "y-", step: 0.1 })}>←</button>
          <button class="move-button col-start-3 row-start-2" onClick={() => sendTelemetryMessage("move", { direction: "y+", step: 0.1 })}>→</button>
          <button class="move-button col-start-2 row-start-3" onClick={() => sendTelemetryMessage("move", { direction: "x-", step: 0.1 })}>↓</button>
          <button class="move-button col-start-5 row-start-1" onClick={() => sendTelemetryMessage("move", { direction: "z+", step: 0.1 })}>Up</button>
          <button class="move-button col-start-5 row-start-3" onClick={() => sendTelemetryMessage("move", { direction: "z-", step: 0.1 })}>Down</button>
        </div>
      </div>
    </div>
  );
}

export default ControlApplet;