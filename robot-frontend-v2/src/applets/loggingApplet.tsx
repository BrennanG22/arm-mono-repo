import { createSignal } from "solid-js"; ;
import LogViewer from "../components/logViewer";
import { LargeContainer } from "../components/ui/Containers";
import { Select } from "../components/ui/elements/Select";

export default function LoggingApplet() {

  const [logLevel, setLogLevel] = createSignal<number>(10);

  return (
    <div class="flex gap-4 h-full w-full p-4 bg-gray-100 rounded-2xl">
      <LargeContainer class="w-10/12 h-full flex flex-col">
        <div class="text-lg font-semibold tracking-wider text-slate-50 mb-3">Logs</div>
        <LogViewer logLevel={logLevel} />
      </LargeContainer>
      <LargeContainer class="w-2/12">
        <div class="text-lg font-semibold tracking-wider text-slate-50 mb-3">Logs Configuration</div>
        <div class="text-sm text-slate-400 mb-2">Minimum log level to display:</div>
        <Select
          value={logLevel}
          options={[ 
            { label: "DEBUG", value: 10 },
            { label: "INFO", value: 20 },
            { label: "WARNING", value: 30 },
            { label: "ERROR", value: 40 }
          ]}
          onChange={(value) => setLogLevel(value)}
        />
      </LargeContainer>
    </div >
  )
}