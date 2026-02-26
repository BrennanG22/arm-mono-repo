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
    _startup_done_global = False

    def __init__(self):
        """
        initialization
        imports ik model from kinematics_ik
        sets current servo angles when code is first ran

        """
        self.chain = ROT3U_chain
        # One joint value per link in the chain (OriginLink + 5 URDFLinks)
        #self.current_joints = np.zeros(len(self.chain.links), dtype=float)
        self.current_servo_angles_deg = [90, 90, 90, 90, 180, 90]
        self.servo_offsets_deg = [90, 90, 90, 90, 90, 90]

        self.startup_done = False

    # def ensure_startup(self):
    #     """Run startup() exactly once, before the first real motion."""
    #     if not ArmController._startup_done_global:
    #         self.startup()
    #         ArmController._startup_done_global = True

    def gripper(self, closed):
        import time
        from adafruit_servokit import ServoKit
        kit = ServoKit(channels=16)
        kit.servo[5].set_pulse_width_range(900, 1500)
        kit.servo[5].actuation_range = 180
        if closed == 1:
            kit.servo[5].angle=180
        else:
            kit.servo[5].angle=0

    def startup(self):
        '''
        Safely moves from resting position to 'straight up' position
        '''
        self.current_servo_angles_deg = [89.99999999999994, 140.94184064661795, 25.460424777616538, 115.48141497451923, 180, 90.0] # resting position
        self.send_angles_to_servos([0,0,0,0,0,0]) # straight-up position

    # def get_current_position(self)
        


    def send_angles_to_servos(self, joint_angles_deg):
        """
        Placeholder: replace with your real PWM / servo code.
        joint_angles_deg: list of 6 servo angles in degrees
                          [base, shoulder, elbow, wrist, wrist_roll, gripper]
        """
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
        

        print("joint angles are: ",commanded_angles)
        def rectangular(starts, targets, total_time, steps):
            wait_time = total_time / steps
            for s in range(1, steps + 1):
                for ch in range(5):
                    start = starts[ch]
                    target = targets[ch]
                    step_size = (target - start) / steps
                    kit.servo[ch].angle = start + step_size * s
                time.sleep(wait_time)

        starts = self.current_servo_angles_deg[:] 
        targets = commanded_angles  
        print("starts are: ", starts)

        # dynamically change speed based on degrees
        wait_time = 0
        for ch in range(5):
            start = starts[ch]
            target = targets[ch]
            difference = abs(target-start) # degrees
            # 30 deg/s
            t = difference/30 # seconds to take for motion
            if t > wait_time:
                wait_time = t
            else:
                t = 0


        print("Moving to Position")
        rectangular(starts, targets, total_time=wait_time, steps = max(1,int(wait_time*50)))
        print("Position Reached")
        self.current_servo_angles_deg = targets

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
