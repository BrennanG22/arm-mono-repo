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
          {
            label: `Servo ${label} Avg`,
            data: [],
            borderWidth: 2,
            borderDash: [6, 6],
            pointRadius: 0,
            tension: 0,
          }
        ])
      },
      options: {
        responsive: true,
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

      // Compute average (ignore nulls)
      const validValues = data.filter(v => v !== null) as number[];
      const avg =
        validValues.length > 0
          ? validValues.reduce((a, b) => a + b, 0) / validValues.length
          : null;

      // Dataset index mapping:
      // 0 = Servo A
      // 1 = Servo A Avg
      // 2 = Servo B
      // 3 = Servo B Avg
      const rawDatasetIndex = servoIndex * 2;
      const avgDatasetIndex = rawDatasetIndex + 1;

      chart.data.datasets[rawDatasetIndex].data = data;

      chart.data.datasets[avgDatasetIndex].data =
        avg !== null ? Array(MAX).fill(avg) : Array(MAX).fill(null);
    }

    chart.update("none");
  });

  onCleanup(() => {
    chart.destroy();
  });

  return (
    <canvas ref={canvas} />
  );

}