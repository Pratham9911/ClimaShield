export async function fetchPredictions(lat, lon) {
  try {
    const response = await fetch("http://192.168.0.105:8000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat, lon }),
    });

    if (!response.ok) {
      throw new Error(```Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log("fetchPredictions error:", error);
    return null;
  }
}
