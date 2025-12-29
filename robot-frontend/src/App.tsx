import { useState } from "react";
import "./App.css";
import MonitorApplet from "./applets/MonitorApplet";
import ControlApplet from "./applets/controlApplet";

type AppletType = "Monitor" | "Control" | "Configure" | "Update";

export default function App() {

  const [activeApplet, setActiveApplet] = useState<AppletType>("Monitor");

  return (
    <div className="app-container">
      <header className="top-banner">
        <h1>Robotic Arm Configuration</h1>
      </header>

      <div className="main-content">
        <div className="hamburger-menu">

          <ul className="menu-items">
            <li onClick={() =>setActiveApplet("Monitor")}>Monitor</li>
            <li onClick={() =>setActiveApplet("Control")}>Control</li>
            <li onClick={() =>setActiveApplet("Configure")}>Configure</li>
            <li onClick={() =>setActiveApplet("Update")}>Update</li>
          </ul>
        </div>
        {activeApplet === "Monitor" && <MonitorApplet />}
        {activeApplet === "Control" && <ControlApplet />}
      </div>
    </div>

  );
}