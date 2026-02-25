import { children, splitProps, type JSX } from "solid-js";

export function LargeContainer(props: {
  children: JSX.Element;
  class?: string;
}) {

  const [local, others] = splitProps(props, ["children", "class"]);

  const c = children(() => local.children);

  return (
    <div
      class={`p-3 bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 rounded-2xl shadow-2xl border border-slate-800/50 ${local.class ?? ""}`}
      {...others}
    >
      {c()}
    </div>
  );
}


export function MetricContainer(props: {
  children: JSX.Element;
  class?: string;
  metricName: string
}) {
  const [local, others] = splitProps(props, ["children", "class", "metricName"]);

  const c = children(() => local.children);

  return (
    <div
      class={`bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 ${local.class ?? ""}`}
      {...others}
    >
      <div class="text-xs uppercase tracking-widest text-slate-400 mb-1">
        {local.metricName}
      </div>
      <div>
        {c()}
      </div>
    </div>
  );
}
