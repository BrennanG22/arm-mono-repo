import { children, splitProps, type JSX } from "solid-js";

export function Button(props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) {

  const [local, others] = splitProps(props, ["children", "class"]);
  const c = children(() => local.children);

  return (
    <button
      class={`p-3 rounded-xl
        border border-slate-700
        bg-linear-to-b from-slate-800 to-slate-900
        text-slate-200 font-medium
        shadow-lg shadow-black/40
        transition-all duration-75
        hover:bg-linear-to-b hover:from-slate-700 hover:to-slate-800
        active:translate-y-0.5
        active:shadow-inner active:shadow-black/60
        focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-slate-800 disabled:hover:to-slate-900 disabled:active:translate-y-0 disabled:shadow-none
        ${local.class ?? ""}`}
      {...others}
    >
      {c()}
    </button>
  );
}

export function ButtonRed(props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) {

  const [local, others] = splitProps(props, ["children", "class"]);
  const c = children(() => local.children);

  return (
    <button
      class={`p-3 rounded-xl
        border border-red-700
        bg-linear-to-b from-red-900 to-red-950
        text-red-200 font-medium
        shadow-lg shadow-black/40
        transition-all duration-75
        hover:bg-linear-to-b hover:from-red-800 hover:to-red-900
        active:translate-y-0.5
        active:shadow-inner active:shadow-black/60
        focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-red-900 disabled:hover:to-red-950 disabled:active:translate-y-0 disabled:shadow-none
        ${local.class ?? ""}`}
      {...others}
    >
      {c()}
    </button>
  );
}