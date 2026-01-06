function ControlApplet() {
  return (
    <div className="applet control-applet">
      <h2>Control Applet</h2>
      <div className="grid grid-cols-5 grid-rows-4 aspect-square">
        <button className="panel col-start-2 row-start-1">
          UP
        </button>
        <button className="panel col-start-1 row-start-2">
          LEFT
        </button>
        <button className="panel col-start-3 row-start-2">
          RIGHT
        </button>
        <button className="panel col-start-2 row-start-3">
          DOWN 
        </button>
      </div>
    </div>
  );
}

export default ControlApplet;