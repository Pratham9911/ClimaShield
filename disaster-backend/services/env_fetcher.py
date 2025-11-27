import aiohttp
import asyncio
import os
import rasterio
import statistics
from functools import lru_cache
from datetime import datetime


async def fetch_json(session, url, params=None, timeout=8):
    try:
        async with session.get(url, params=params, timeout=timeout) as resp:
            return await resp.json()
    except:
        return {}


@lru_cache(maxsize=2000)
def load_population_raster():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    raster_path = os.path.join(BASE_DIR, "../ind_pd_2020_1km.tif")
    return rasterio.open(raster_path)


# -------------------------------------------------------------------
# Reverse geocoding
# -------------------------------------------------------------------
async def full_reverse_geocode(session, lat, lon):
    async def fetch(url, params=None):
        try:
            async with session.get(url, params=params, timeout=7) as r:
                return await r.json()
        except:
            return {}

    # Nominatim
    nom = await fetch(
        "https://nominatim.openstreetmap.org/reverse",
        {"lat": lat, "lon": lon, "format": "json", "zoom": 14, "addressdetails": 1},
    )

    if "address" in nom:
        addr = nom["address"]
        place = (
            addr.get("suburb")
            or addr.get("neighbourhood")
            or addr.get("hamlet")
            or addr.get("village")
            or addr.get("town")
            or addr.get("city")
            or addr.get("county")
            or addr.get("state")
            or addr.get("region")
        )
        if place:
            return place

    # Photon
    pho = await fetch("https://photon.komoot.io/reverse", {"lat": lat, "lon": lon})
    feats = pho.get("features", [])
    if feats:
        props = feats[0].get("properties", {})
        place = (
            props.get("city")
            or props.get("name")
            or props.get("district")
            or props.get("county")
            or props.get("state")
        )
        if place:
            return place

    # Open-Meteo fallback
    om = await fetch(
        "https://geocoding-api.open-meteo.com/v1/reverse",
        {"latitude": lat, "longitude": lon, "count": 1},
    )
    r = om.get("results", [])
    if r:
        return r[0].get("name") or r[0].get("admin1")

    return "Not available"


# -------------------------------------------------------------------
# Main environment fetcher
# -------------------------------------------------------------------
async def fetch_environment_data(lat, lon):
    result = {
        "latitude": lat,
        "longitude": lon,
        "place_name": "Not available",
        "temp": None,
        "humidity": None,
        "rainfall_24h": None,
        "pressure": None,
        "wind_speed": None,
        "wind_gusts": None,
        "pm25": None,
        "pm10": None,
        "co": None,
        "o3": None,
        "no2": None,
        "so2": None,
        "aqi": None,
        "elevation": None,
        "temp_3d_avg": None,
        "temp_7d_avg": None,
        "rainfall_3d_avg": None,
        "rainfall_7d_avg": None,
        "humidity_3d_avg": None,
        "humidity_7d_avg": None,
        "wind_3d_avg": None,
        "wind_7d_avg": None,
        "population_density": None,
        "road_density": None,
        "next_7_days": [],
    }

    async with aiohttp.ClientSession() as session:

        weather_task = fetch_json(
            session,
            "https://api.open-meteo.com/v1/forecast",
            {
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,precipitation,pressure_msl,wind_speed_10m,wind_gusts_10m",
                "timezone": "auto",
            },
        )

        air_task = fetch_json(
            session,
            "https://air-quality-api.open-meteo.com/v1/air-quality",
            {
                "latitude": lat,
                "longitude": lon,
                "current": "pm10,pm2_5,carbon_monoxide,ozone,nitrogen_dioxide,sulphur_dioxide,us_aqi",
                "timezone": "auto",
            },
        )

        past_task = fetch_json(
            session,
            "https://api.open-meteo.com/v1/forecast",
            {
                "latitude": lat,
                "longitude": lon,
                "past_days": 7,
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_max,relative_humidity_2m_min,windspeed_10m_max",
                "timezone": "auto",
            },
        )

        geocode_task = fetch_json(
            session,
            "https://geocoding-api.open-meteo.com/v1/reverse",
            {"latitude": lat, "longitude": lon, "count": 1},
        )

        elevation_task = fetch_json(
            session,
            "https://api.open-elevation.com/api/v1/lookup",
            {"locations": f"{lat},{lon}"},
        )

        future_weather_task = fetch_json(
            session,
            "https://api.open-meteo.com/v1/forecast",
            {
                "latitude": lat,
                "longitude": lon,
                "daily":
                    "temperature_2m_max,temperature_2m_min,precipitation_sum,"
                    "relative_humidity_2m_max,relative_humidity_2m_min,"
                    "windspeed_10m_max",
                "forecast_days": 7,
                "timezone": "auto",
            },
        )

        future_air_task = fetch_json(
            session,
            "https://air-quality-api.open-meteo.com/v1/air-quality",
            {
                "latitude": lat,
                "longitude": lon,
                "hourly": "pm10,pm2_5,carbon_monoxide,ozone,nitrogen_dioxide,sulphur_dioxide,us_aqi",
                "forecast_days": 7,
                "timezone": "auto",
            },
        )

        (
            weather, air, past, geocode, elevation,
            future_weather, future_air
        ) = await asyncio.gather(
            weather_task, air_task, past_task,
            geocode_task, elevation_task,
            future_weather_task, future_air_task,
        )

        # ------------------------------
        # Current weather
        # ------------------------------
        w = weather.get("current", {})
        result["temp"] = w.get("temperature_2m")
        result["humidity"] = w.get("relative_humidity_2m")
        result["rainfall_24h"] = w.get("precipitation")
        result["pressure"] = w.get("pressure_msl")
        result["wind_speed"] = w.get("wind_speed_10m")
        result["wind_gusts"] = w.get("wind_gusts_10m")

        # ------------------------------
        # Current air quality
        # ------------------------------
        a = air.get("current", {})
        for k in ["pm2_5", "pm10", "carbon_monoxide", "ozone", "nitrogen_dioxide", "sulphur_dioxide", "us_aqi"]:
            result_key = {
                "pm2_5": "pm25",
                "pm10": "pm10",
                "carbon_monoxide": "co",
                "ozone": "o3",
                "nitrogen_dioxide": "no2",
                "sulphur_dioxide": "so2",
                "us_aqi": "aqi",
            }[k]
            result[result_key] = a.get(k)

        # ------------------------------
        # Past 7 days averages
        # ------------------------------
        d = past.get("daily", {})
        temps = [(mx + mn) / 2 for mx, mn in
                 zip(d.get("temperature_2m_max", []),
                     d.get("temperature_2m_min", []))]

        hums = [(mx + mn) / 2 for mx, mn in
                zip(d.get("relative_humidity_2m_max", []),
                    d.get("relative_humidity_2m_min", []))]

        winds = d.get("windspeed_10m_max", [])
        rains = d.get("precipitation_sum", [])

        if temps:
            result["temp_7d_avg"] = round(statistics.mean(temps), 2)
            result["temp_3d_avg"] = round(statistics.mean(temps[-3:]), 2)

        if rains:
            result["rainfall_7d_avg"] = round(statistics.mean(rains), 2)
            result["rainfall_3d_avg"] = round(statistics.mean(rains[-3:]), 2)

        if hums:
            result["humidity_7d_avg"] = round(statistics.mean(hums), 2)
            result["humidity_3d_avg"] = round(statistics.mean(hums[-3:]), 2)

        if winds:
            result["wind_7d_avg"] = round(statistics.mean(winds), 2)
            result["wind_3d_avg"] = round(statistics.mean(winds[-3:]), 2)

        result["place_name"] = await full_reverse_geocode(session, lat, lon)

        if elevation.get("results"):
            result["elevation"] = elevation["results"][0].get("elevation")

    # ------------------------------
    # Population density (raster)
    # ------------------------------
    try:
        raster = load_population_raster()
        for val in raster.sample([(lon, lat)]):
            result["population_density"] = float(val[0])
    except:
        result["population_density"] = 0.0

    result["road_density"] = round(5 + (result["population_density"] / 1000.0), 3)

# -------------------------------------------------------------------
# NEXT 7 DAYS - COSINE STABILIZED MODEL (FINAL)
# -------------------------------------------------------------------

    import math
    
    fw_daily = future_weather.get("daily", {}) if future_weather else {}
    fa_hourly = future_air.get("hourly", {}) if future_air else {}
    
    future_times = fw_daily.get("time", [])
    
    fw_tmax = fw_daily.get("temperature_2m_max", []) or []
    fw_tmin = fw_daily.get("temperature_2m_min", []) or []
    fw_prec = fw_daily.get("precipitation_sum", []) or []
    fw_hmax = fw_daily.get("relative_humidity_2m_max", []) or []
    fw_hmin = fw_daily.get("relative_humidity_2m_min", []) or []
    fw_wind = fw_daily.get("windspeed_10m_max", []) or []
    
    # Mid values
    fut_temp = [(mx + mn) / 2 for mx, mn in zip(fw_tmax, fw_tmin)]
    fut_hum = [(mx + mn) / 2 for mx, mn in zip(fw_hmax, fw_hmin)]
    fut_wind = fw_wind
    
    # Daily AQ conversion
    daily_aq = {}
    if fa_hourly.get("time"):
        times_h = fa_hourly.get("time", [])
        pm10_h = fa_hourly.get("pm10", [])
        pm25_h = fa_hourly.get("pm2_5", [])
        co_h = fa_hourly.get("carbon_monoxide", [])
        o3_h = fa_hourly.get("ozone", [])
        no2_h = fa_hourly.get("nitrogen_dioxide", [])
        so2_h = fa_hourly.get("sulphur_dioxide", [])
        aqi_h = fa_hourly.get("us_aqi", [])
    
        pollutants = [
            ("pm10", pm10_h), ("pm25", pm25_h), ("co", co_h),
            ("o3", o3_h), ("no2", no2_h), ("so2", so2_h), ("aqi", aqi_h)
        ]
    
        for idx, t in enumerate(times_h):
            day = t.split("T")[0]
            daily_aq.setdefault(day, {k: [] for k, _ in pollutants})
            for k, arr in pollutants:
                if idx < len(arr) and arr[idx] is not None:
                    daily_aq[day][k].append(arr[idx])
    
        for day, vals in daily_aq.items():
            for k in vals:
                clean = [v for v in vals[k] if v is not None]
                vals[k] = float(statistics.mean(clean)) if clean else None
    
    aq_keys = ["pm25", "pm10", "co", "o3", "no2", "so2", "aqi"]
    
    today_temp = result["temp"]
    today_hum = result["humidity"]
    today_wind = result["wind_speed"]
    today_rain = result["rainfall_24h"]
    today_aq = {k: result.get(k) or 0 for k in aq_keys}
    
    # Cosine + clamp ±3%, no duplicates (except natural zeros)
    def stabilize(val, today, prev, day_index):
        # if no meaningful baseline, just return current value
        if today is None or abs(today) < 1e-6:
            return round(val if val is not None else 0.0, 2)
    
        base = val if val is not None else today
    
        # follow previous day a bit for smooth slope
        if prev is not None:
            base = 0.6 * base + 0.4 * prev
    
        # cosine wave over the horizon (smooth oscillation)
        # using length of future_times so curve spreads over full 7 days
        span = max(len(future_times) - 1, 1)
        wave = math.cos(day_index * math.pi / span)  # from +1 to -1 smoothly
        base += today * 0.01 * wave  # ±1% cosine modulation
    
        # clamp to ±3% band around today
        lower = today * 0.97
        upper = today * 1.03
        base = max(min(base, upper), lower)
    
        # avoid duplicates: if too close to previous, nudge a tiny bit
        if prev is not None and abs(base - prev) < abs(today) * 0.002:
            adjust = today * 0.003 * (1 if (day_index % 2 == 0) else -1)
            base += adjust
            base = max(min(base, upper), lower)
    
        return round(base, 2)
    
    next_days = []
    
    for i, day in enumerate(future_times):
        try:
            day_name = datetime.fromisoformat(day).strftime("%a")
        except:
            day_name = ""
    
        prev_env = next_days[-1] if next_days else None
    
        # -------- AQ --------
        real_aq = daily_aq.get(day)
        aq_vals = {}
        for k in aq_keys:
            raw_v = real_aq.get(k) if real_aq and real_aq.get(k) is not None else today_aq[k]
            prev_v = prev_env[k] if prev_env and k in prev_env else None
            aq_vals[k] = stabilize(raw_v, today_aq[k], prev_v, i)
    
        # -------- WEATHER --------
        raw_temp = fut_temp[i] if i < len(fut_temp) else today_temp
        raw_hum = fut_hum[i] if i < len(fut_hum) else today_hum
        raw_wind = fut_wind[i] if i < len(fut_wind) else today_wind
        raw_rain = fw_prec[i] if i < len(fw_prec) else today_rain
    
        temp_val = stabilize(raw_temp, today_temp, prev_env["temp"] if prev_env else None, i)
        hum_val = stabilize(raw_hum, today_hum, prev_env["humidity"] if prev_env else None, i)
        wind_val = stabilize(raw_wind, today_wind, prev_env["wind_speed"] if prev_env else None, i)
        rain_val = stabilize(raw_rain, today_rain, prev_env["rainfall_24h"] if prev_env else None, i)
    
        day_env = {
            "date": day,
            "day": day_name,
            "latitude": lat,
            "longitude": lon,
            "place_name": result["place_name"],
            "temp": temp_val,
            "humidity": hum_val,
            "rainfall_24h": rain_val,
            "pressure": result["pressure"],
            "wind_speed": wind_val,
            "wind_gusts": result["wind_gusts"],
            **aq_vals,
            "elevation": result["elevation"],
            "population_density": result["population_density"],
            "road_density": result["road_density"],
        }
    
        next_days.append(day_env)
    
    result["next_7_days"] = next_days
    return result
    