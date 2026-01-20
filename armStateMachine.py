import dataStores


class ArmState:
    def __init__(self, update_function, start_function):
        self.update_function = update_function
        self.start_function = start_function
        pass

    def on_start(self):
        self.start_function()

    def on_update(self):
        self.update_function()


class ArmStateMachine:
    def __init__(self):
        self.arm_states = {}
        self.current_state = None

    def goto_state(self, state_name):
        if state_name in self.arm_states:
            print("State Changing: " + state_name)
            self.current_state = self.arm_states.get(state_name)
            dataStores.arm_sorting_data.update(lambda d: setattr(d, "active_state", state_name))
            self.arm_states.get(state_name).on_start()
        else:
            raise KeyError(f"State '{state_name}' does not exist in ArmStateMachine")

    def update(self):
        self.current_state.on_update()
