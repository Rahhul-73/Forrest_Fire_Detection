import math
import random
from typing import Dict, Any, List

class RiskZoneGenerator:
    def __init__(self, center_lat: float = 37.7749, center_lon: float = -122.4194, grid_size: int = 6, spacing_km: float = 2.0):
        self.center_lat = center_lat
        self.center_lon = center_lon
        self.grid_size = grid_size
        self.spacing_km = spacing_km

    def generate(self, center_lat: float = None, center_lon: float = None) -> Dict[str, Any]:
        c_lat = center_lat if center_lat is not None else self.center_lat
        c_lon = center_lon if center_lon is not None else self.center_lon

        zones: List[Dict[str, Any]] = []
        half = self.grid_size / 2.0

        for row in range(self.grid_size):
            for col in range(self.grid_size):
                offset_x_km = (col - half + 0.5) * self.spacing_km
                offset_y_km = (row - half + 0.5) * self.spacing_km

                d_lat = offset_y_km / 111.32
                d_lon = offset_x_km / (111.32 * math.cos(math.radians(c_lat)))

                cell_lat = round(c_lat + d_lat, 6)
                cell_lon = round(c_lon + d_lon, 6)

                dist_km = math.sqrt(offset_x_km**2 + offset_y_km**2)
                base_risk = max(15.0, 95.0 - (dist_km * 12.0))
                risk_score = round(min(98.0, max(5.0, base_risk + random.uniform(-10.0, 10.0))), 1)

                if risk_score > 75.0:
                    level = "extreme"
                    color = "#ff2d55"
                elif risk_score > 55.0:
                    level = "high"
                    color = "#ff6b35"
                elif risk_score > 35.0:
                    level = "moderate"
                    color = "#ffb703"
                else:
                    level = "low"
                    color = "#00d9a5"

                zones.append({
                    "id": f"cell-{row}-{col}",
                    "lat": cell_lat,
                    "lon": cell_lon,
                    "risk": risk_score,
                    "level": level,
                    "color": color,
                    "size_km": self.spacing_km
                })

        return {
            "center": {"lat": c_lat, "lon": c_lon},
            "grid_size": self.grid_size,
            "spacing_km": self.spacing_km,
            "zones": zones
        }

risk_generator = RiskZoneGenerator()
