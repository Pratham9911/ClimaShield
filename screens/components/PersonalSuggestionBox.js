import React, { useEffect, useState, useRef, useMemo } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const { extra } = Constants.expoConfig;

export default function PersonalSuggestionBox({
  userData,
  predictedDiseases,
  topDisaster,
}) {
  const [suggestion, setSuggestion] = useState("");
  const [loadingLLM, setLoadingLLM] = useState(false);

  const stableData = useMemo(
    () =>
      JSON.stringify({
        name: userData?.name,
        age: userData?.age,
        diseases: userData?.diseases,
        top: topDisaster?.today,
        diseasePred: predictedDiseases,
      }),
    [userData, topDisaster, predictedDiseases]
  );

  useEffect(() => {
    if (userData && topDisaster) loadOrFetchSuggestion();
  }, [stableData]);

  const loadOrFetchSuggestion = async () => {
    try {
      const cachedData = await AsyncStorage.getItem("clima_suggest_data");
      const cachedSuggestion = await AsyncStorage.getItem("clima_suggestion");

      if (cachedData === stableData && cachedSuggestion) {
        setSuggestion(cachedSuggestion);
        return; // No LLM call
      }

      await getSuggestions();
    } catch (err) {
      console.log("Cache check error:", err);
    }
  };

  const getSuggestions = async () => {
    try {
      setLoadingLLM(true);

      const disaster_text = topDisaster
        ? `${topDisaster.name.replace(/_/g, " ")}: ${topDisaster.today.toFixed(1)}%`
        : "No risk";

      const predicted_text =
        predictedDiseases && Object.keys(predictedDiseases).length > 0
          ? Object.entries(predictedDiseases)
              .map(([n, v]) => `${n.replace(/_/g, " ")} level ${v}`)
              .join(", ")
          : "no Disease risks";

      const disease_text =
        userData.diseases?.length
          ? userData.diseases.map((d) => d.replace(/_/g, " ")).join(", ")
          : "no existing diseases";

      const prompt = `
User: ${userData.name}, age ${userData.age}
Disaster Risk Today: ${disaster_text}
Existing diseases: ${disease_text}
Predicted disease risks: ${predicted_text}

Give a short personalized impact and advice be like a bro or doctor to motivate user really need you.
- if user  have any existing diseases then guide else do not tell him anything on diseases to panic user.
- max 20 words per line , 3 lines max.
- You can mention user information like age if relevant like old .
- first line tell about if user has to worry today or not only if high ,  if he is fit then relax.
- next line tell about the impact on his existing diseases in one line if none then basic advice.

- No headings, no bullet points, no bold words.
`;

      const payload = {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "Provide short helpful safety guidance." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 160,
      };

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${extra.GROQ_API_KEY1}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      const result =
        data?.choices?.[0]?.message?.content ||
        "Unable to generate suggestions.";

      setSuggestion(result);

      // store new suggestion + hash
      await AsyncStorage.setItem("clima_suggest_data", stableData);
      await AsyncStorage.setItem("clima_suggestion", result);
    } catch (err) {
      console.log("Suggestion Error:", err);
      setSuggestion("Unable to fetch advisory currently.");
    } finally {
      setLoadingLLM(false);
    }
  };

  return (
    <View style={styles.box}>
      {loadingLLM ? (
        <ActivityIndicator size="small" color="#4B0082" />
      ) : (
        <Text style={styles.text}>{suggestion}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "#fff",
    padding: 4,
    borderRadius: 4,
  },
  text: {
    fontSize: 17,
    lineHeight: 24,
    color: "#111",
  },
});
