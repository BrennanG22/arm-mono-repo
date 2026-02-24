import { onMount, onCleanup, createEffect } from "solid-js";
import { telemetry } from "../stores/telemetryStore";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default function TelemetryCurrentChart() {

  let canvas!: HTMLCanvasElement;
  let chart: Chart;


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

  const history = telemetry.currentMagnitudes?.currentHistory ?? [];

  if (!chart) return;

  const MAX = 10;

  chart.data.labels = Array.from({ length: MAX }, (_, i) => i.toString());

  chart.data.datasets.forEach((dataset, servoIndex) => {

    let data = history.map(point => point[servoIndex] ?? null);

    if (data.length < MAX) {
      data = [
        ...Array(MAX - data.length).fill(null),
        ...data
      ];
    }

    if (data.length > MAX) {
      data = data.slice(-MAX);
    }

    dataset.data = data;

  });

  chart.update("none");

});

  onCleanup(() => {
    chart.destroy();
  });

  return (
    <canvas ref={canvas} />
  );

}