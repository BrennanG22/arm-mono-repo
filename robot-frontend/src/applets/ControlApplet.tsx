function ControlApplet() {
    return (
        <div>
            <h2>Control Applet Placeholder</h2>
            <select>
                <option value="pointTrack">Point Track</option>
                <option value="servoTrack">Servo Track</option>
            </select>
            <input type="number" placeholder="X Position"></input>
            <input type="number" placeholder="Y Position"></input>
            <input type="number" placeholder="Z Position"></input>
        </div>
    );
}

export default ControlApplet;