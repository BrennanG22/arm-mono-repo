function ConfigureApplet() {
  return (
    <div class="h-full p-4 bg-gray-100 rounded-2xl">
      <div class="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-800/50">
        <div class="flex flex-col gap-6">
          {/* Header */}
          <div class="text-lg font-semibold tracking-wider text-slate-50">
            Configure Points
          </div>

          {/* Selector row */}
          <div class="flex gap-3 items-center">
            <select class="flex-1 p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors">
              <option value="option1" class="bg-slate-900 text-slate-100">Option 1</option>
              <option value="option2" class="bg-slate-900 text-slate-100">Option 2</option>
            </select>

            <button
              class="
                h-11 w-11 flex items-center justify-center rounded-xl
                border border-slate-700
                bg-gradient-to-b from-slate-800 to-slate-900
                text-xl font-semibold text-slate-200
                shadow-lg shadow-black/40
                transition-all duration-75
                hover:bg-gradient-to-b hover:from-slate-700 hover:to-slate-800
                active:translate-y-0.5
                active:shadow-inner active:shadow-black/60
                focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900
              "
              aria-label="Add new point"
            >
              +
            </button>
          </div>

          {/* Point definition */}
          <div class="flex flex-col gap-4">
            <div class="flex gap-3">
              <input
                type="text"
                name="pointName"
                placeholder="Point Name"
                class="flex-1 p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
              />

              <select
                name="pointType"
                value={"conveyor"}
                class="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors min-w-[180px]"
              >
                <option value="conveyor" class="bg-slate-900 text-slate-100">Conveyor Point</option>
                <option value="sorting" class="bg-slate-900 text-slate-100">Sorting Point</option>
              </select>
            </div>

            {/* Conveyor config */}
            <div class="pt-4 border-t border-slate-700/50">
              <div class="text-sm font-medium text-slate-300 mb-3">
                Conveyor Coordinates
              </div>
              <div class="flex gap-3">
                <input
                  type="number"
                  name="xCoord"
                  placeholder="X"
                  class="flex-1 p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                />
                <input
                  type="number"
                  name="yCoord"
                  placeholder="Y"
                  class="flex-1 p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                />
                <input
                  type="number"
                  name="zCoord"
                  placeholder="Z"
                  class="flex-1 p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            {/* Sorting config */}
            <div class="pt-4 border-t border-slate-700/50">
              <div class="text-sm font-medium text-slate-300 mb-3">
                Sorting Configuration
              </div>
              <div class="flex flex-col gap-3">
                <div class="text-xs uppercase tracking-widest text-slate-400 mb-1">
                  Target Coordinates
                </div>
                <div class="flex gap-3">
                  <input
                    type="number"
                    placeholder="X"
                    class="flex-1 p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                  />
                  <input
                    type="number"
                    placeholder="Y"
                    class="flex-1 p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                  />
                  <input
                    type="number"
                    placeholder="Z"
                    class="flex-1 p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                  />
                </div>

                <div class="mt-2">
                  <div class="text-xs uppercase tracking-widest text-slate-400 mb-1">
                    Instructions
                  </div>
                  <textarea
                    name="sortingInstructions"
                    placeholder="Enter sorting instructions..."
                    class="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-100 placeholder-slate-500 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors resize-y"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-700/50 flex gap-3">
            <button
              class="
                flex-1 p-3 rounded-xl
                border border-slate-700
                bg-gradient-to-b from-slate-800 to-slate-900
                text-slate-200 font-medium
                shadow-lg shadow-black/40
                transition-all duration-75
                hover:bg-gradient-to-b hover:from-slate-700 hover:to-slate-800
                active:translate-y-0.5
                active:shadow-inner active:shadow-black/60
                focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900
              "
            >
              Save Point
            </button>
            
            <button
              class="
                flex-1 p-3 rounded-xl
                border border-red-800/50
                bg-gradient-to-b from-red-900/30 to-red-950/30
                text-red-300 font-medium
                shadow-lg shadow-black/40
                transition-all duration-75
                hover:bg-gradient-to-b hover:from-red-800/40 hover:to-red-900/40
                active:translate-y-0.5
                active:shadow-inner active:shadow-black/60
                focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900
              "
            >
              Clear Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfigureApplet;