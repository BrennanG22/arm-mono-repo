import { createEffect, createSignal, on, } from "solid-js";
import ThreeTest from "../components/threeTest";
import { sendTelemetryMessage } from "../stores/telemetry/telemetrySocket";
import { telemetry } from "../stores/telemetryStore";
import { Select } from "../components/ui/elements/Select";
import { LargeContainer } from "../components/ui/Containers";
import { Button, ButtonRed } from "../components/ui/elements/Button";

function MoveButton(props: {
  direction: string;
  label: string;
  stepSize: number;
  position: { col: number; row: number };
}) {
  return (
    <Button
      style={{
        "grid-column-start": props.position.col,
        "grid-row-start": props.position.row,
      }}
      class="aspect-square"
      onClick={() =>
        sendTelemetryMessage("move", {
          direction: props.direction,
          step: props.stepSize,
        })
      }
    >
      {props.label}
    </Button>
  );
}

function ControlApplet() {
  const [controlMode, setControlMode] = createSignal("");
  const [stepSize, setStepSize] = createSignal(0.1);

  let controlInitialized = false;

  createEffect(
    on(
      () => telemetry.activeMode,
      (mode) => {
        if (!controlInitialized && mode !== undefined) {
          setControlMode(mode);
          controlInitialized = true;
        }
      }
    )
  );



  return (
    <div class="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-4 w-full min-h-full p-2 md:p-4 bg-gray-100 rounded-2xl overflow-auto">

      <div class="bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 rounded-2xl shadow-2xl p-2 md:p-3 border border-slate-800/50 min-h-[250px]">
        <ThreeTest />
      </div>

      <div class="flex items-center justify-center rounded-2xl 
      bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 
      shadow-2xl border border-slate-800/50 
      bg-[repeating-linear-gradient(45deg,#020617,#020617_10px,#0f172a_10px,#0f172a_20px)]
      min-h-[150px] md:min-h-[250px]">
        <span class="text-xs md:text-sm uppercase tracking-widest text-slate-400 text-center px-2">
          Live Camera Feed
        </span>
      </div>

      <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 overflow-visible">

        <div class="flex items-center justify-center gap-6">
          {/* XY Movement Pad */}
          <div class="grid gap-1.5" style={{ "grid-template-columns": "repeat(3, 1fr)", "grid-template-rows": "repeat(3, 1fr)" }}>
            <MoveButton direction="y+" label="Y+" stepSize={stepSize()} position={{ col: 2, row: 1 }} />
            <MoveButton direction="x-" label="X-" stepSize={stepSize()} position={{ col: 1, row: 2 }} />
            <MoveButton direction="x+" label="X+" stepSize={stepSize()} position={{ col: 3, row: 2 }} />
            <MoveButton direction="y-" label="Y-" stepSize={stepSize()} position={{ col: 2, row: 3 }} />
          </div>

          {/* Z Axis */}
          <div class="flex flex-col gap-1.5">
            <MoveButton direction="z+" label="Z+" stepSize={stepSize()} position={{ col: 1, row: 1 }} />
            <MoveButton direction="z-" label="Z-" stepSize={stepSize()} position={{ col: 1, row: 2 }} />
          </div>
        </div>

        <LargeContainer class="p-3 md:p-4">
          <div class="space-y-4">

            {/* Control Mode */}
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Control Mode
              </label>

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

            <div style={{ visibility: controlMode() === "manual" ? "visible" : "hidden" }}>
              <div class="space-y-2">
                <label class="block text-sm font-medium text-slate-300">
                  Step Size
                </label>
                <input
                  class="w-full p-2 md:p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-100 
          placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  type="number"
                  step="1"
                  min="0"
                  value={stepSize()}
                  onInput={(e) => {
                    const val = parseFloat(e.currentTarget.value);
                    setStepSize(val);
                  }}
                />
                <ButtonRed
                  class="w-full"
                  onclick={() => sendTelemetryMessage("routeToRest")}
                >
                  Route to rest
                </ButtonRed>
              </div>
            </div>

          </div>
        </LargeContainer>

      </div>
    </div>
  );
}

export default ControlApplet;