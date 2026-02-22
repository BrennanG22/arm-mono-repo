import { onCleanup, onMount, createEffect } from "solid-js";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface Telemetry {
  points: [number, number, number][];
  currentPoint?: [number, number, number] | null;
  temperature?: number;
}

interface TelemetryChartProps {
  telemetry: Telemetry;
}

export default function TelemetryChart(props: TelemetryChartProps) {
  let canvasRef: HTMLCanvasElement | undefined;
  let chart: Chart | undefined;

  onMount(() => {
    if (!canvasRef) return;

    chart = new Chart(canvasRef, {
      type: "line",
      data: {
        labels: props.telemetry.points.map((_, i) => `#${i + 1}`),
        datasets: [
          {
            label: "X",
            data: props.telemetry.points.map((p) => p[0]),
            borderColor: "red",
            fill: false,
          },
          {
            label: "Y",
            data: props.telemetry.points.map((p) => p[1]),
            borderColor: "green",
            fill: false,
          },
          {
            label: "Z",
            data: props.telemetry.points.map((p) => p[2]),
            borderColor: "blue",
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        animation: false,
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  });

  createEffect(() => {
    if (!chart) return;

    chart.data.labels = props.telemetry.points.map((_, i) => `#${i + 1}`);
    chart.data.datasets![0].data = props.telemetry.points.map((p) => p[0]);
    chart.data.datasets![1].data = props.telemetry.points.map((p) => p[1]);
    chart.data.datasets![2].data = props.telemetry.points.map((p) => p[2]);
    chart.update("none");
  });

  onCleanup(() => chart?.destroy());

  return <canvas class="h-full w-full" ref={canvasRef} />;
}
