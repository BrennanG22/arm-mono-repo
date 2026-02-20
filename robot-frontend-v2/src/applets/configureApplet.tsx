import { createEffect, createSignal, Match, onMount, Switch } from "solid-js";
import { LargeContainer } from "../components/ui/Containers";
import { Select } from "../components/ui/elements/Select";
import { Input } from "../components/ui/elements/Input";
import { configuration } from "../stores/configurationStore";
import { Button, ButtonRed } from "../components/ui/elements/Button";
import { sendTelemetryMessage } from "../stores/telemetry/telemetrySocket";

function ConfigureApplet() {

  const [pointType, setPointType] = createSignal("sorting");

  const [sortingPoints, setSortingPoints] = createSignal({} as Record<string, [number, number, number]>);
  const [selectedSortingPoint, setSelectedSortingPoint] = createSignal("");

  createEffect(() => {
    if (pointType() === "sorting") {
      setSortingPoints(configuration.sortingPoints);
    }
  }
  );



  const [pickUpButtonsActive, setPickUpButtonsActive] = createSignal(false);
  const [tempPoint, setTempPoint] = createSignal([0, 0, 0] as [number, number, number]);
  let oldPickupPoint = configuration.pickupPoint ?? [0, 0, 0] as [number, number, number];

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
    <div class="h-full p-4 bg-gray-100 rounded-2xl">
      <LargeContainer class="h-full flex flex-col">

        <h2 class="text-2xl text-white font-semibold mb-4">
          Configure Robotic Arm
        </h2>

        <Select
          value={pointType}
          onChange={(mode) => setPointType(mode)}
          options={[
            { value: "sorting", label: "Sorting Points" },
            { value: "conveyor", label: "Conveyor Point" },
          ]}
        />

        <Switch>

          <Match when={pointType() === "sorting"}>
            <div class="flex flex-col flex-1 w-full">
              <div class="p-4 flex space-x-1.5">
                <div class="flex-6/8">
                  <Select
                    value={selectedSortingPoint}
                    onChange={(value) => setSelectedSortingPoint(value)}
                    options={Object.keys(sortingPoints()).map(key => ({ value: key, label: key }))}
                  />
                </div>
                <ButtonRed class="aspect-square">
                  -
                </ButtonRed>
                <Button class="aspect-square">
                  +
                </Button>
              </div>
              <div>
                Test
              </div>
            </div>
          </Match>

          <Match when={pointType() === "conveyor"}>

            <div class="flex flex-col flex-1">

              <div class="flex space-x-2 pt-4">
                <Input type="number" placeholder="X" containerClass="flex-1" value={tempPoint()[0]} onChange={(e) => setTempPoint([Number(e.target.value), tempPoint()[1], tempPoint()[2]])} label="X Point" />
                <Input type="number" placeholder="Y" containerClass="flex-1" value={tempPoint()[1]} onChange={(e) => setTempPoint([tempPoint()[0], Number(e.target.value), tempPoint()[2]])} label="Y Point" />
                <Input type="number" placeholder="Z" containerClass="flex-1" value={tempPoint()[2]} onChange={(e) => setTempPoint([tempPoint()[0], tempPoint()[1], Number(e.target.value)])} label="Z Point" />
              </div>

              <div class="mt-auto self-end flex space-x-2">
                <ButtonRed disabled={!pickUpButtonsActive()} onClick={() => resetPickUpPoint()}>
                  Reset Configuration
                </ButtonRed>
                <Button disabled={!pickUpButtonsActive()} onClick={() => savePickUpPoint()}>
                  Save Configuration
                </Button>
              </div>
            </div>

          </Match>

        </Switch>

      </LargeContainer>
    </div>

  );
}

export default ConfigureApplet;