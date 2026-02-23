/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import App from './App.tsx'
import { Route, Router } from '@solidjs/router'
import ControlApplet from './applets/controlApplet.tsx'
import MonitorApplet from './applets/monitorApplet.tsx'
import ConfigureApplet from './applets/configureApplet.tsx'
import LoggingApplet from './applets/loggingApplet.tsx'

const root = document.getElementById('root')

render(() =>
  <Router root={App}>
    <Route path="/" component={MonitorApplet} />
    <Route path="/monitor" component={MonitorApplet} />
    <Route path="/control" component={ControlApplet} />
    <Route path="/configure" component={ConfigureApplet} />
    <Route path={"/logging"} component={LoggingApplet} />
    {/* <Route path="/update" component={UpdateApplet} /> */}
  </Router>, root!)
