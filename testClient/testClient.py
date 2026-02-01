import socket
import json
import random
import time

HOST = "localhost"  # Server IP
PORT = 9999  # Server port


def make_random_point():
    x = random.randint(-500, 500) / 100
    y = random.randint(-500, 500) / 100
    z = random.randint(-500, 500) / 100
    return {"point": "(" + str(x) + ", " + str(y) + ", " + str(z) + ")", "class": "orange"}


def main():
    time.sleep(4)
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        print(f"Connecting to {HOST}:{PORT}...")
        s.connect((HOST, PORT))
        print("Connected!")

        while True:
            point = make_random_point()
            data = json.dumps(point).encode("utf-8")

            # Send JSON + newline terminator to make it stream-friendly
            s.sendall(data + b"\n")

            print("Sent:", point)

            time.sleep(5)  # send one per second (adjust as needed)


if __name__ == "__main__":
    main()
