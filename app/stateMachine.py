class State:
    def __init__(self, name, parent=None):
        self.name = name
        self.parent = parent
        self.children = {}

    def add_child(self, child):
        pass

    def enter(self):
        pass

    def exit(self):
        pass

    def update(self):
        pass


class StateMachine:
    def __init__(self, root_state):
        self.current: State = root_state

    def go_to(self, target_state):
        path_up = []
        s = self.current
        while s and s != target_state:
            path_up.append(s)
            s = s.parent

        for st in path_up:
            st.exit()

        path_down = []
        s = target_state
        while s and s not in path_up:
            path_down.append(s)
            s = s.parent
        path_down.reverse()

        for st in path_down:
            st.enter()

        self.current = target_state

    def update(self, callback=None):
        if callback is not None:
            callback(self.current.name)
        self.current.update()
