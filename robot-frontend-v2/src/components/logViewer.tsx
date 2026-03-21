import { For, Show, createEffect, type Accessor } from "solid-js";
import { logs } from "../stores/logStore";

interface LogViewerProps {
  logLevel: Accessor<number>;
}

export default function LogViewer(props: LogViewerProps) {

  let container!: HTMLDivElement;

  createEffect(() => {
    logs.length;
    container.scrollTop = container.scrollHeight;
  });

  return (
    <div
      ref={container}
      class="h-full overflow-y-auto bg-slate-900 rounded-xl p-2 md:p-3 font-mono text-xs md:text-sm"
    >
      <For each={logs}>
        {(log) => (
          <Show when={log.levelNumber >= props.logLevel()}>
            <div class={`${getColourClass(log.levelName)} wrap-break-word`}>
              {log.message}
            </div>
          </Show>
        )}
      </For>
    </div>
  );
}

function getColourClass(level: string) {
  switch (level) {
    case "ERROR":
      return "text-red-400";
    case "WARNING":
      return "text-yellow-400";
    case "INFO":
      return "text-green-400";
    case "DEBUG":
      return "text-blue-400";
    default:
      return "text-gray-400";
  }
}