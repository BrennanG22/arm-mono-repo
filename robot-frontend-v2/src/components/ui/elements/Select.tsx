import { createSignal, onCleanup, type Accessor } from "solid-js";

export type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type SelectProps<T extends string> = {
  value: Accessor<T>;
  onChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  disabled?: boolean;
};

export function Select<T extends string>(props: SelectProps<T>) {
  const [open, setOpen] = createSignal(false);

  const handleClickOutside = (e: MouseEvent) => {
    if (!(e.target as HTMLElement)?.closest("[data-select-root]")) {
      setOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  onCleanup(() =>
    document.removeEventListener("mousedown", handleClickOutside)
  );

  const selected = () =>
    props.options.find(o => o.value === props.value());

  return (
    <div class="relative" data-select-root>
      <button
        type="button"
        disabled={props.disabled}
        class={`
          w-full p-3 rounded-xl flex items-center justify-between
          bg-slate-800 border border-slate-700 text-slate-100
          focus:outline-none focus:ring-2 focus:ring-sky-500
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        onClick={() => !props.disabled && setOpen(v => !v)}
      >
        <span>{selected()?.label}</span>
        <span class="text-slate-400 text-sm">▾</span>
      </button>

      {open() && (
        <div
          class="
            absolute z-50 mt-2 w-full rounded-xl
            bg-slate-900 border border-slate-700 shadow-2xl
          "
        >
          {props.options.map(option => (
            <div
              class={`
                px-4 py-2 cursor-pointer
                text-slate-100 hover:bg-slate-800
                ${option.value === props.value() ? "bg-slate-800" : ""}
              `}
              onClick={() => {
                props.onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
