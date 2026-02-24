import { onMount, onCleanup, createEffect } from "solid-js";
import { telemetry } from "../stores/telemetryStore";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default function TelemetryCurrentChart() {

  let canvas!: HTMLCanvasElement;
  let chart: Chart;

  const MAX_POINTS = 10;

  const history: number[][] = [
    [], [], [], [], [], []
  ];

  function addData(currents: number[]) {
    for (let i = 0; i < 6; i++) {
      history[i].push(currents[i] ?? 0);
      if (history[i].length > MAX_POINTS)
        history[i].shift();

    }

    chart.data.labels = history[0].map((_, i) => i.toString());

    chart.data.datasets.forEach((dataset, i) => {
      dataset.data = history[i];
    });

    chart.update("none");
  }

  onMount(() => {

    chart = new Chart(canvas, {

      type: "line",

      data: {

        labels: [],

        datasets: [

          {
            label: "Servo A",
            data: [],
            borderWidth: 2,
            tension: 0.3,
          },

          {
            label: "Servo B",
            data: [],
            borderWidth: 2,
            tension: 0.3,
          },

          {
            label: "Servo C",
            data: [],
            borderWidth: 2,
            tension: 0.3,
          },

          {
            label: "Servo D",
            data: [],
            borderWidth: 2,
            tension: 0.3,
          },

          {
            label: "Servo E",
            data: [],
            borderWidth: 2,
            tension: 0.3,
          },

          {
            label: "Servo F",
            data: [],
            borderWidth: 2,
            tension: 0.3,
          },

        ]

      },

      options: {
        responsive: true,
        animation: false,
        plugins: {
          legend: {
            labels: {
              color: "white"
            }
          }
        },

        scales: {
          x: {
            ticks: { color: "white" },
            grid: { color: "rgba(255,255,255,0.1)" }
          },

          y: {
            ticks: { color: "white" },
            grid: { color: "rgba(255,255,255,0.1)" }
          }
        }
      }
    });
  });

  createEffect(() => {
    telemetry.currentMagnitudes?.currentUpdateId;

    const currents = telemetry.currentMagnitudes?.currents;

    if (!currents || currents.length !== 6)
      return;

    addData(currents);

  });

  onCleanup(() => {
    chart.destroy();
  });

  return (
    <canvas ref={canvas} />
  );

}