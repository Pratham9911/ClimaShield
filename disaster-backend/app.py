from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from services.env_fetcher import fetch_environment_data
from services.prediction import predict_all
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
        "disease_predictions": disease_preds["disease_predictions"]
    }

@app.post("/predict")
async def predict(request: Location):
    env = await fetch_environment_data(request.lat, request.lon)
    full = run_full_analysis(env)

    return {
        "environment": env,
        "disaster_predictions": full["disaster_predictions"],
        "disease_predictions": full["disease_predictions"]
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
        "disease_predictions": full["disease_predictions"]
    }
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
