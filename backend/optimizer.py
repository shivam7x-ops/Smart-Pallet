import math
from typing import List, Dict, Any

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two lat/lon points."""
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def solve_vrp_route(depot: Dict[str, float], stops: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Nearest-neighbor TSP/VRP solver for delivery routes.
    """
    if not stops:
        return {"ordered_stops": [], "total_distance_km": 0.0, "estimated_time_mins": 0}

    unvisited = stops.copy()
    current_pos = depot
    ordered = []
    total_dist = 0.0

    while unvisited:
        nearest_idx = 0
        min_dist = haversine_distance(current_pos["lat"], current_pos["lng"],
                                       unvisited[0]["lat"], unvisited[0]["lng"])

        for i in range(1, len(unvisited)):
            dist = haversine_distance(current_pos["lat"], current_pos["lng"],
                                      unvisited[i]["lat"], unvisited[i]["lng"])
            if dist < min_dist:
                min_dist = dist
                nearest_idx = i

        next_stop = unvisited.pop(nearest_idx)
        total_dist += min_dist
        ordered.append(next_stop)
        current_pos = {"lat": next_stop["lat"], "lng": next_stop["lng"]}

    # Return to depot
    return_dist = haversine_distance(current_pos["lat"], current_pos["lng"], depot["lat"], depot["lng"])
    total_dist += return_dist

    # Assuming average city speed of 40 km/h + 10 mins per stop
    avg_speed_kmh = 40.0
    travel_time_hours = total_dist / avg_speed_kmh
    est_time_mins = int(travel_time_hours * 60 + len(stops) * 10)

    return {
        "depot": depot,
        "ordered_stops": ordered,
        "total_distance_km": round(total_dist, 2),
        "estimated_time_mins": est_time_mins
    }

