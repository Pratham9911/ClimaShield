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
    # NEXT 7 DAYS - with rolling averages (Option B)
    # -------------------------------------------------------------------

    fw_daily = future_weather.get("daily", {}) if future_weather else {}
    fa_hourly = future_air.get("hourly", {}) if future_air else {}

    future_times = fw_daily.get("time", [])

    # Build future weather sequences
    fw_tmax = fw_daily.get("temperature_2m_max", []) or []
    fw_tmin = fw_daily.get("temperature_2m_min", []) or []
    fw_prec = fw_daily.get("precipitation_sum", []) or []
    fw_hmax = fw_daily.get("relative_humidity_2m_max", []) or []
    fw_hmin = fw_daily.get("relative_humidity_2m_min", []) or []
    fw_wind = fw_daily.get("windspeed_10m_max", []) or []

    fut_temp = [(mx + mn) / 2 for mx, mn in zip(fw_tmax, fw_tmin)]
    fut_hum = [(mx + mn) / 2 for mx, mn in zip(fw_hmax, fw_hmin)]
    fut_wind = fw_wind

    # ---------------------------
    # Convert hourly AQ → daily
    # ---------------------------
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

        for idx, t in enumerate(times_h):
            day = t.split("T")[0]
            daily_aq.setdefault(day, {"pm10": [], "pm25": [], "co": [], "o3": [],
                                      "no2": [], "so2": [], "aqi": []})

            sources = [
                ("pm10", pm10_h),
                ("pm25", pm25_h),
                ("co", co_h),
                ("o3", o3_h),
                ("no2", no2_h),
                ("so2", so2_h),
                ("aqi", aqi_h)
            ]

            for field, arr in sources:
                if idx < len(arr) and arr[idx] is not None:
                    daily_aq[day][field].append(arr[idx])

        for day, vals in daily_aq.items():
            for k in vals:
                clean = [v for v in vals[k] if v is not None]
                vals[k] = float(statistics.mean(clean)) if clean else None

    # -------------------------------------------------------------------
    # Build rolling chains (past 7 + today + future)
    # -------------------------------------------------------------------
    past_temps = temps[-7:] if temps else []
    past_hums = hums[-7:] if hums else []
    past_winds = winds[-7:] if winds else []
    past_rain = rains[-7:] if rains else []

    today_temp = result["temp"]
    today_hum = result["humidity"]
    today_wind = result["wind_speed"]
    today_rain = result["rainfall_24h"]

    chain_temp = past_temps + [today_temp] + fut_temp
    chain_hum = past_hums + [today_hum] + fut_hum
    chain_wind = past_winds + [today_wind] + fut_wind
    chain_rain = past_rain + [today_rain] + fw_prec

    IDX_TODAY = len(past_temps)

    # AQ fallback lists
    aq_keys = ["pm25", "pm10", "co", "o3", "no2", "so2", "aqi"]
    aq_sequence = [daily_aq.get(d) for d in future_times]

    next_days = []

    for i, day in enumerate(future_times):

        # Prevent out of range (rare Open-Meteo bug)
        if i >= len(fut_temp) or i >= len(fut_hum) or i >= len(fut_wind) or i >= len(fw_prec):
            continue

        chain_index = IDX_TODAY + 1 + i

        # Rolling average helpers (Option B = avg of last 3 available)
        def last3(seq):
            w = seq[max(0, chain_index - 2): chain_index + 1]
            clean = [x for x in w if x is not None]
            return statistics.mean(clean) if clean else None

        def last7(seq):
            w = seq[max(0, chain_index - 6): chain_index + 1]
            clean = [x for x in w if x is not None]
            return statistics.mean(clean) if clean else None

        temp_3 = last3(chain_temp)
        temp_7 = last7(chain_temp)

        hum_3 = last3(chain_hum)
        hum_7 = last7(chain_hum)

        wind_3 = last3(chain_wind)
        wind_7 = last7(chain_wind)

        rain_3 = last3(chain_rain)
        rain_7 = last7(chain_rain)

        # -------------------------------------------------------------------
        # AIR QUALITY FIX
        # -------------------------------------------------------------------
        day_aq = daily_aq.get(day)
        aq_vals = {}

        if day_aq:
    # Real forecast available → use it (no None)
         for k in aq_keys:
          v = day_aq.get(k)
          aq_vals[k] = v if v is not None else (result.get(k) or 0)

        else:
    # -------------------------------------------------------
    # POLLUTANT-WISE FALLBACK (independent for each pollutant)
    # -------------------------------------------------------
    
    # Helper: get last 3 available values of pollutant k
          def last3_pollutant(k):
            vals = []

        # Look backward from previous forecast days
            for j in range(i - 1, i - 4, -1):
             if j >= 0 and aq_sequence[j]:
                v = aq_sequence[j].get(k)
                if v is not None:
                    vals.append(v)

            return vals

    # Build values pollutant-by-pollutant
          for k in aq_keys:
           vals = last3_pollutant(k)

           if vals:
            # Average last available values
            aq_vals[k] = statistics.mean(vals)
           else:
            # No previous forecast → use today's pollutant (no None)
            fallback = result.get(k)
            aq_vals[k] = fallback if fallback is not None else 0

       # Remove unnatural ozone drops (>50% drop from previous day)
        if i > 0:
          prev_o3 = next_days[-1]["o3"]
          curr_o3 = aq_vals["o3"]

          if prev_o3 is not None and curr_o3 is not None:
           if curr_o3 < prev_o3 * 0.8:
            aq_vals["o3"] = prev_o3 - prev_o3*0.05

        try:
            day_name = datetime.fromisoformat(day).strftime("%a")
        except:
            day_name = ""

        day_env = {
            "date": day,
            "day": day_name,
            "latitude": lat,
            "longitude": lon,
            "place_name": result["place_name"],

            "temp": fut_temp[i],
            "humidity": fut_hum[i],
            "rainfall_24h": fw_prec[i],
            "pressure": result["pressure"],
            "wind_speed": fut_wind[i],
            "wind_gusts": result["wind_gusts"],

            "pm25": aq_vals["pm25"],
            "pm10": aq_vals["pm10"],
            "co": aq_vals["co"],
            "o3": aq_vals["o3"],
            "no2": aq_vals["no2"],
            "so2": aq_vals["so2"],
            "aqi": aq_vals["aqi"],

            "elevation": result["elevation"],
            "population_density": result["population_density"],
            "road_density": result["road_density"],

            "temp_3d_avg": round(temp_3, 2) if temp_3 is not None else None,
            "temp_7d_avg": round(temp_7, 2) if temp_7 is not None else None,

            "rainfall_3d_avg": round(rain_3, 2) if rain_3 is not None else None,
            "rainfall_7d_avg": round(rain_7, 2) if rain_7 is not None else None,

            "humidity_3d_avg": round(hum_3, 2) if hum_3 is not None else None,
            "humidity_7d_avg": round(hum_7, 2) if hum_7 is not None else None,

            "wind_3d_avg": round(wind_3, 2) if wind_3 is not None else None,
            "wind_7d_avg": round(wind_7, 2) if wind_7 is not None else None,
        }

        next_days.append(day_env)

    result["next_7_days"] = next_days
    return result
