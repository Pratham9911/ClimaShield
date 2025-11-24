# app.py

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime

from services.env_fetcher import fetch_environment_data
from services.prediction import predict_all, predict_next_7_days
from services.disease_analysis import analyze_diseases

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Location(BaseModel):
    lat: float
    lon: float


@app.get("/")
def home():
    return {"status": "API running"}


# -----------------------------------
# Central combined analysis function
# -----------------------------------
def run_full_analysis(env):
    disaster_preds = predict_all(env)
    disease_preds = analyze_diseases(disaster_preds)

    return {
        "disaster_predictions": disaster_preds,
        "disease_predictions": disease_preds["disease_predictions"],
    }


@app.post("/predict")
async def predict(request: Location):
    env = await fetch_environment_data(request.lat, request.lon)
    full = run_full_analysis(env)

    return {
        "environment": env,
        "disaster_predictions": full["disaster_predictions"],
        "disease_predictions": full["disease_predictions"],
    }


class CustomEnv(BaseModel):
    data: dict


@app.post("/predict_custom")
def predict_custom(req: CustomEnv):
    env = req.data
    full = run_full_analysis(env)
    return {
        "environment": env,
        "disaster_predictions": full["disaster_predictions"],
        "disease_predictions": full["disease_predictions"],
    }


# -----------------------------------
# NEW: Predict next 7 days
# -----------------------------------
@app.post("/predict_7days")
async def predict_7days(request: Location):
    # 1) Fetch full environment (today + next_7_days env)
    env = await fetch_environment_data(request.lat, request.lon)

    # 2) Today's full analysis
    full_today = run_full_analysis(env)

    # 3) Next days disaster+HRI
    next_env_list = env.get("next_7_days", [])
    if next_env_list:
    # Make a safe shallow copy without next_7_days
     today_env_clean = {k: v for k, v in env.items() if k != "next_7_days"}
     next_env_list[0] = today_env_clean

    next_days = predict_next_7_days(next_env_list, today_preds=full_today["disaster_predictions"])



    # Add day-of-week label ("Mon", "Tue", ...)
    for d in next_days:
        date_str = d.get("date")
        try:
            d["day"] = datetime.fromisoformat(date_str).strftime("%a")
        except Exception:
            d["day"] = ""

    # 4) Final response (simple & consistent)
    return {
        "today": {
            "environment": env,
            "disaster_predictions": full_today["disaster_predictions"],
            "disease_predictions": full_today["disease_predictions"],
        },
        "next7days": next_days,
    }


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
