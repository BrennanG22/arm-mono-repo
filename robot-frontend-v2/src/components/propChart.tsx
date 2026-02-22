import { onMount, onCleanup, createEffect } from "solid-js";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface PropChartProps {
  value: number;      // reactive store value
  color?: string;
  min?: number;
  max?: number;
}

export default function PropChart(props: PropChartProps) {
  let canvasRef: HTMLCanvasElement | undefined;
  let chart: Chart | undefined;

  const data: number[] = [];
  const labels: number[] = [];

  let index = 0;

  onMount(() => {
    chart = new Chart(canvasRef!, {
      type: "line",
      data: {
        labels,
        datasets: [{
          data,
          borderColor: props.color ?? "rgb(59,130,246)",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },

        scales: {

          x: {
            display: false,
          },

          y: {
            display: false,
            min: props.min,
            max: props.max,
          },
        },
      },
    });
  });

  createEffect(() => {

    const v = props.value;
    if (!chart) return;
    data.push(v);
    labels.push(index++);
    if (data.length > 10) {
      data.shift();
      labels.shift();
    }
    chart.update("none");
  });

  onCleanup(() => chart?.destroy());

  return (

    <div class="w-full h-full min-h-[60px]">
      <canvas ref={canvasRef} />
    </div>

  );

}