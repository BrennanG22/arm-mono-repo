import socket
import json
import random
import time

HOST = "localhost"  # Server IP
PORT = 9999  # Server port
DELAY_READY = 1  # seconds before sending "Ready"

# Lists of possible colours and shapes
COLOURS = ["blue", "orange"]
SHAPES = ["circle", "square", "triangle", "rectangle", "oval", "star", "heart", "diamond", "pentagon", "hexagon"]


def make_random_point(index):
    # Randomly select a colour and shape from the lists
    colour = random.choice(COLOURS)
    shape = random.choice(SHAPES)
    return {
        "index": index,
        "colour": colour,
        "shape": shape,
        "Object Ready": "Not Ready"
    }


def main():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        print(f"Connecting to {HOST}:{PORT}...")
        s.connect((HOST, PORT))
        print("Connected!")

        index = 0
        while True:
            input("Press Enter to send a new point...")
            index += 1

            point = make_random_point(index)
            s.sendall(json.dumps(point).encode("utf-8") + b"\n")
            print("Sent:", point)

            time.sleep(DELAY_READY)
            point["Object Ready"] = "Ready"
            s.sendall(json.dumps(point).encode("utf-8") + b"\n")
            print("Sent:", point)


if __name__ == "__main__":
    main()
