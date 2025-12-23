import json
import queue
import threading
import time

import armController
import re
import socketServer
import stateMachine

import webServer
import webSocketServer

INET_data_queue = queue.Queue()
webSocket_points_data_queue = queue.Queue()


test_sort_point = [3, 3, 1]
reset_point = [1, 0, 1]


def main():
    web_socket_previous_point = [0, 0, 0]

    controller = armController.ArmController()

    # Socket server startup
    socket_thread = threading.Thread(target=start_socket_server, daemon=True)
    socket_thread.start()
    print("Server is ready and listening! Executing post-startup code...")

    # State machine startup
    root = stateMachine.State("root")
    idle = stateMachine.State("idle", parent=root)
    sorting = stateMachine.State("sorting", parent=root)
    resting = stateMachine.State("resting", parent=root)

    root.add_child(idle)
    root.add_child(sorting)
    root.add_child(resting)

    sm = stateMachine.StateMachine(root)
    sm.go_to(idle)
    sm.update()

    # Sorting state machine startup
    sort_root = stateMachine.State("root")
    moving_to = stateMachine.State("moving_to")
    grab = stateMachine.State("grab")
    lift_up = stateMachine.State("lift_up")
    moving_sort = stateMachine.State("moving_sort")
    drop = stateMachine.State("drop")

    sort_root.add_child(moving_to)
    sort_root.add_child(grab)
    sort_root.add_child(lift_up)
    sort_root.add_child(moving_sort)
    sort_root.add_child(drop)

    ssm = stateMachine.StateMachine(sort_root)
    ssm.go_to(moving_to)
    sm.update()

    # Start web server
    webServer.start_api_thread()

    ws_server = webSocketServer.WebSocketServer(host="localhost")
    ws_server.start()

    while True:
        time.sleep(0.001)

        try:
            ws_points = webSocket_points_data_queue.get_nowait()
            data_serializable = [[float(x), float(y), float(z)] for x, y, z in ws_points]
            json_point_data = json.dumps(data_serializable)
            json_str = "{\"message\": \"path\", \"data\": " + json_point_data + "}"
            ws_server.send_to_all(json_str)
        except queue.Empty:
            pass

        if web_socket_previous_point != controller.current_pathing_pos:
            pos = controller.current_pathing_pos

            if pos is not None:
                json_str = json.dumps({
                    "message": "currentPoint",
                    "data": [float(pos[0]), float(pos[1]), float(pos[2])]
                })
                web_socket_previous_point = pos
                ws_server.send_to_all(json_str)

        if sm.current.name == "idle":
            if not controller.active_routing:
                try:
                    msg = INET_data_queue.get_nowait()
                    sm.go_to(sorting)
                    sm.update()
                    convert_and_pass_message(msg, controller)
                except queue.Empty:
                    pass
                pass
        if sm.current.name == "sorting":
            if not controller.active_routing:
                if ssm.current.name == "moving_to":
                    ssm.go_to(grab)
                    ssm.update()
                elif ssm.current.name == "grab":
                    ssm.go_to(lift_up)
                    ssm.update()
                elif ssm.current.name == "lift_up":
                    new_pos = tuple(a + b for a, b in zip(controller.current_pathing_pos, [0, 0, 1]))
                    webSocket_points_data_queue.put(controller.route_to_new_point(new_pos))
                    ssm.go_to(moving_sort)
                    ssm.update()
                elif ssm.current.name == "moving_sort":
                    webSocket_points_data_queue.put(controller.route_to_new_point(test_sort_point))
                    ssm.go_to(drop)
                    ssm.update()
                elif ssm.current.name == "drop":
                    ssm.go_to(moving_to)
                    ssm.update()
                    sm.go_to(resting)
                    sm.update()
        if sm.current.name == "resting":
            if not controller.active_routing:
                webSocket_points_data_queue.put(controller.route_to_new_point(reset_point))
                sm.go_to(idle)
                sm.update()
        pass


def convert_and_pass_message(msg, controller):
    pattern = r'\(([^,]+),([^,]+),([^)]+)\)'
    matches = re.findall(pattern, msg['point'])
    if len(matches) >= 1:
        point = tuple(float(x) for x in matches[0])

        webSocket_points_data_queue.put(controller.route_to_new_point(point))
    pass


def start_socket_server():
    socketServer.listen_for_messages(socketServer.create_server(),
                                     lambda msg: INET_data_queue.put(msg))


if __name__ == "__main__":
    main()
