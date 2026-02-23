import { For, createEffect } from "solid-js";
import { logs } from "../stores/logStore";

export default function LogViewer() {

  let container!: HTMLDivElement;

  createEffect(() => {
    logs.length;
    container.scrollTop = container.scrollHeight;
  });

  return (
    <div
      ref={container}
      class="h-full overflow-y-auto bg-slate-900 rounded-xl p-2 font-mono text-sm"
    >
      <For each={logs}>
        {(log) => (
          < div class="text-green-400">
            {log.message}
          </div>
        )
        }
      </For >
      {logs.length}
    </div >
  );
}