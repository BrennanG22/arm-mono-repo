import { createStore } from "solid-js/store";

export interface AppState {
  socketConnected?: boolean;
}

export const [appState, setAppState] = createStore<AppState>({
  socketConnected: false,
});