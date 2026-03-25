import logging

from app.arm import armContext

logger = logging.getLogger()


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
    def __init__(self, arm_context: armContext.ArmContext):
        self.arm_states = {}
        self.current_state = None
        self.arm_context = arm_context

    def goto_state(self, state_name):
        if state_name in self.arm_states:
            logger.debug(f"Changing state to: {state_name}")
            self.current_state = self.arm_states.get(state_name)
            self.arm_context.data.sorting.update(lambda d: setattr(d, "active_state", state_name))
            self.arm_states.get(state_name).on_start()
        else:
            raise KeyError(f"State '{state_name}' does not exist in ArmStateMachine")

    def update(self):
        self.current_state.on_update()
