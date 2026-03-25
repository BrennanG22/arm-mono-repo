import numpy as np
import math


def cartesian_to_spherical(x: float, y: float, z: float) -> [float, float, float]:
    r = math.sqrt(x ** 2 + y ** 2 + z ** 2)
    theta = math.atan2(y, x)
    if theta < 0:
        theta += 2 * math.pi
    if r == 0:
        phi = 0
    else:
        phi = math.acos(z / r)
    return r, theta, phi


def spherical_to_cartesian(r: float, theta: float, phi: float) -> [float, float, float]:
    x = r * math.sin(phi) * math.cos(theta)
    y = r * math.sin(phi) * math.sin(theta)
    z = r * math.cos(phi)
    return x, y, z


def generate_spherical_points(start_r, start_theta, start_phi,
                              end_r, end_theta, end_phi, num_points=10,
                              r_constraint=None, theta_constraint=None, phi_constraint=None):
    r_points = np.linspace(start_r, end_r, num_points + 2)
    theta_points = np.linspace(start_theta, end_theta, num_points + 2)
    phi_points = np.linspace(start_phi, end_phi, num_points + 2)

    if r_constraint:
        min_r, max_r = r_constraint
        r_points = np.clip(r_points, min_r, max_r)

    if theta_constraint:
        min_theta, max_theta = theta_constraint
        theta_points = np.clip(theta_points, min_theta, max_theta)

    if phi_constraint:
        min_phi, max_phi = phi_constraint
        phi_points = np.clip(phi_points, min_phi, max_phi)

    return r_points, theta_points, phi_points


def process_3d_trajectory(start_point: [float, float, float], end_point: [float, float, float],
                          num_points: float = 10, r_constraint=None, theta_constraint=None, phi_constraint=None):
    start_r, start_theta, start_phi = cartesian_to_spherical(*start_point)
    end_r, end_theta, end_phi = cartesian_to_spherical(*end_point)

    r_points, theta_points, phi_points = generate_spherical_points(
        start_r, start_theta, start_phi, end_r, end_theta, end_phi, num_points,
        r_constraint, theta_constraint, phi_constraint
    )

    cartesian_points = []
    for r, theta, phi in zip(r_points, theta_points, phi_points):
        x, y, z = spherical_to_cartesian(r, theta, phi)
        cartesian_points.append((x, y, z))

    return cartesian_points, r_points, theta_points, phi_points
