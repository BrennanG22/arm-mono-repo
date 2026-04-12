import { onMount, onCleanup, createEffect } from "solid-js";
import { telemetry } from "../stores/telemetryStore";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default function TelemetryCurrentChart() {

  let canvas!: HTMLCanvasElement;
  let chart: Chart;


  onMount(() => {

    const servoLabels = ["A", "B", "C", "D", "E", "F"];

    chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: [],
        datasets: servoLabels.flatMap(label => [
          {
            label: `Servo ${label}`,
            data: [],
            borderWidth: 2,
            tension: 0.3,
          },

        ])
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            labels: { color: "white" }
          }
        },
        scales: {
          x: {
            ticks: { color: "white" },
            grid: { color: "rgba(255,255,255,0.1)" }
          },
          y: {
            suggestedMin: 0,
            suggestedMax: 3,
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
    const servoCount = 6;

    chart.data.labels = Array.from({ length: MAX }, (_, i) => i.toString());

    for (let servoIndex = 0; servoIndex < servoCount; servoIndex++) {

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



      chart.data.datasets[servoIndex].data = data;
    }

    chart.update("none");
  });

  onCleanup(() => {
    chart.destroy();
  });

  return (
    <canvas class="h-full w-full" ref={canvas} />
  );

}