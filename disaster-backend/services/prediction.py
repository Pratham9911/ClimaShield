# services/prediction.py

import joblib
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
from .utils import fix_missing
from datetime import datetime
# ---------------------------------------------------------
# HRI formula
# ---------------------------------------------------------
def calculate_hri(preds):
    if not preds:
        return 0

    # Top 3 sorted values
    values = sorted(preds.values(), reverse=True)
    p1 = values[0] if len(values) > 0 else 0
    p2 = values[1] if len(values) > 1 else 0
    p3 = values[2] if len(values) > 2 else 0

    # NON-LINEAR influence (natural increasing pressure)
    h1 = (p1 ** 1.32) / (100 ** 0.32)   # strongest effect
    h2 = (p2 ** 1.18) / (100 ** 0.18)
    h3 = (p3 ** 1.10) / (100 ** 0.10)

    # Weighted combination
    HRI = (0.6 * h1) + (0.25 * h2) + (0.15 * h3)

    # Minimum real-world baseline: one severe hazard must reflect strongly
    baseline = p1 * 0.90
    HRI = max(HRI, baseline)

    # Clamp
    HRI = min(100, max(0, HRI))

    return round(HRI, 2)



# ---------------------------------------------------------
# FEATURES
# ---------------------------------------------------------
FEATURES = {
    "Heatwave": [
        "temp", "temp_3d_avg", "temp_7d_avg",
        "humidity", "humidity_3d_avg", "humidity_7d_avg",
        "rainfall_24h", "rainfall_3d_avg", "rainfall_7d_avg",
        "pressure",
        "wind_speed", "wind_3d_avg", "wind_7d_avg"
    ],
    "Flood": [
        "temp", "humidity", "rainfall_24h", "pressure",
        "wind_speed", "wind_gusts",
        "rainfall_3d_avg", "rainfall_7d_avg",
        "humidity_3d_avg", "humidity_7d_avg"
    ],
    "ColdWave": [
        "temp", "temp_3d_avg", "temp_7d_avg",
        "humidity", "humidity_3d_avg", "humidity_7d_avg",
        "rainfall_24h", "rainfall_3d_avg", "rainfall_7d_avg",
        "pressure",
        "wind_speed", "wind_gusts",
        "wind_3d_avg", "wind_7d_avg",
        "elevation"
    ],
    "Storm": [
        "temp", "temp_3d_avg", "temp_7d_avg",
        "humidity", "humidity_3d_avg", "humidity_7d_avg",
        "rainfall_24h", "rainfall_3d_avg", "rainfall_7d_avg",
        "pressure",
        "wind_speed", "wind_gusts",
        "wind_3d_avg", "wind_7d_avg",
        "elevation"
    ],
    "Fog": [
        "temp", "temp_3d_avg", "temp_7d_avg",
        "humidity", "humidity_3d_avg", "humidity_7d_avg",
        "rainfall_24h", "rainfall_3d_avg", "rainfall_7d_avg",
        "pressure",
        "wind_speed", "wind_gusts",
        "wind_3d_avg", "wind_7d_avg"
    ],
    "Drought": [
        "temp", "temp_3d_avg", "temp_7d_avg",
        "humidity", "humidity_3d_avg", "humidity_7d_avg",
        "rainfall_24h", "rainfall_3d_avg", "rainfall_7d_avg",
        "pressure",
        "wind_speed", "wind_3d_avg", "wind_7d_avg",
        "elevation"
    ],
    "AirPollution": [
        "pm25", "pm10", "co", "o3", "no2", "so2",
        "aqi",
        "temp", "humidity", "rainfall_24h", "pressure",
        "wind_speed", "wind_gusts", "wind_3d_avg", "wind_7d_avg",
        "elevation",
        "population_density", "road_density"
    ]
}

# ---------------------------------------------------------
# MODEL FILES
# ---------------------------------------------------------
MODEL_FOLDER = "NN_Models/"
SCALER_FOLDER = "NN_X_Scaler/"

MODELS = {
    "Heatwave":   (MODEL_FOLDER + "HeatwaveNN.h5",     SCALER_FOLDER + "heatwave_scaler_X.pkl"),
    "Flood":      (MODEL_FOLDER + "FloodNN.h5",        SCALER_FOLDER + "flood_scaler_X.pkl"),
    "ColdWave":   (MODEL_FOLDER + "ColdWaveNN.h5",     SCALER_FOLDER + "coldwave_scaler_X.pkl"),
    "Storm":      (MODEL_FOLDER + "StormNN.h5",        SCALER_FOLDER + "storm_scaler_X.pkl"),
    "Fog":        (MODEL_FOLDER + "FogNN.h5",          SCALER_FOLDER + "fog_scaler_X.pkl"),
    "Drought":    (MODEL_FOLDER + "DroughtNN.h5",      SCALER_FOLDER + "drought_scaler_X.pkl"),
    "AirPollution": (MODEL_FOLDER + "AirPollutionNN.h5", SCALER_FOLDER + "air_pollution_scaler_X.pkl"),
}

# ---------------------------------------------------------
# Caches to avoid reloading models every request
# ---------------------------------------------------------
_MODEL_CACHE = {}
_SCALER_CACHE = {}

def _get_model_and_scaler(name):
    if name not in _MODEL_CACHE:
        model_file, scaler_file = MODELS[name]
        _MODEL_CACHE[name] = load_model(model_file, compile=False)
        _SCALER_CACHE[name] = joblib.load(scaler_file)
    return _MODEL_CACHE[name], _SCALER_CACHE[name]


# ---------------------------------------------------------
# SINGLE-DAY PREDICTION
# ---------------------------------------------------------
def predict_all(env_data):
    env_data = fix_missing(env_data)
    results = {}

    for name in MODELS.keys():
        feature_list = FEATURES[name]

        model, scaler = _get_model_and_scaler(name)

        x = [env_data[f] for f in feature_list]
        df = pd.DataFrame([x], columns=feature_list)
        X_scaled = scaler.transform(df)

        pred = float(model.predict(X_scaled)[0][0])

        # If (and only if) your Flood model outputs 0–1,
        # uncomment below to convert to 0–100:
        if name == "Flood":
            pred *= 100.0

        # Always keep in 0–100
        pred = max(0.0, min(100.0, pred))

        results[name] = pred

    return results


# ---------------------------------------------------------
# NEXT 7 DAYS PREDICTIONS
# ---------------------------------------------------------
def predict_next_7_days(env_list, today_preds=None):
    output = []

    for idx, day_env in enumerate(env_list):

        # Only fix missing on TODAY (index 0)
        if idx == 0:
            fixed = fix_missing(day_env, env_list[0])
        else:
            fixed = day_env  # KEEP FUTURE ESTIMATED VALUES

        if idx == 0 and today_preds is not None:
            preds = today_preds
        else:
            preds = predict_all(fixed)

        hri = calculate_hri(preds)

        date_value = day_env.get("date")
        day_label = day_env.get("day")

        if date_value is None:
            date_value = datetime.now().date().isoformat()

        if not day_label:
            try:
                day_label = datetime.fromisoformat(date_value).strftime("%a")
            except:
                day_label = ""

        output.append({
            "date": date_value,
            "day": day_label,
            "disasters": preds,
            "HRI": hri
        })

    return output
