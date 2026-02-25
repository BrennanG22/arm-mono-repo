import { children, splitProps, type JSX } from "solid-js";


export function SingleLineText(props: JSX.InputHTMLAttributes<HTMLInputElement>) {

  const [local, others] = splitProps(props, ["children", "class"]);

  const c = children(() => local.children);

  return (
    <input
      type="text"
      autocomplete="off"
      class={`p-3 
        rounded-xl 
        bg-slate-800/50 
        border 
        border-slate-700 
        text-slate-100 
        placeholder-slate-500 
        focus:outline-none 
        focus:ring-2 
        focus:ring-sky-500 
        focus:border-sky-500 
        transition-colors  
        ${local.class ?? ""}`}
      {...others}
    >
      {c()}
    </input>
  );
}

export function Input(props: JSX.InputHTMLAttributes<HTMLInputElement> & { label?: string, containerClass?: string }) {

  const [local, others] = splitProps(props, ["children", "class", "label", "containerClass", "value"]);

  const c = children(() => local.children);

  return (
    <div class={`flex flex-col gap-1 ${local.containerClass ?? ""}`}>
      {local.label && (
        <label class="text-sm text-slate-300">
          {local.label}
        </label>
      )}

      <input
        autocomplete="off"
        class={`p-3 
          rounded-xl 
          bg-slate-800/50 
          border 
        border-slate-700 
        text-slate-100 
        placeholder-slate-500 
        focus:outline-none 
        focus:ring-2 
        focus:ring-sky-500 
        focus:border-sky-500 
        transition-colors  
        ${local.class ?? ""}`}
        value={local.value ?? ""}
        {...others}
      >
        {c()}
      </input>
    </div>
  );
}