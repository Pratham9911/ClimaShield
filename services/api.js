import Constants from "expo-constants";

const { extra } = Constants.expoConfig;

export async function fetchPredictions(lat, lon) {
  try {
    // let latnum =  27.440619972189516
    // let lonnum =   88.33632268030632
     
    // let latnum = 27.440619972189516
    // let lonnum =    88.33632268030632
     
   

  // let latnum = 28.55340612823695
  // let lonnum = 77.25864103605423
   
    // let latnum = 27.68469281729501
    // let lonnum = 88.32887965994799
    const response = await fetch(`${extra.API_BASE_URL}/predict_7days`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat , lon  }),
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
