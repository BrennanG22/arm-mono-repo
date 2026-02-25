def log_point(point, precision=3):
    """Format a 3D point for logging with consistent precision."""
    return f"[{point[0]:.{precision}f}, {point[1]:.{precision}f}, {point[2]:.{precision}f}]"