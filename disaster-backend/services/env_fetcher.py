# services/env_fetcher.py

import aiohttp
import asyncio
import os
import rasterio
import statistics
from functools import lru_cache

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

# paste ALL your fetch-related functions here:
async def full_reverse_geocode(session, lat, lon):
    """Full accuracy: Nominatim + Photon + Open-Meteo"""

    async def fetch(url, params=None):
        try:
            async with session.get(url, params=params, timeout=7) as r:
                return await r.json()
        except:
            return {}

    # Nominatim
    nom = await fetch(
        "https://nominatim.openstreetmap.org/reverse",
        {"lat": lat, "lon": lon, "format": "json", "zoom": 14, "addressdetails": 1}
    )

    if "address" in nom:
        addr = nom["address"]
        place = (
            addr.get("suburb") or addr.get("neighbourhood") or addr.get("hamlet") or
            addr.get("village") or addr.get("town") or addr.get("city") or
            addr.get("county") or addr.get("state") or addr.get("region")
        )
        if place: return place

    # Photon
    pho = await fetch("https://photon.komoot.io/reverse", {"lat": lat, "lon": lon})
    feats = pho.get("features", [])
    if feats:
        props = feats[0].get("properties", {})
        place = (
            props.get("city") or props.get("name") or props.get("district") or
            props.get("county") or props.get("state")
        )
        if place: return place

    # Open-Meteo (fastest fallback)
    om = await fetch(
        "https://geocoding-api.open-meteo.com/v1/reverse",
        {"latitude": lat, "longitude": lon, "count": 1}
    )
    r = om.get("results", [])
    if r:
        return r[0].get("name") or r[0].get("admin1")

    return "Not available"

async def real_road_density(lat, lon):
    """Uses OSMnx (slow but accurate)"""
   
    try:
        G = ox.graph_from_point((lat, lon), dist=5000, network_type='drive')
        edges = ox.graph_to_gdfs(G, nodes=False, edges=True)
        total_km = edges['length'].sum() / 1000
        area_km2 = np.pi * (5 ** 2)  # radius = 5 km
        return round(total_km / area_km2, 4)
    except:
        return None


async def fetch_environment_data(lat, lon):
    """Async, optimized, fast environment data fetcher."""

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
        "road_density": None
    }

    async with aiohttp.ClientSession() as session:

        # ===========================================
        # 🔥 Parallel API calls (asyncio.gather)
        # ===========================================
        weather_task = fetch_json(session,
            "https://api.open-meteo.com/v1/forecast",
            {
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,precipitation,pressure_msl,wind_speed_10m,wind_gusts_10m",
                "timezone": "auto"
            }
        )

        air_task = fetch_json(session,
            "https://air-quality-api.open-meteo.com/v1/air-quality",
            {
                "latitude": lat,
                "longitude": lon,
                "current": "pm10,pm2_5,carbon_monoxide,ozone,nitrogen_dioxide,sulphur_dioxide,us_aqi",
                "timezone": "auto"
            }
        )

        past_task = fetch_json(session,
            "https://api.open-meteo.com/v1/forecast",
            {
                "latitude": lat,
                "longitude": lon,
                "past_days": 7,
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_max,relative_humidity_2m_min,windspeed_10m_max",
                "timezone": "auto"
            }
        )

        geocode_task = fetch_json(session,
            "https://geocoding-api.open-meteo.com/v1/reverse",
            {"latitude": lat, "longitude": lon, "count": 1}
        )

        elevation_task = fetch_json(session,
            "https://api.open-elevation.com/api/v1/lookup",
            {"locations": f"{lat},{lon}"}
        )

        weather, air, past, geocode, elevation = await asyncio.gather(
            weather_task, air_task, past_task, geocode_task, elevation_task
        )

        # ===========================================
        # 🌤️ Current weather
        # ===========================================
        w = weather.get("current", {})
        result.update({
            "temp": w.get("temperature_2m"),
            "humidity": w.get("relative_humidity_2m"),
            "rainfall_24h": w.get("precipitation"),
            "pressure": w.get("pressure_msl"),
            "wind_speed": w.get("wind_speed_10m"),
            "wind_gusts": w.get("wind_gusts_10m"),
        })

        # ===========================================
        # 🌫️ Air quality
        # ===========================================
        a = air.get("current", {})
        result.update({
            "pm25": a.get("pm2_5"),
            "pm10": a.get("pm10"),
            "co": a.get("carbon_monoxide"),
            "o3": a.get("ozone"),
            "no2": a.get("nitrogen_dioxide"),
            "so2": a.get("sulphur_dioxide"),
            "aqi": a.get("us_aqi"),
        })

        # ===========================================
        # 📅 Past averages
        # ===========================================
        d = past.get("daily", {})
        temps = [(mx + mn) / 2 for mx, mn in zip(
            d.get("temperature_2m_max", []),
            d.get("temperature_2m_min", [])
        )]

        if temps:
            result["temp_7d_avg"] = round(statistics.mean(temps), 2)
            result["temp_3d_avg"] = round(statistics.mean(temps[-3:]), 2)

        if d.get("precipitation_sum"):
            r = d["precipitation_sum"]
            result["rainfall_7d_avg"] = round(statistics.mean(r), 2)
            result["rainfall_3d_avg"] = round(statistics.mean(r[-3:]), 2)

        hums = [(mx + mn)/2 for mx, mn in zip(
            d.get("relative_humidity_2m_max", []),
            d.get("relative_humidity_2m_min", [])
        )]

        if hums:
            result["humidity_7d_avg"] = round(statistics.mean(hums), 2)
            result["humidity_3d_avg"] = round(statistics.mean(hums[-3:]), 2)

        winds = d.get("windspeed_10m_max", [])
        if winds:
            result["wind_7d_avg"] = round(statistics.mean(winds), 2)
            result["wind_3d_avg"] = round(statistics.mean(winds[-3:]), 2)

   
        result["place_name"] = await full_reverse_geocode(session, lat, lon)

        # ===========================================
        # 🗺 Elevation
        # ===========================================
        if elevation.get("results"):
            result["elevation"] = elevation["results"][0].get("elevation")

    # ===========================================
    # 👥 Population density (offline-fast)
    # ===========================================
    try:
        raster = load_population_raster()
        for val in raster.sample([(lon, lat)]):
            result["population_density"] = float(val[0])
    except:
        result["population_density"] = 0

    
# 🚗 ROAD DENSITY (FAST or FULL)
# ===============================
    # if USE_FAST_MODE:
    pdens = result["population_density"] or 0
    result["road_density"] = round(5 + (pdens / 1000), 3)
    # else:
    #  result["road_density"] = await real_road_density(lat, lon)


    return result

