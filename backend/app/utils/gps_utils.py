import math


FARM_RADIUS_KM = 5.0  # Max distance between proof GPS and farm GPS


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance (km) between two GPS coordinates.
    Uses the Haversine formula.
    """
    R = 6371  # Earth's radius in kilometers
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def is_within_farm_radius(
    proof_lat: float,
    proof_lon: float,
    farm_lat: float,
    farm_lon: float,
    radius_km: float = FARM_RADIUS_KM,
) -> bool:
    """Check if proof GPS coordinates are within allowed radius of farm location."""
    distance = calculate_distance(proof_lat, proof_lon, farm_lat, farm_lon)
    return distance <= radius_km
