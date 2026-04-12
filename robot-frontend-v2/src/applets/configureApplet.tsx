import { createEffect, createSignal, Match, Show, Switch } from "solid-js";
import { LargeContainer } from "../components/ui/Containers";
import { Select } from "../components/ui/elements/Select";
import { Input } from "../components/ui/elements/Input";
import { configuration, setConfiguration } from "../stores/configurationStore";
import { Button, ButtonRed } from "../components/ui/elements/Button";
import { sendTelemetryMessage } from "../stores/telemetry/telemetrySocket";
import { produce } from "solid-js/store";

function ConfigureApplet() {
  const [pointType, setPointType] = createSignal("sorting");

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


  return (
    <div class="h-full p-2 sm:p-4 bg-gray-100 rounded-2xl overflow-y-auto">
      <LargeContainer class="min-h-full flex flex-col mx-auto w-full">

        <h2 class="text-xl sm:text-2xl text-white font-semibold mb-4">
          Configure Robotic Arm
        </h2>

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
                <Input type="number" placeholder="X" containerClass="flex-1" value={tempPoint()[0]} onChange={(e) => setTempPoint([Number(e.target.value), tempPoint()[1], tempPoint()[2]])} label="X Point" />
                <Input type="number" placeholder="Y" containerClass="flex-1" value={tempPoint()[1]} onChange={(e) => setTempPoint([tempPoint()[0], Number(e.target.value), tempPoint()[2]])} label="Y Point" />
                <Input type="number" placeholder="Z" containerClass="flex-1" value={tempPoint()[2]} onChange={(e) => setTempPoint([tempPoint()[0], tempPoint()[1], Number(e.target.value)])} label="Z Point" />
              </div>

              <div class="mt-auto">
                <div class="pt-4 flex flex-col sm:flex-row gap-2 sm:self-end">
                  <ButtonRed disabled={!pickUpButtonsActive()} onClick={resetPickUpPoint}>
                    Reset Configuration
                  </ButtonRed>
                  <Button disabled={!pickUpButtonsActive()} onClick={savePickUpPoint}>
                    Save Configuration
                  </Button>
                </div>
              </div>
            </div>
          </Match>
        </Switch>
      </LargeContainer>
    </div>
  );
}

export default ConfigureApplet;