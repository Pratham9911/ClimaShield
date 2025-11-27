def fix_missing(day_env, today_env=None):
    """
    Smart fallback ONLY for actual missing values (None or "Not available").
    Does NOT override valid future estimates.
    """

    defaults = {
        "temp": 25, "temp_3d_avg": 25, "temp_7d_avg": 25,
        "humidity": 50, "humidity_3d_avg": 50, "humidity_7d_avg": 50,
        "rainfall_24h": 0, "rainfall_3d_avg": 0, "rainfall_7d_avg": 0,
        "pressure": 1012,
        "wind_speed": 1, "wind_gusts": 1, "wind_3d_avg": 1, "wind_7d_avg": 1,
        "pm25": 10, "pm10": 20, "co": 200, "o3": 40, "no2": 5, "so2": 5, "aqi": 50,
        "elevation": 300,
        "population_density": 100, "road_density": 5
    }

    fixed = {}

    for key in defaults.keys():
        v = day_env.get(key)

        # REAL forecast / calculated fallback → KEEP IT
        if v is not None and v != "Not available":
            fixed[key] = v
            continue

        # use today only when value is None
        if today_env:
            tv = today_env.get(key)
            if tv is not None and tv != "Not available":
                fixed[key] = tv
                continue

        fixed[key] = defaults[key]

    return fixed
