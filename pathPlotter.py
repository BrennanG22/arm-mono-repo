# import matplotlib.pyplot as plt
# import numpy as np
# import math
# from matplotlib.patches import Circle
#
#
# class PathPlotter:
#     def __init__(self):
#         self.fig = plt.figure(figsize=(16, 6))
#         self.initialized = False
#         self.artists = {}  # Store references to plot elements
#
#     def initialize_plot(self, cartesian_points=[], r_constraint=None):
#         """Initialize the plot with empty artists"""
#         # Create subplots
#         self.ax1 = self.fig.add_subplot(131, projection='3d')
#         self.ax2 = self.fig.add_subplot(132)
#         self.ax3 = self.fig.add_subplot(133)
#
#         # Initialize empty artists for trajectory
#         self.artists['traj_3d'], = self.ax1.plot([], [], [], 'bo-', linewidth=3, markersize=8, label='Trajectory')
#         self.artists['start_3d'], = self.ax1.plot([], [], [], 'go', markersize=10, label='Start')
#         self.artists['end_3d'], = self.ax1.plot([], [], [], 'ro', markersize=10, label='End')
#
#         self.artists['radius_line'], = self.ax2.plot([], [], 'bo-', linewidth=2, markersize=6, label='Radius')
#
#         self.artists['traj_xy'], = self.ax3.plot([], [], 'bo-', linewidth=2, markersize=6, label='Trajectory')
#         self.artists['start_xy'], = self.ax3.plot([], [], 'go', markersize=8, label='Start')
#         self.artists['end_xy'], = self.ax3.plot([], [], 'ro', markersize=8, label='End')
#
#         # Store constraint artists
#         self.constraint_artists = []
#
#         # Set up constraints if provided
#         if r_constraint:
#             self.setup_constraints(r_constraint)
#
#         # Set up labels and titles
#         self.setup_labels()
#
#         self.initialized = True
#
#     def setup_constraints(self, r_constraint):
#         """Set up constraint visualizations"""
#         min_r, max_r = r_constraint
#
#         # 3D constraints
#         u = np.linspace(0, 2 * np.pi, 30)
#         v = np.linspace(0, np.pi, 30)
#
#         # Outer constraint sphere
#         x_outer = max_r * np.outer(np.cos(u), np.sin(v))
#         y_outer = max_r * np.outer(np.sin(u), np.sin(v))
#         z_outer = max_r * np.outer(np.ones(np.size(u)), np.cos(v))
#         outer_sphere = self.ax1.plot_wireframe(x_outer, y_outer, z_outer, color='red', alpha=0.2, label=f'r ≤ {max_r}')
#         self.constraint_artists.append(outer_sphere)
#
#         # Inner constraint sphere (if > 0)
#         if min_r > 0:
#             x_inner = min_r * np.outer(np.cos(u), np.sin(v))
#             y_inner = min_r * np.outer(np.sin(u), np.sin(v))
#             z_inner = min_r * np.outer(np.ones(np.size(u)), np.cos(v))
#             inner_sphere = self.ax1.plot_wireframe(x_inner, y_inner, z_inner, color='blue', alpha=0.2,
#                                                    label=f'r ≥ {min_r}')
#             self.constraint_artists.append(inner_sphere)
#
#         # Radius plot constraints
#         max_r_line = self.ax2.axhline(y=max_r, color='red', linestyle='--', linewidth=2, label=f'Max r = {max_r}')
#         self.constraint_artists.append(max_r_line)
#
#         if min_r > 0:
#             min_r_line = self.ax2.axhline(y=min_r, color='blue', linestyle='--', linewidth=2, label=f'Min r = {min_r}')
#             self.constraint_artists.append(min_r_line)
#
#         # XY plot constraints
#         circle_outer = Circle((0, 0), max_r, fill=False, color='red', linestyle='--', linewidth=2, label=f'r ≤ {max_r}')
#         self.ax3.add_patch(circle_outer)
#         self.constraint_artists.append(circle_outer)
#
#         if min_r > 0:
#             circle_inner = Circle((0, 0), min_r, fill=False, color='blue', linestyle='--', linewidth=2,
#                                   label=f'r ≥ {min_r}')
#             self.ax3.add_patch(circle_inner)
#             self.constraint_artists.append(circle_inner)
#
#     def setup_labels(self):
#         """Set up labels and titles"""
#         self.ax1.set_xlabel('X')
#         self.ax1.set_ylabel('Y')
#         self.ax1.set_zlabel('Z')
#         self.ax1.set_title('3D Trajectory with Constraints')
#         self.ax1.legend()
#
#         self.ax2.set_xlabel('Point Index')
#         self.ax2.set_ylabel('Radius')
#         self.ax2.set_title('Radius Progression')
#         self.ax2.grid(True, alpha=0.3)
#         self.ax2.legend()
#
#         self.ax3.grid(True, alpha=0.3)
#         self.ax3.set_xlabel('X')
#         self.ax3.set_ylabel('Y')
#         self.ax3.set_title('XY Projection with Constraints')
#         self.ax3.axis('equal')
#         self.ax3.legend()
#
#     def update_plot(self, cartesian_points):
#         """Update the plot with new path data"""
#         if not self.initialized:
#             raise RuntimeError("Plot not initialized. Call initialize_plot first.")
#
#         # Extract coordinates
#         x_coords = [point[0] for point in cartesian_points]
#         y_coords = [point[1] for point in cartesian_points]
#         z_coords = [point[2] for point in cartesian_points]
#
#         num_points = len(x_coords)
#         start_point = [x_coords[0], y_coords[0], z_coords[0]]
#         end_point = [x_coords[num_points - 1], y_coords[num_points - 1], z_coords[num_points - 1]]
#
#         # Update 3D trajectory
#         self.artists['traj_3d'].set_data(x_coords, y_coords)
#         self.artists['traj_3d'].set_3d_properties(z_coords)
#
#         self.artists['start_3d'].set_data([start_point[0]], [start_point[1]])
#         self.artists['start_3d'].set_3d_properties([start_point[2]])
#
#         self.artists['end_3d'].set_data([end_point[0]], [end_point[1]])
#         self.artists['end_3d'].set_3d_properties([end_point[2]])
#
#         # Update radius progression
#         distances = [math.sqrt(point[0] ** 2 + point[1] ** 2 + point[2] ** 2) for point in cartesian_points]
#         point_indices = range(len(distances))
#         self.artists['radius_line'].set_data(point_indices, distances)
#
#         # Update XY projection
#         self.artists['traj_xy'].set_data(x_coords, y_coords)
#         self.artists['start_xy'].set_data([start_point[0]], [start_point[1]])
#         self.artists['end_xy'].set_data([end_point[0]], [end_point[1]])
#
#         # Update axis limits
#         self.update_limits(x_coords, y_coords, z_coords, distances)
#
#         # Redraw
#         self.fig.canvas.draw()
#         plt.pause(0.001)
#
#     def update_limits(self, x_coords, y_coords, z_coords, distances):
#         """Update axis limits based on new data"""
#         # 3D plot limits - FIXED from -5 to 5 in each direction
#         self.ax1.set_xlim(-5, 5)
#         self.ax1.set_ylim(-5, 5)
#         self.ax1.set_zlim(-5, 5)
#
#         # Radius plot limits
#         self.ax2.set_xlim(0, len(distances) - 1)
#         self.ax2.set_ylim(0, max(distances) * 1.1)
#
#         # XY plot limits
#         margin = 0.1
#         x_range = max(x_coords) - min(x_coords)
#         y_range = max(y_coords) - min(y_coords)
#         self.ax3.set_xlim(min(x_coords) - margin * x_range, max(x_coords) + margin * x_range)
#         self.ax3.set_ylim(min(y_coords) - margin * y_range, max(y_coords) + margin * y_range)
#
#     def plot_3d_trajectory_with_constraints(self, cartesian_points, r_constraint=None):
#         """Plot 3D trajectory showing constraints - main entry point"""
#         if not self.initialized:
#             self.initialize_plot(cartesian_points, r_constraint)
#
#         self.update_plot(cartesian_points)
#         plt.tight_layout()
#         plt.show(block=False)