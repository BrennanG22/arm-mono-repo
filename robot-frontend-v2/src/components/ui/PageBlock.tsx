import { children, Show, splitProps, type JSX, type Accessor } from "solid-js";

export function PageBlock(props: {
  children: JSX.Element;
  class?: string;
  open: Accessor<boolean>;
  onClose?: () => void;
}) {
  const [local, others] = splitProps(props, ["children", "class", "open", "onClose"]);

  const c = children(() => local.children);

  return (
    <Show when={local.open()}>
      <div {...others} class="fixed inset-0 z-50 flex items-center justify-center">

        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => local.onClose?.()}
        />

        <div class={`relative bg-gray-800 rounded-2xl p-6 w-150 max-w-[90%] shadow-xl ${local.class ?? ""}`}>
          {c()}
        </div>

      </div>
    </Show>
  );
}