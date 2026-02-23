import LogViewer from "../components/logViewer";
import { LargeContainer } from "../components/ui/Containers";

export default function LoggingApplet() {
  return (
    <div class="flex gap-4 h-full w-full p-4 bg-gray-100 rounded-2xl">
      <LargeContainer class="w-10/12 h-full flex flex-col">
        <div class="text-lg font-semibold tracking-wider text-slate-50 mb-3">Logs</div>
        <LogViewer />
      </LargeContainer>
      <LargeContainer class="w-2/12">
        <div class="text-lg font-semibold tracking-wider text-slate-50 mb-3">Logs Configuration</div>
      </LargeContainer>
    </div >
  )
}