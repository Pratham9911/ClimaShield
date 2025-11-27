import Constants from "expo-constants";

const { extra } = Constants.expoConfig;

export async function fetchPredictions(lat, lon) {
  try {
    // let latnum =  27.440619972189516
    // let lonnum =   88.33632268030632
     
    // let latnum = 26.904550903374453 khadra
    // let lonnum =    80.90129773126951 48 to 35
    const response = await fetch(`${extra.API_BASE_URL}/predict_7days`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat , lon}),
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
