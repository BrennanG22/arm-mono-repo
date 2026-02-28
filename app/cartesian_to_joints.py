'''
formerly called ik_to_pwm_bridge
This file is really more of an Inverse Kinematics to Joint Angles bridge rn. it has a lot of the fault handling
and class creation, but doesn't have any functionality to actually send out PWM signals. 
'''

# NOTES FROM TEST SESSION JAN 29
'''
-make function that can return current position (xyz) - done
-adjust time function to take the difference in angles and get time of movement from that (done)
-
'''

# To do
'''
- finish making startup and shutdown capability
'''


# ik_to_pwm_bridge.py

import math
import numpy as np
import json
#import matplotlib.pyplot
#from mpl_toolkits.mplot3d import Axes3D

from kinematics_ik import ROT3U_chain, ik_with_orientation_fallback


class ArmController:
    """
    Bridge between high-level Cartesian commands (x, y, z, phi)
    and low-level servo angles.

    Units:
      - x, y, z are given in centimeters in move_to_position()
      - Internally converted to meters for ikpy
      - phi_deg is the desired tool tilt in degrees:
          0   = tool "horizontal" (Z-axis of tool along +X)
          +90 = tool Z-axis up
          -90 = tool Z-axis down
    """
    #_startup_done_global = False

    def __init__(self):
        """
        initialization
        imports ik model from kinematics_ik
        sets current servo angles when code is first ran

        """
        self.current_value = 0
        self.chain = ROT3U_chain
        # One joint value per link in the chain (OriginLink + 5 URDFLinks)
        #self.current_joints = np.zeros(len(self.chain.links), dtype=float)
        self.current_servo_angles_deg = [90, 90, 90, 90, 180, 90]
        self.servo_offsets_deg = [90, 90, 90, 90, 90, 90]

        #self.startup_done = False

    # def ensure_startup(self):
    #     """Run startup() exactly once, before the first real motion."""
    #     if not ArmController._startup_done_global:
    #         self.startup()
    #         ArmController._startup_done_global = True


    def current_sense(self, current):
        self.current_value = current
        return None

    def load_position(self, filename="angles.json"):
        """Reads servo angles from a JSON file and updates the robot's state.
        need to adjust to make first state shutdown state if json DNE"""
        try:
            # Open the file in read mode ('r')
            with open(filename, 'r') as json_file:
                # json.load parses the text file back into Python lists/dictionaries
                loaded_angles = json.load(json_file)
            
            # Update your instance variable with the retrieved data
            self.current_servo_angles_deg = loaded_angles
            print(f"Successfully loaded angles: {self.current_servo_angles_deg}")
            return True

        # Catch specific errors to prevent crashes if something goes wrong
        except FileNotFoundError:
            print(f"Error: Could not find the file '{filename}'.")
            print('Defaulting to shutdown position.')
            self.current_servo_angles_deg = [89.99999999999999, 3.5108631313387377, 123.12677409500321, 60.38408907252596, 180, 90.0]
            self.store_position()
            self.load_position()
            return True
        except json.JSONDecodeError:
            print(f"Error: '{filename}' contains invalid JSON data.")
            return False
        except IOError as e:
            print(f"Error reading from '{filename}': {e}")
            return False
        
    def store_position(self, filename = 'angles.json'):
        angles = self.current_servo_angles_deg
        # Open the file in write mode and save the data
        try:
            with open(filename, 'w') as json_file:
                # indent=4 makes the JSON file readable (pretty-printed)
                json.dump(angles, json_file, indent=4) 
            return True
        except IOError as e:
            print(f"Error saving to {filename}: {e}")
            return False

    def gripper(self, closed):
        '''
        1 = closed
        0 = open
        '''

        # --- TWEAKABLE CONSTANTS ---
        ANGLE_OPEN = 0
        ANGLE_CLOSED = 180
        STEP_SIZE = 2             # Degrees to move per iteration
        STEP_DELAY = 0.02         # Seconds to wait between steps to allow physical movement & sensor update
        CURRENT_THRESHOLD = 500   # Sensor value that defines a "spike" (update to your sensor's metric)
        BACKOFF_ANGLE = 5         # Degrees to back off if a spike is detected

        import time
        from adafruit_servokit import ServoKit
        kit = ServoKit(channels=16)
        kit.servo[5].set_pulse_width_range(900, 1500) # tune to open and closed positions to a max of (600, 2450)
        kit.servo[5].actuation_range = 180

        # Determine target angle based on command
        target_angle = ANGLE_CLOSED if closed == 1 else ANGLE_OPEN

        self.load_position()
        current_angle = self.current_servo_angles_deg[5]

        # Determine direction of travel (+1 for closing, -1 for opening)
        if target_angle > current_angle:
            direction = 1
        elif target_angle < current_angle:
            direction = -1
        else:
            return # Already at the requested position
        
        # Move incrementally towards the target
        while (direction == 1 and current_angle < target_angle) or \
              (direction == -1 and current_angle > target_angle):
            
            # Calculate next angle and clamp it to our min/max limits to prevent errors
            current_angle += (direction * STEP_SIZE)
            current_angle = max(ANGLE_OPEN, min(ANGLE_CLOSED, current_angle))
            
            # Command the servo
            kit.servo[5].angle = current_angle
            
            # Wait for servo to move and for the async current_sense() to catch up
            time.sleep(STEP_DELAY)
            
            # Check for current spike
            # (Ensures self.current_value exists before checking it)
            if hasattr(self, 'current_value') and self.current_value is not None:
                if self.current_value > CURRENT_THRESHOLD:
                    print(f"Current spike detected ({self.current_value}). Halting gripper.")
                    
                    # OPTION A: Hold current position
                    # We achieve this by simply breaking out of the loop and leaving the angle as-is.
                    break 
                    
                    # OPTION B: Back off slightly 
                    # (Commented out as requested)
                    # current_angle -= (direction * BACKOFF_ANGLE)
                    # current_angle = max(ANGLE_OPEN, min(ANGLE_CLOSED, current_angle))
                    # kit.servo[SERVO_CHANNEL].angle = current_angle
                    # break
                    
        print(f"Gripper action finished at angle: {current_angle}")


    def startup(self):
        '''
        Safely moves from resting position to 'straight up' position
        '''
        #self.load_position()
        self.send_angles_to_servos([0,0,0,0,0,0]) # straight-up position

    def shutdown(self):
        '''
        safely moves to resting position
        '''
        #self.load_position()
        # 35 0 10
        self.move_to_position(35, 0 , 10)
        #self.send_angles_to_servos([0, 90, 10, 0, 0, 0]) # adjust in lab session


    def get_current_position_deg(self):
        '''
        gives the current angles of each servo
        '''
        return self.current_servo_angles_deg
    
    def get_current_position_coords(self):
        '''
        not functional yet
        '''
        angles = self.current_servo_angles_deg
        base = angles[0]
        shoulder = angles[1]
        elbow = angles[2]
        wrist = angles[3]
        rads = [
            0,
            math.radians(base),
            math.radians(shoulder),
            math.radians(elbow),
            math.radians(wrist),
            0
        ]
        fk_matrix = self.chain.forward_kinematics(rads)
        print(fk_matrix)
        
        x_m = fk_matrix[0, 3]
        y_m = fk_matrix[1, 3]
        z_m = fk_matrix[2, 3]

        target_pos_m = [x_m, y_m, z_m]
        target_dir = self._phi0_orientation_for_position(target_pos_m)
        orientation_mode = "X"   # constrain X-axis of EE

        solution, info = ik_with_orientation_fallback(
            self.chain,
            target_position=target_pos_m,
            target_orientation=target_dir,
            orientation_mode=orientation_mode,
            # initial_position=self.current_joints,
        )

        base_deg     = math.degrees(solution[1])
        shoulder_deg = math.degrees(solution[2])
        elbow_deg    = math.degrees(solution[3])
        wrist_deg    = math.degrees(solution[4])

        # We have 4 DOFs modeled; add 2 placeholders (wrist_roll, gripper)
        servo_angles = [
            base_deg,
            shoulder_deg,
            elbow_deg,
            wrist_deg,
            0.0,  # wrist_roll placeholder
            0.0,  # gripper placeholder
        ]

        print(servo_angles)

        x_cm = round(x_m * 100.0, 2)
        y_cm = round(y_m * 100.0, 2)
        z_cm = round(z_m * 100.0, 2)

        return [x_cm, y_cm, z_cm]

    def send_angles_to_servos(self, joint_angles_deg):
        """
        Placeholder: replace with your real PWM / servo code.
        joint_angles_deg: list of 6 servo angles in degrees
                          [base, shoulder, elbow, wrist, wrist_roll, gripper]
        """

        step_constant = 50 # multiplies movement time to determine how many steps take place
        speed_constant = 60 # deg/s of the servo with the greatest change

        # print("\nSending joint angles to servo controller:")
        # for i, angle in enumerate(joint_angles_deg):
        #     print(f"Servo {i}: {round(angle, 2)}°")

        import time
        from adafruit_servokit import ServoKit
        kit = ServoKit(channels=16) # 16 channels on the PWM driver

        # calibration to limits of joints
        kit.servo[0].set_pulse_width_range(580, 2450) # adjust min and max pulse widths
        kit.servo[1].set_pulse_width_range(540, 2460)
        kit.servo[2].set_pulse_width_range(530, 2450)
        kit.servo[3].set_pulse_width_range(630, 2480)
        kit.servo[4].set_pulse_width_range(580, 2440)
        #kit.servo[5].set_pulse_width_range(900, 1500)

        kit.servo[0].actuation_range = 180 # adjust maximum actuation to 120
        kit.servo[1].actuation_range = 180
        kit.servo[2].actuation_range = 180
        kit.servo[3].actuation_range = 180
        kit.servo[4].actuation_range = 180
        #kit.servo[5].actuation_range = 180

        #fix angles that are backwards
        joint_angles_deg[1] = -1*joint_angles_deg[1]
        #hard code wrist rotation
        joint_angles_deg[4] = 90
        # 🔹 APPLY OFFSETS HERE
        commanded_angles = [
            joint_angles_deg[i] + self.servo_offsets_deg[i]
            for i in range(6)
        ]
        

        #print("joint angles are: ",commanded_angles)

        
        def rectangular(starts, targets, total_time, steps):
            wait_time = total_time / steps
            for s in range(1, steps + 1):
                for ch in range(5):
                    start = starts[ch]
                    target = targets[ch]
                    step_size = (target - start) / steps
                    kit.servo[ch].angle = start + step_size * s
                time.sleep(wait_time)
            return None

        self.load_position()
        starts = self.current_servo_angles_deg[:] 
        targets = commanded_angles  
        print("starts are: ", starts)

        # dynamically change speed based on degrees
        total_time1 = 0
        for ch in range(5):
            start = starts[ch]
            target = targets[ch]
            difference = abs(target-start) # degrees
            t = difference/speed_constant # seconds to take for motion
            if t > total_time1:
                total_time1 = t
            else:
                t = 0


        print("Moving to Position")
        rectangular(starts, targets, total_time=total_time1, steps = max(1,int(total_time1*step_constant)))
        print("Position Reached")
        self.current_servo_angles_deg = targets
        if self.store_position():
            print("Current Position Saved")
        else:
            print("failed to save current position")


    def _phi_to_target_orientation(self, phi_deg):
        """
        Convert desired tool tilt phi (deg) into a world-space target
        direction for the end-effector Z-axis.

        phi = 0°   → direction [1, 0, 0]  (horizontal, along +X)
        phi = +90° → direction [0, 0, 1]  (straight up)
        phi = -90° → direction [0, 0,-1]  (straight down)
        """
        phi_rad = math.radians(phi_deg)
        # Rotate from +X toward +Z in the X–Z plane
        return np.array([math.cos(phi_rad), 0.0, math.sin(phi_rad)], dtype=float)

    def _phi0_orientation_for_position(self, target_pos_m):
        x = target_pos_m[0]
        if x >= 0:
            # front / positive x: X-axis toward -Z
            return np.array([0.0, 0.0, -1.0])
        else:
            # back / negative x: X-axis toward +Z
            return np.array([0.0, 0.0,  1.0])


    def move_to_position(self, x_cm, y_cm, z_cm, phi_deg=0):
        """
        Attempts to move robotic arm to requested position.
        All coordinates should be in cm, measured from the base of the robot.

        Returns:
          (reachable, info_dict, servo_angles)

        reachable: bool 

        info_dict: same structure as move_to_position uses
        (mode, pos_err, ori_err)

        servo_angles: list of joint angles (deg) IF reachable, else None
        """

        # guarantee startup ran before the first move
        #self.ensure_startup()
        target_pos_m = np.array([x_cm, y_cm, z_cm], dtype=float) / 100.0
        #phi_deg = 0
        if phi_deg == 0:
            # special “horizontal” behaviour with front/back flip
            target_dir = self._phi0_orientation_for_position(target_pos_m)
            orientation_mode = "X"   # constrain X-axis of EE
            #print("its still zero dude")
        else:
            # your existing general phi handling, if you keep it
            target_dir = self._phi_to_target_orientation(phi_deg)
            orientation_mode = "X"   # or whatever you used before

        solution, info = ik_with_orientation_fallback(
            self.chain,
            target_position=target_pos_m,
            target_orientation=target_dir,
            orientation_mode=orientation_mode,
            # initial_position=self.current_joints,
        )

        mode = info["mode"]
        pos_err = info["pos_err"]
        ori_err = info["ori_err"]

        if mode == "fail-both":
            print(
                f"IK failed: cannot reach position within tolerance "
                f"(pos_err={pos_err:.4f} m, ori_err={ori_err:.4f} rad)"
            )
            return None

        if mode == "position-only":
            print(
                f"IK warning: using position-only solution "
                f"(pos_err={pos_err:.4f} m, ori_err={ori_err:.4f} rad)"
            )

        # 4) Store joint solution (radians)
        #self.current_joints = solution

        # solution has one entry per link (OriginLink + base + shoulder + elbow + wrist + tool)
        # Active joints are at indices: 1=base, 2=shoulder, 3=elbow, 4=wrist
        base_deg     = math.degrees(solution[1])
        shoulder_deg = math.degrees(solution[2])
        elbow_deg    = math.degrees(solution[3])
        wrist_deg    = math.degrees(solution[4])

        # We have 4 DOFs modeled; add 2 placeholders (wrist_roll, gripper)
        servo_angles = [
            base_deg,
            shoulder_deg,
            elbow_deg,
            wrist_deg,
            0.0,  # wrist_roll placeholder
            0.0,  # gripper placeholder
        ]

        # 5) Send to servos
        self.send_angles_to_servos(servo_angles)

 

        return servo_angles

    def check_position(self, x_cm, y_cm, z_cm, phi_deg=0):
        """
        Simulates move_to_position WITHOUT sending servo commands.

        Returns:
          (reachable, info_dict, servo_angles)

        reachable: bool 

        info_dict: same structure as move_to_position uses
        (mode, pos_err, ori_err)

        servo_angles: list of joint angles (deg) IF reachable, else None
        """

        target_pos_m = np.array([x_cm, y_cm, z_cm], dtype=float) / 100.0

        if phi_deg == 0:
            target_dir = self._phi0_orientation_for_position(target_pos_m)
            orientation_mode = "X"
        else:
            target_dir = self._phi_to_target_orientation(phi_deg)
            orientation_mode = "X"

        solution, info = ik_with_orientation_fallback(
            self.chain,
            target_position=target_pos_m,
            target_orientation=target_dir,
            orientation_mode=orientation_mode,
        )

        mode = info["mode"]
        pos_err = info["pos_err"]
        ori_err = info["ori_err"]

        # Hard failure
        if mode == "fail-both":
            return False, info, None

        # Extract joint angles exactly like move_to_position
        base_deg     = math.degrees(solution[1])
        shoulder_deg = math.degrees(solution[2])
        elbow_deg    = math.degrees(solution[3])
        wrist_deg    = math.degrees(solution[4])

        servo_angles = [
            base_deg,
            shoulder_deg,
            elbow_deg,
            wrist_deg,
            0.0,
            0.0,
        ]

        return True, info, servo_angles



if __name__ == "__main__":
    # Simple manual test
    import time
    arm = ArmController()
    # Move to 10 cm forward, 0 cm lateral, 20 cm up, tool horizontal
    #arm.move_to_position(10, 10, 20, phi_deg=90)
    # arm.send_angles_to_servos([-90,0,0,0,0,0])
    # time.sleep(2)

    # start up
    #arm.startup()

    # come to a safe rest
    arm.send_angles_to_servos([0,-90,-40,45,0,0])
    # while True:
    #     angles = []
    #     print("enter coordinates")
    #     while len(angles) <4:
    #         try:
    #             value = float(input(f"Angle {len(angles)+1}: "))
    #             if -90 <= value <= 90:
    #                 angles.append(value)
    #             else:
    #                 print('nope')
    #         except ValueError:
    #             print('nope')

    #     angles.append(0)
    #     angles.append(0)
    #     arm.send_angles_to_servos(angles)

    #     again=input('again? y/n').lower()
    #     if again != 'y':
    #         print('done')
    #         break
