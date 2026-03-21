import { createSignal } from "solid-js";;
import LogViewer from "../components/logViewer";
import { LargeContainer } from "../components/ui/Containers";
import { Select } from "../components/ui/elements/Select";

export default function LoggingApplet() {
  const [logLevel, setLogLevel] = createSignal<number>(10);

  return (
    <div class="flex flex-col md:flex-row gap-4 h-full w-full p-2 md:p-4 bg-gray-100 rounded-2xl">

      <LargeContainer class="w-full md:w-10/12 h-[60vh] md:h-full flex flex-col">
        <div class="text-base md:text-lg font-semibold tracking-wider text-slate-50 mb-2 md:mb-3">
          Logs
        </div>
        <LogViewer logLevel={logLevel} />
      </LargeContainer>

      <LargeContainer class="w-full md:w-2/12">
        <div class="text-base md:text-lg font-semibold tracking-wider text-slate-50 mb-2 md:mb-3">
          Logs Configuration
        </div>

        <div class="text-sm text-slate-400 mb-2">
          Minimum log level:
        </div>

        <Select
          value={logLevel}
          options={[
            { label: "DEBUG", value: 10 },
            { label: "INFO", value: 20 },
            { label: "WARNING", value: 30 },
            { label: "ERROR", value: 40 },
            { label: "CRITICAL", value: 50 }
          ]}
          onChange={(value) => setLogLevel(value)}
        />
      </LargeContainer>

    </div>
  );
}