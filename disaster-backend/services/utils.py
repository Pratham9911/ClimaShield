def fix_missing(data_dict):
    defaults = {
        "temp": 25, "temp_3d_avg": 25, "temp_7d_avg": 25,
        "humidity": 50, "humidity_3d_avg": 50, "humidity_7d_avg": 50,
        "rainfall_24h": 0, "rainfall_3d_avg": 0, "rainfall_7d_avg": 0,
        "pressure": 1012,
        "wind_speed": 0, "wind_gusts": 0, "wind_3d_avg": 0, "wind_7d_avg": 0,
        "pm25": 10, "pm10": 20, "co": 200, "o3": 40, "no2": 5, "so2": 5, "aqi": 50,
        "elevation": 300,
        "population_density": 100, "road_density": 5
    }

    fixed = {}
    for key in defaults:
        val = data_dict.get(key, None)
        if val == "Not available" or val is None:
            fixed[key] = defaults[key]
        else:
            fixed[key] = val

    return fixed

