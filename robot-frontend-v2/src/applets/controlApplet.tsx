function ControlApplet() {
  return (
    <div class="applet control-applet">
      <h2>Control Applet</h2>
      <div class="grid grid-cols-5 grid-rows-4 aspect-square">
        <button class="panel col-start-2 row-start-1">
          UP
        </button>
        <button class="panel col-start-1 row-start-2">
          LEFT
        </button>
        <button class="panel col-start-3 row-start-2">
          RIGHT
        </button>
        <button class="panel col-start-2 row-start-3">
          DOWN 
        </button>
      </div>
    </div>
  );
}

export default ControlApplet;