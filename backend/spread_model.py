import math
from typing import List, Dict, Any

class FireSpreadModel:
    """
    Rothermel-inspired Fire Spread Physics Model.
    Calculates rate of spread (km/h) based on wind, slope, and fuel factors,
    and returns elliptical GeoJSON polygon perimeters across specified time horizons.
    """
    def __init__(self, base_rate_kmh: float = 0.15):
        self.base_rate_kmh = base_rate_kmh

    def simulate(
        self,
        ignition_lat: float = 37.7749,
        ignition_lon: float = -122.4194,
        wind_speed_kmh: float = 25.0,
        wind_dir_deg: float = 45.0,
        slope_deg: float = 15.0,
        fuel_factor: float = 1.2,
        hours: List[float] = [0.5, 1.0, 3.0, 6.0]
    ) -> Dict[str, Any]:
        # Formula: rate = base * (1 + (wind/20)^1.5) * (1 + (slope/20)^1.2) * fuel
        wind_term = 1.0 + ((max(0.0, wind_speed_kmh) / 20.0) ** 1.5)
        slope_term = 1.0 + ((max(0.0, slope_deg) / 20.0) ** 1.2)
        spread_rate_kmh = round(self.base_rate_kmh * wind_term * slope_term * max(0.1, fuel_factor), 3)

        # Length-to-width ratio for elliptical expansion
        lwr = max(1.0, 1.0 + 0.22 * (wind_speed_kmh * 0.621371))
        eccentricity = math.sqrt(max(0.0, 1.0 - (1.0 / (lwr ** 2))))
        backing_rate_kmh = spread_rate_kmh * (1.0 - eccentricity) / (1.0 + eccentricity)
        flank_rate_kmh = (spread_rate_kmh + backing_rate_kmh) / (2.0 * lwr)

        # Math vector angle (0 = East, 90 = North)
        math_angle_rad = math.radians((450.0 - wind_dir_deg) % 360.0)

        color_map = {
            0.5: "#00d9a5", # Teal
            1.0: "#ffb703", # Amber
            3.0: "#ff6b35", # Orange
            6.0: "#ff2d55", # Red
        }

        polygons = []

        for h in hours:
            dist_forward_km = spread_rate_kmh * h
            dist_backing_km = backing_rate_kmh * h
            dist_flank_km = flank_rate_kmh * h

            major_axis_km = dist_forward_km + dist_backing_km
            center_offset_km = (dist_forward_km - dist_backing_km) / 2.0
            a_km = major_axis_km / 2.0  # semi-major axis
            b_km = dist_flank_km       # semi-minor axis

            center_x_km = center_offset_km * math.cos(math_angle_rad)
            center_y_km = center_offset_km * math.sin(math_angle_rad)

            ring = []
            num_pts = 36
            for i in range(num_pts + 1):
                theta = (2.0 * math.pi * i) / num_pts
                ex = a_km * math.cos(theta)
                ey = b_km * math.sin(theta)

                rx = ex * math.cos(math_angle_rad) - ey * math.sin(math_angle_rad)
                ry = ex * math.sin(math_angle_rad) + ey * math.cos(math_angle_rad)

                tx_km = center_x_km + rx
                ty_km = center_y_km + ry

                # Convert km offsets to latitude and longitude
                delta_lat = ty_km / 111.32
                delta_lon = tx_km / (111.32 * math.cos(math.radians(ignition_lat)))

                p_lat = round(ignition_lat + delta_lat, 6)
                p_lon = round(ignition_lon + delta_lon, 6)
                ring.append([p_lat, p_lon])

            area_km2 = round(math.pi * a_km * b_km, 3)
            radius_km = round(dist_forward_km, 3)

            polygons.append({
                "hours": h,
                "label": f"T + {h} Hours",
                "color": color_map.get(h, "#ff6b35"),
                "area_km2": area_km2,
                "radius_km": radius_km,
                "spread_rate_kmh": spread_rate_kmh,
                "coordinates": ring
            })

        return {
            "ignition": {"lat": ignition_lat, "lon": ignition_lon},
            "parameters": {
                "wind_speed_kmh": wind_speed_kmh,
                "wind_dir_deg": wind_dir_deg,
                "slope_deg": slope_deg,
                "fuel_factor": fuel_factor
            },
            "spread_rate_kmh": spread_rate_kmh,
            "max_radius_km": polygons[-1]["radius_km"],
            "max_area_km2": polygons[-1]["area_km2"],
            "polygons": polygons
        }

spread_model = FireSpreadModel()
