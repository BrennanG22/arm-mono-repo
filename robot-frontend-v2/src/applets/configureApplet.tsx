import { createEffect, createSignal, Match, Show, Switch } from "solid-js";
import { LargeContainer } from "../components/ui/Containers";
import { Select } from "../components/ui/elements/Select";
import { Input } from "../components/ui/elements/Input";
import { configuration, setConfiguration } from "../stores/configurationStore";
import { Button, ButtonRed } from "../components/ui/elements/Button";
import { sendTelemetryMessage } from "../stores/telemetry/telemetrySocket";
import { produce } from "solid-js/store";
import { PageBlock } from "../components/ui/PageBlock";

function ConfigureApplet() {
  const [pointType, setPointType] = createSignal("sorting");
  const [activeTab, setActiveTab] = createSignal("points");

  const [sortingPoints, setSortingPoints] = createSignal({} as Record<string, { point: [number, number, number], expression: string }>);
  const [selectedSortingPoint, setSelectedSortingPoint] = createSignal("");
  const [tempSortingPointName, setTempSortingPointName] = createSignal("");
  const [tempSortingPoint, setTempSortingPoint] = createSignal({ point: [0, 0, 0] as [number, number, number], expression: "" });

  createEffect(() => {
    if (pointType() === "sorting") {
      resetView();
    }
  });

  function resetView() {
    setSortingPoints(configuration.sortingPoints);
    setTempSortingPoint(sortingPoints()[selectedSortingPoint()] || { point: [0, 0, 0], expression: "" });
    setTempSortingPointName(selectedSortingPoint());
  }

  function validateName(e: InputEvent & { currentTarget: HTMLInputElement; target: HTMLInputElement }) {
    const pattern = /^[A-Za-z]+$/;
    if (!pattern.test(e.data ?? "")) e.preventDefault();
  }

  function validateCategory(e: InputEvent & { currentTarget: HTMLTextAreaElement }) {
    const el = e.currentTarget;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const insert = e.data ?? "";

    const next = el.value.slice(0, start) + insert + el.value.slice(end);
    const pattern = /^[A-Za-z]+(\n[A-Za-z]+)*\n?$/;

    if (!pattern.test(next)) e.preventDefault();
  }

  function saveSortingPoint() {
    const oldName = selectedSortingPoint();
    const newName = tempSortingPointName();
    const point = tempSortingPoint();

    console.log(point)

    setConfiguration("sortingPoints",
      produce(points => {
        delete points[oldName];
        points[newName] = point;
      })
    );

    sendTelemetryMessage("setSortingPoints", configuration.sortingPoints);
  }

  function addNewSortingPoint() {
    setTempSortingPoint({ point: [0, 0, 0], expression: "" });
    setTempSortingPointName("Untitled Point");
    setSelectedSortingPoint("Untitled Point");
  }

  function deleteSortingPoint() {
    setConfiguration("sortingPoints",
      produce(points => {
        delete points[selectedSortingPoint()];
      })
    );
    sendTelemetryMessage("setSortingPoints", configuration.sortingPoints);
  }

  const [pickUpButtonsActive, setPickUpButtonsActive] = createSignal(false);
  const [tempPoint, setTempPoint] = createSignal([0, 0, 0] as [number, number, number]);
  let oldPickupPoint = configuration.pickupPoint ?? [0, 0, 0];

  createEffect(() => {
    if (pointType() === "conveyor") {
      oldPickupPoint = configuration.pickupPoint ?? [0, 0, 0];
      setTempPoint([...oldPickupPoint]);
    }
  });

  createEffect(() => {
    if (pointType() !== "conveyor") {
      setPickUpButtonsActive(false);
      return;
    }

    const temp = tempPoint();
    const changed =
      oldPickupPoint[0] !== temp[0] ||
      oldPickupPoint[1] !== temp[1] ||
      oldPickupPoint[2] !== temp[2];

    setPickUpButtonsActive(changed);
  });

  function savePickUpPoint() {
    sendTelemetryMessage("setPickUpPoint", { point: tempPoint() });
    setPickUpButtonsActive(false);
  }

  function resetPickUpPoint() {
    setTempPoint([...oldPickupPoint]);
    setPickUpButtonsActive(false);
  }

  const [calibrationOpen, setCalibrationOpen] = createSignal(false);
  const [calibrationStage, setCalibrationStage] = createSignal(0);

  let timer: number;

  createEffect(() => {
    if (calibrationStage() === 1) {
      timer = setTimeout(() => setCalibrationStage(2), 5000);
    }
  });

  function cancelCalibration() {
    clearTimeout(timer);
  }

  return (
    <div class="h-full p-2 sm:p-4 bg-gray-100 rounded-2xl overflow-y-auto">
      <LargeContainer class="h-full flex flex-col mx-auto w-full">

        <h2 class="text-xl sm:text-2xl text-white font-semibold mb-4">
          Configure Robotic Arm
        </h2>

        {/* Tabs */}
        <div class="flex flex-col sm:flex-row gap-2 mb-4">
          <button
            class={`w-full sm:w-auto px-4 py-2 rounded-lg ${activeTab() === "points" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
              }`}
            onClick={() => setActiveTab("points")}
          >
            Saved Points
          </button>

          <button
            class={`w-full sm:w-auto px-4 py-2 rounded-lg ${activeTab() === "sensor" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
              }`}
            onClick={() => setActiveTab("sensor")}
          >
            Current Sensor
          </button>
        </div>

        <Switch>
          <Match when={activeTab() === "points"}>
            <Select
              value={pointType}
              onChange={setPointType}
              options={[
                { value: "sorting", label: "Sorting Points" },
                { value: "conveyor", label: "Conveyor Point" },
              ]}
            />

            <Switch>
              <Match when={pointType() === "sorting"}>
                <div class="flex flex-col flex-1 w-full">

                  {/* Selector Row */}
                  <div class="pt-4 flex flex-col sm:flex-row gap-2">
                    <div class="w-full">
                      <Select
                        value={selectedSortingPoint}
                        onChange={setSelectedSortingPoint}
                        options={Object.keys(sortingPoints()).map(key => ({ value: key, label: key }))}
                        placeholder="Select a sorting point..."
                      />
                    </div>
                    <ButtonRed class="w-full sm:w-auto" onclick={deleteSortingPoint}>-</ButtonRed>
                    <Button class="w-full sm:w-auto" onClick={addNewSortingPoint}>+</Button>
                  </div>

                  <Show when={selectedSortingPoint()}>
                    <h1 class="text-lg sm:text-xl text-white font-semibold mt-4">Name</h1>
                    <Input
                      type="text"
                      containerClass="w-full"
                      value={tempSortingPointName()}
                      onBeforeInput={validateName}
                      onInput={(e) => setTempSortingPointName(e.target.value)}
                    />

                    <h1 class="text-lg sm:text-xl text-white font-semibold mt-2">Point</h1>

                    {/* XYZ Inputs */}
                    <div class="flex flex-col sm:flex-row gap-2 pt-4">
                      <Input type="number" placeholder="X" containerClass="flex-1" value={tempSortingPoint().point[0]} onChange={(e) => setTempSortingPoint({ ...tempSortingPoint(), point: [Number(e.target.value), tempSortingPoint().point[1], tempSortingPoint().point[2]] })} label="X Point" />
                      <Input type="number" placeholder="Y" containerClass="flex-1" value={tempSortingPoint().point[1]} onChange={(e) => setTempSortingPoint({ ...tempSortingPoint(), point: [tempSortingPoint().point[0], Number(e.target.value), tempSortingPoint().point[2]] })} label="Y Point" />
                      <Input type="number" placeholder="Z" containerClass="flex-1" value={tempSortingPoint().point[2]} onChange={(e) => setTempSortingPoint({ ...tempSortingPoint(), point: [tempSortingPoint().point[0], tempSortingPoint().point[1], Number(e.target.value)] })} label="Z Point" />
                    </div>

                    <h1 class="text-lg sm:text-xl text-white font-semibold mt-4">Expression</h1>
                    <Input type="text" value={tempSortingPoint().expression}
                      onInput={e => setTempSortingPoint(p => ({ ...p, expression: e.target.value }))} />

                    {/* Actions */}
                    <div class="mt-auto flex flex-col sm:flex-row gap-2 sm:self-end">
                      <ButtonRed onClick={resetPickUpPoint}>Reset Point</ButtonRed>
                      <Button onClick={saveSortingPoint}>Save Point</Button>
                    </div>
                  </Show>
                </div>
              </Match>

              <Match when={pointType() === "conveyor"}>
                <div class="flex flex-col flex-1">

                  <div class="flex flex-col sm:flex-row gap-2 pt-4">
                    <Input type="number" containerClass="w-full" value={tempPoint()[0]} />
                    <Input type="number" containerClass="w-full" value={tempPoint()[1]} />
                    <Input type="number" containerClass="w-full" value={tempPoint()[2]} />
                  </div>

                  <div class="mt-auto flex flex-col sm:flex-row gap-2 sm:self-end">
                    <ButtonRed disabled={!pickUpButtonsActive()} onClick={resetPickUpPoint}>
                      Reset Configuration
                    </ButtonRed>
                    <Button disabled={!pickUpButtonsActive()} onClick={savePickUpPoint}>
                      Save Configuration
                    </Button>
                  </div>
                </div>
              </Match>
            </Switch>
          </Match>

          <Match when={activeTab() === "sensor"}>
            <PageBlock
              open={calibrationOpen}
              onClose={() => { setCalibrationOpen(false); cancelCalibration(); }}
              class="w-full sm:w-1/2 h-auto sm:h-1/3 text-white p-4"
            >
              <Switch>
                <Match when={calibrationStage() === 0}>
                  <div class="flex flex-col h-full">
                    <p class="mb-4">
                      Follow calibration steps...
                    </p>
                    <div class="flex flex-col sm:flex-row gap-2 mt-auto">
                      <Button onClick={() => setCalibrationStage(1)}>Start</Button>
                      <ButtonRed onClick={() => setCalibrationOpen(false)}>Cancel</ButtonRed>
                    </div>
                  </div>
                </Match>

                <Match when={calibrationStage() === 1}>
                  <div class="flex h-full items-center justify-center">
                    Calibration in progress...
                  </div>
                </Match>

                <Match when={calibrationStage() === 2}>
                  <div class="flex flex-col items-center justify-center gap-2">
                    Calibration complete
                    <ButtonRed onClick={() => setCalibrationOpen(false)}>Close</ButtonRed>
                  </div>
                </Match>
              </Switch>
            </PageBlock>

            <h1 class="text-xl text-white font-semibold mb-4">Current Sensor Configuration</h1>

            <div class="flex flex-col gap-4 text-lg text-slate-300">
              <Input type="number" placeholder="Reference Voltage" />
              <Button onClick={() => { setCalibrationOpen(true); setCalibrationStage(0) }}>
                Begin Calibration
              </Button>
            </div>
          </Match>
        </Switch>
      </LargeContainer>
    </div>
  );
}

export default ConfigureApplet;