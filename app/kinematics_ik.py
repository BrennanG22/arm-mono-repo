# ikpy_testing.py

from ikpy.chain import Chain
from ikpy.link import OriginLink, URDFLink
import numpy as np


"""
Geometric model of a simple 4-DOF ROT3U arm using ikpy.

All distances are in meters.
"""

# Link lengths (convert your cm measurements → m)
BASE_HEIGHT   = 11.4/100   # base to shoulder joint along Z
UPPER_ARM_LEN = 10.5/100   # shoulder to elbow along Z
FOREARM_LEN   = 9.8/100   # elbow to wrist along Z
WRIST_OFFSET = 2.8/100 #horizontal offset from forearm to wrist
WRIST_LEN     = 16/100   # wrist to tool tip along Z


# Build the kinematic chain
ROT3U_chain = Chain(
    name="ROT3U_arm",
    links=[
        # World / base frame
        OriginLink(),

        # # 1) Base joint: rotates about Z at the robot base
        # URDFLink(
        #     name="base",
        #     origin_translation=[0.0, 0.0, BASE_HEIGHT],
        #     origin_orientation=[0.0, 0.0, -np.pi/2], # 90 degrees = positive x, 0 degrees = negative y, 180 degrees = positive y
        #     rotation=[0.0, 0.0, 1.0],          # yaw
        #     bounds=(0, np.pi),
        # ),

        # # 2) Shoulder joint: pivot at top of base
        # URDFLink(
        #     name="shoulder",
        #     origin_translation=[0.0, 0.0, 0.0],
        #     origin_orientation=[0.0, -np.pi/2, 0.0], # 90 degrees = positive z, 180 degrees = positive x, 0 degrees = negative x (assuming base = 90 degrees)
        #     rotation=[0.0, 1.0, 0.0],          # pitch
        #     bounds=(0, np.pi),
        # ),

        # # 3) Elbow joint: UPPER_ARM_LEN above shoulder
        # URDFLink(
        #     name="elbow",
        #     origin_translation=[0.0, 0.0, UPPER_ARM_LEN],
        #     origin_orientation=[0.0, -np.pi/2, 0.0], # 90 degrees = positive z, 180 degrees = positive x, 0 degrees = negative x
        #     rotation=[0.0, 1.0, 0.0],
        #     bounds=(0, np.pi),
        # ),

        # # 4) Wrist joint: FOREARM_LEN above elbow
        # URDFLink(
        #     name="wrist",
        #     origin_translation=[0.0, 0.0, FOREARM_LEN],
        #     origin_orientation=[0.0, -np.pi/2, 0.0],
        #     rotation=[0.0, 1.0, 0.0],
        #     bounds=(0, np.pi),
        # ),

        # # 5) Fixed tool link: WRIST_LEN above wrist
        # URDFLink(
        #     name="tool",
        #     origin_translation=[0.0, 0.0, WRIST_LEN],
        #     origin_orientation=[0.0, 0.0, 0.0],
        #     rotation=None,
        #     joint_type="fixed",
        # ),

        # 1) Base joint: rotates about Z at the robot base
        URDFLink(
            name="base",
            origin_translation=[0.0, 0.0, BASE_HEIGHT],
            origin_orientation=[0.0, 0.0, 0], # 90 degrees = positive x, 0 degrees = negative y, 180 degrees = positive y
            rotation=[0.0, 0.0, 1.0],          # yaw
            bounds=(-np.pi/2, np.pi/2),
        ),

        # 2) Shoulder joint: pivot at top of base
        URDFLink(
            name="shoulder",
            origin_translation=[0.0, 0.0, 0.0],
            origin_orientation=[0.0, 0, 0.0], # 90 degrees = positive z, 180 degrees = positive x, 0 degrees = negative x (assuming base = 90 degrees)
            rotation=[0.0, 1.0, 0.0],          # pitch
            bounds=(-np.pi/2, np.pi/2),
        ),

        # 3) Elbow joint: UPPER_ARM_LEN above shoulder
        URDFLink(
            name="elbow",
            origin_translation=[0.0, 0.0, UPPER_ARM_LEN],
            origin_orientation=[0.0, 0, 0.0], # 90 degrees = positive z, 180 degrees = positive x, 0 degrees = negative x
            rotation=[0.0, 1.0, 0.0],
            bounds=(-np.pi/2, np.pi/2),
        ),

        # 4) Wrist joint: FOREARM_LEN above elbow
        URDFLink(
            name="wrist",
            origin_translation=[0.0, 0.0, FOREARM_LEN],
            origin_orientation=[0.0, 0, 0.0],
            rotation=[0.0, 1.0, 0.0],
            bounds=(-np.pi/2, np.pi/2),
        ),

        # 5) Fixed tool link: WRIST_LEN above wrist
        URDFLink(
            name="tool",
            origin_translation=[-WRIST_OFFSET, 0.0, WRIST_LEN],
            origin_orientation=[0.0, 0.0, 0.0],
            rotation=None,
            joint_type="fixed",
        ),
    ],
    active_links_mask= [
        False,
        True,
        True,
        True,
        True,
        False  
    ]
)

# # remove this if it is causing issues - just here to suppress warning message
# ROT3U_chain.active_links_mask = [
#     False,
#     True,
#     True,
#     True,
#     True,
#     False
# ]

def compute_errors(chain, joints, target_position,
                   target_orientation=None, orientation_mode=None):
    """
    Returns (pos_error, ori_error) for a given joint vector.

    pos_error: Euclidean distance between FK position and target_position.
    ori_error: angular difference (radians) between chosen EE axis and
               target_orientation. None if orientation not requested.
    """
    fk = chain.forward_kinematics(joints)
    ee_pos = fk[:3, 3]
    #print("ee_pos is", ee_pos)

    # Position error
    pos_error = np.linalg.norm(ee_pos - np.asarray(target_position, dtype=float))

    ori_error = None
    if target_orientation is not None and orientation_mode is not None:
        R = fk[:3, :3]
        target_orientation = np.asarray(target_orientation, dtype=float)
        target_orientation /= np.linalg.norm(target_orientation)

        if orientation_mode == "X":
            ee_axis = R[:, 0]
        elif orientation_mode == "Y":
            ee_axis = R[:, 1]
        elif orientation_mode == "Z":
            ee_axis = R[:, 2]
        else:
            ee_axis = R[:, 2]

        ee_axis /= np.linalg.norm(ee_axis)

        dot = float(np.clip(np.dot(ee_axis, target_orientation), -1.0, 1.0))
        angle = np.arccos(dot)   # radians
        ori_error = angle

    return pos_error, ori_error


def ik_with_orientation_fallback(
    chain,
    target_position,
    target_orientation=None,
    orientation_mode=None,
    pos_tol=1e-2,
    ori_tol=np.deg2rad(20),
    initial_position=None,
    **kwargs
):
    """
    Try IK with both position and orientation first.
    If that can't meet tolerances, fall back to position-only.
    If even that fails, return "fail-both".

    Returns (solution, info_dict), where info_dict["mode"] is one of:
      - "position+orientation"
      - "position-only"
      - "fail-both"
    """
    target_position = np.asarray(target_position, dtype=float)

    use_orientation = (target_orientation is not None and orientation_mode is not None)

    # 1) Try position + orientation
    if use_orientation:
        sol_with_ori = chain.inverse_kinematics(
            target_position=target_position,
            target_orientation=target_orientation,
            orientation_mode=orientation_mode,
            #initial_position=initial_position,
            **kwargs
        )

        pos_err_with_ori, ori_err_with_ori = compute_errors(
            chain,
            sol_with_ori,
            target_position=target_position,
            target_orientation=target_orientation,
            orientation_mode=orientation_mode,
        )

        if (
            pos_err_with_ori <= pos_tol
            and ori_err_with_ori is not None
            and ori_err_with_ori <= ori_tol
        ):
            return sol_with_ori, {
                "mode": "position+orientation",
                "pos_err": pos_err_with_ori,
                "ori_err": ori_err_with_ori,
            }

    # 2) Fallback: position-only IK
    sol_pos_only = chain.inverse_kinematics(
        target_position=target_position,
        target_orientation=None,
        orientation_mode=None,
        #initial_position=initial_position,
        **kwargs
    )

    # Recompute errors for THIS solution
    pos_err_pos_only, ori_err_pos_only = compute_errors(
        chain,
        sol_pos_only,
        target_position=target_position,
        target_orientation=(target_orientation if use_orientation else None),
        orientation_mode=(orientation_mode if use_orientation else None),
    )

    if pos_err_pos_only <= pos_tol:
        return sol_pos_only, {
            "mode": "position-only",
            "pos_err": pos_err_pos_only,
            "ori_err": ori_err_pos_only,
        }

    # 3) Fail-both
    return sol_pos_only, {
        "mode": "fail-both",
        "pos_err": pos_err_pos_only,
        "ori_err": ori_err_pos_only,
    }


# Optional: local test if you run this file directly
if __name__ == "__main__":
    import matplotlib.pyplot as plt
    from mpl_toolkits.mplot3d import Axes3D  # noqa: F401

    target = [0.1, 0.1, 0.187]
    target_dir = [0, 0, 1]

    sol, info = ik_with_orientation_fallback(
        ROT3U_chain,
        target_position=target,
        target_orientation=target_dir,
        orientation_mode="X",
        initial_position=[0.0] * len(ROT3U_chain.links),
    )
    print ("sol is", sol)

    print("Mode:", info["mode"])
    print("Position error:", info["pos_err"])
    print("Orientation error:", info["ori_err"])
    print("Joint angles (deg):", [np.degrees(a) for a in sol])

    real_frame = ROT3U_chain.forward_kinematics(sol)
    print("FK position:", real_frame[:3, 3], "target:", target)
 
    # sol = (0, 123.69, 137.57, 76.81, 145.62, 0)
    # sol = [np.radians(x) for x in sol]
    fig = plt.figure()
    ax = fig.add_subplot(111, projection="3d")

    # sol = (0, 0, 90, 0, 0, 0)
    # sol = [np.radians(x) for x in sol]
    # Plot the arm solution
    ROT3U_chain.plot(sol, ax)

    # --- Consistent workspace bounds ---
    ax.set_xlim(-0.25, 0.25)     # X range (meters)
    ax.set_ylim(-0.25, 0.25)     # Y range (meters)
    ax.set_zlim(0.0, 0.5)        # Z range (meters)

    # Optional: make axes equal scale
    ax.set_box_aspect([0.5, 0.5, 0.5])   # (x_range, y_range, z_range)

    # Labels (optional)
    ax.set_xlabel("X (m)")
    ax.set_ylabel("Y (m)")
    ax.set_zlabel("Z (m)")

    plt.show()


# -0.13, -0.125, 0