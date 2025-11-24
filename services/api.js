import Constants from "expo-constants";

const { extra } = Constants.expoConfig;

export async function fetchPredictions(lat, lon) {
  try {
    const response = await fetch(`${extra.API_BASE_URL}/predict_7days`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat, lon }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log("fetchPredictions error:", error);
    return null;
  }
}
