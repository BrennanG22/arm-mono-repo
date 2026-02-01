import { createEffect, createSignal, on, onMount } from "solid-js";
import ThreeTest from "../components/threeTest";
import { sendTelemetryMessage } from "../stores/telemetry/telemetrySocket";
import { telemetry } from "../stores/telemetryStore";

function ControlApplet() {
  const [controlMode, setControlMode] = createSignal("");
  const [stepSize, setStepSize] = createSignal(0.1);

  let initialized = false;

  createEffect(
    on(
      () => telemetry.activeMode,
      (mode) => {
        if (!initialized && mode !== undefined) {
          setControlMode(mode);
          initialized = true;
        }
      }
    )
  );
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
      <div class="h-full control-wrapper grid-cols-2 col-span-2">
        <div class="grid grid-cols-5 grid-rows-4 aspect-square control-panel">
          <button class="move-button col-start-2 row-start-1" onClick={() => sendTelemetryMessage("move", { direction: "x+", step: stepSize() })}>x+</button>
          <button class="move-button col-start-1 row-start-2" onClick={() => sendTelemetryMessage("move", { direction: "y-", step: stepSize() })}>y-</button>
          <button class="move-button col-start-3 row-start-2" onClick={() => sendTelemetryMessage("move", { direction: "y+", step: stepSize() })}>y+</button>
          <button class="move-button col-start-2 row-start-3" onClick={() => sendTelemetryMessage("move", { direction: "x-", step: stepSize() })}>x-</button>
          <button class="move-button col-start-5 row-start-1" onClick={() => sendTelemetryMessage("move", { direction: "z+", step: stepSize() })}>z+</button>
          <button class="move-button col-start-5 row-start-3" onClick={() => sendTelemetryMessage("move", { direction: "z-", step: stepSize() })}>z-</button>
        </div>
        <div>
          <select
            class="w-full p-2 rounded-md border border-gray-300 mb-4"
            value={controlMode()}
            onChange={(e) => {
              setControlMode(e.currentTarget.value);
              sendTelemetryMessage("setControlMode", { mode: e.currentTarget.value });
            }}
          >
            <option value="" disabled hidden>
              Loading…
            </option>
            <option value="manual">Manual Control</option>
            <option value="sorting">Sorting Control</option>
          </select>
          <input
            class="w-full p-2 rounded-md border border-gray-300"
            type="number"
            placeholder="Step size"
            value={stepSize()}
            onInput={(e) => {
              const val = parseFloat(e.currentTarget.value);
              setStepSize(val);
              sendTelemetryMessage("setStepSize", { stepSize: val });
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default ControlApplet;