import { createEffect, createSignal, on } from "solid-js";
import ThreeTest from "../components/threeTest";
import { sendTelemetryMessage } from "../stores/telemetry/telemetrySocket";
import { telemetry } from "../stores/telemetryStore";
import { Select } from "../components/ui/Select";

// Reusable MoveButton Component
function MoveButton(props: {
  direction: string;
  label: string;
  stepSize: number;
  position: { col: number; row: number };
}) {
  return (
    <button
      class={`col-start-${props.position.col} row-start-${props.position.row} 
      bg-linear-to-b from-slate-800 to-slate-900 border 
      border-slate-700 rounded-lg text-slate-200 font-semibold 
      tracking-widest flex items-center justify-center shadow-lg 
      shadow-black/40 hover:bg-linear-to-b hover:from-slate-700 hover:to-slate-800 
      active:translate-y-0.5 active:shadow-inner active:shadow-black/60 
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 
      focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-all duration-75`}
      onClick={() => sendTelemetryMessage("move", { direction: props.direction, step: props.stepSize })}
      aria-label={`Move ${props.direction}`}
    >
      {props.label}
    </button>
  );
}

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
    <div class="grid grid-cols-2 grid-rows-2 gap-4 h-full w-full p-4 bg-gray-100 rounded-2xl">
      <div class="bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 rounded-2xl shadow-2xl p-3 border border-slate-800/50">
        <ThreeTest />
      </div>

      <div class="flex items-center justify-center rounded-2xl bg-linear-to-br 
      from-slate-900 via-slate-950 to-slate-900 shadow-2xl border border-slate-800/50 
      bg-[repeating-linear-gradient(45deg,#020617,#020617_10px,#0f172a_10px,#0f172a_20px)]">
        <span class="text-sm uppercase tracking-widest text-slate-400">
          Live Camera Feed
        </span>
      </div>

      <div class="col-span-2 h-full w-full grid grid-cols-2 gap-6 overflow-hidden">
        <div class="flex items-center justify-center">
          <div class="grid grid-cols-5 grid-rows-4 gap-2 w-full max-w-105 aspect-square">
            <MoveButton
              direction="x+"
              label="x+"
              stepSize={stepSize()}
              position={{ col: 2, row: 1 }}
            />

            <MoveButton
              direction="y-"
              label="y-"
              stepSize={stepSize()}
              position={{ col: 1, row: 2 }}
            />

            <MoveButton
              direction="y+"
              label="y+"
              stepSize={stepSize()}
              position={{ col: 3, row: 2 }}
            />

            <MoveButton
              direction="x-"
              label="x-"
              stepSize={stepSize()}
              position={{ col: 2, row: 3 }}
            />

            <MoveButton
              direction="z+"
              label="z+"
              stepSize={stepSize()}
              position={{ col: 5, row: 1 }}
            />

            <MoveButton
              direction="z-"
              label="z-"
              stepSize={stepSize()}
              position={{ col: 5, row: 3 }}
            />
          </div>
        </div>

        {/* Control Settings */}
        <div class="bg-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-800/50">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Control Mode
              </label>
              <div class="relative">
                <Select
                  value={controlMode}
                  options={[
                    { value: "manual", label: "Manual Control" },
                    { value: "sorting", label: "Sorting Control" }
                  ]}
                  onChange={(mode) => {
                    setControlMode(mode);
                    sendTelemetryMessage("setControlMode", { mode });
                  }}
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Step Size
              </label>
              <input
                class="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-100 
                placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                type="number"
                placeholder="Enter step size"
                step="1"
                min="0"
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
      </div>
    </div >
  );
}

export default ControlApplet;