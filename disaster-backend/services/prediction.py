# services/prediction.py

import joblib
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
from .utils import fix_missing

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

def predict_all(env_data):
    env_data = fix_missing(env_data)

    MODEL_FOLDER = "NN_Models/"
    SCALER_FOLDER = "NN_X_Scaler/"

    MODELS = {
    "Heatwave": (MODEL_FOLDER + "HeatwaveNN.h5", SCALER_FOLDER + "heatwave_scaler_X.pkl"),
    "Flood": (MODEL_FOLDER + "FloodNN.h5", SCALER_FOLDER + "flood_scaler_X.pkl"),
    "ColdWave": (MODEL_FOLDER + "ColdWaveNN.h5", SCALER_FOLDER + "coldwave_scaler_X.pkl"),
    "Storm": (MODEL_FOLDER + "StormNN.h5", SCALER_FOLDER + "storm_scaler_X.pkl"),
    "Fog": (MODEL_FOLDER + "FogNN.h5", SCALER_FOLDER + "fog_scaler_X.pkl"),
    "Drought": (MODEL_FOLDER + "DroughtNN.h5", SCALER_FOLDER + "drought_scaler_X.pkl"),
    "AirPollution": (MODEL_FOLDER + "AirPollutionNN.h5", SCALER_FOLDER + "air_pollution_scaler_X.pkl")
}


    results = {}

    for name, (model_file, scaler_file) in MODELS.items():
        feature_list = FEATURES[name]

        # Load model + scaler
        model = load_model(model_file, compile=False)
        scaler = joblib.load(scaler_file)

        # Prepare input
        x = [env_data[f] for f in feature_list]
        df = pd.DataFrame([x], columns=feature_list)

        # Scale input
        X_scaled = scaler.transform(df)

        # Predict
        pred = float(model.predict(X_scaled)[0][0])
        if name == "Flood":
          pred = pred * 100
        # Clip to 0–100
        pred = max(0, min(100, pred))

        print(f"🔥 {name} Prediction: {pred:.2f}%")

        results[name] = pred

    return results

