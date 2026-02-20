import { createEffect, createSignal, Match, onMount, Switch } from "solid-js";
import { LargeContainer } from "../components/ui/Containers";
import { Select } from "../components/ui/elements/Select";
import { Input } from "../components/ui/elements/Input";
import { configuration, setConfiguration } from "../stores/configurationStore";
import { Button, ButtonRed } from "../components/ui/elements/Button";
import { sendTelemetryMessage } from "../stores/telemetry/telemetrySocket";
import { produce } from "solid-js/store";

function ConfigureApplet() {

  const [pointType, setPointType] = createSignal("sorting");




  const [sortingPoints, setSortingPoints] = createSignal({} as Record<string, { point: [number, number, number], categories: string[] }>);
  const [selectedSortingPoint, setSelectedSortingPoint] = createSignal("");
  const [tempSortingPointName, setTempSortingPointName] = createSignal("");
  const [tempSortingPoint, setTempSortingPoint] = createSignal({ point: [0, 0, 0] as [number, number, number], categories: [] as string[] });

  createEffect(() => {
    if (pointType() === "sorting") {
      setSortingPoints(configuration.sortingPoints);
    }
  });

  createEffect(() => {
    if (pointType() === "sorting") {
      setTempSortingPoint(sortingPoints()[selectedSortingPoint()] || { point: [0, 0, 0], categories: [] });
      setTempSortingPointName(selectedSortingPoint());
    }
  });

  function validateName(e: InputEvent & {
    currentTarget: HTMLInputElement;
    target: HTMLInputElement;
  }) {
    const pattern = /^[A-Za-z]+$/;
    const validName = pattern.test(e.data ?? "");
    if (!validName) {
      e.preventDefault();
    }
  }

  function validateCategory(e: InputEvent & {
    currentTarget: HTMLTextAreaElement;
  }) {
    const el = e.currentTarget;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;

    const insert = e.data ?? "";

    const next =
      el.value.slice(0, start) +
      insert +
      el.value.slice(end);

    const pattern = /^[A-Za-z]+(\n[A-Za-z]+)*\n?$/;

    const valid = pattern.test(next);

    if (!valid) {
      e.preventDefault();
    }
  }

  function saveSortingPoint() {

    const oldName = selectedSortingPoint();
    const newName = tempSortingPointName();
    const point = tempSortingPoint();

    setConfiguration(
      "sortingPoints",
      produce(points => {

        delete points[oldName];

        points[newName] = {
          point: point.point,
          categories: point.categories
        };

      })
    );

    sendTelemetryMessage("setSortingPoints", configuration.sortingPoints);
  }




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
              <div class="pt-4 flex space-x-1.5">
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
              <h1 class="text-xl text-white font-semibold mt-4">Name</h1>
              <Input type="text" placeholder="Point name" containerClass="w-full" value={tempSortingPointName()} onBeforeInput={(e) => { validateName(e) }} onInput={(e) => setTempSortingPointName(e.target.value)} />
              <h1 class="text-xl text-white font-semibold  mt-2">Point</h1>
              <div class="flex space-x-2 pt-4">
                <Input type="number" placeholder="X" containerClass="flex-1" value={tempSortingPoint().point[0]} onChange={(e) => setTempSortingPoint({ ...tempSortingPoint(), point: [Number(e.target.value), tempSortingPoint().point[1], tempSortingPoint().point[2]] })} label="X Point" />
                <Input type="number" placeholder="Y" containerClass="flex-1" value={tempSortingPoint().point[1]} onChange={(e) => setTempSortingPoint({ ...tempSortingPoint(), point: [tempSortingPoint().point[0], Number(e.target.value), tempSortingPoint().point[2]] })} label="Y Point" />
                <Input type="number" placeholder="Z" containerClass="flex-1" value={tempSortingPoint().point[2]} onChange={(e) => setTempSortingPoint({ ...tempSortingPoint(), point: [tempSortingPoint().point[0], tempSortingPoint().point[1], Number(e.target.value)] })} label="Z Point" />
              </div>

              <h1 class="text-xl text-white font-semibold  mt-4">Categories</h1>
              <textarea class="text-white" value={tempSortingPoint().categories.join('\n')} onBeforeInput={(e) => { validateCategory(e) }} onChange={(e) => setTempSortingPoint({ ...tempSortingPoint(), categories: e.target.value.split('\n').filter(c => c.trim() !== '') })}>

              </textarea>
              <div class="mt-auto self-end flex space-x-2">
                <ButtonRed disabled={!pickUpButtonsActive()} onClick={() => resetPickUpPoint()}>
                  Reset Point
                </ButtonRed>
                <Button disabled={false} onClick={() => saveSortingPoint()}>
                  Save Point
                </Button>
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