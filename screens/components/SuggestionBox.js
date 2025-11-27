// components/SuggestionBox.js
import React, { useEffect, useState, useRef, useMemo } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import Constants from "expo-constants";

const { extra } = Constants.expoConfig;

export default function SuggestionBox({ topDisasters, diseases }) {
    const [suggestion, setSuggestion] = useState("");
    const [loading, setLoading] = useState(false);

    // ---- Create stable comparison strings ----
    const stableTop = useMemo(() => JSON.stringify(topDisasters), [topDisasters]);
    const stableDisease = useMemo(() => JSON.stringify(diseases), [diseases]);

    const lastTopRef = useRef(null);
    const lastDiseaseRef = useRef(null);

    const getSuggestionsFromLLM = async () => {
        try {
            // ---- Avoid Duplicate API Calls ----
            if (
                lastTopRef.current === stableTop &&
                lastDiseaseRef.current === stableDisease
            ) {
                console.log("⚠️ Skipped LLM Request - No change in conditions");
                return;
            }

            lastTopRef.current = stableTop;
            lastDiseaseRef.current = stableDisease;

            setLoading(true);

            // ---- Format Input ----
            const disaster_text =
                !topDisasters || topDisasters.length === 0
                    ? "No major environmental risks detected."
                    : topDisasters
                          .map(d => `${d.name}: today ${d.today.toFixed(1)}%, tomorrow ${d.tomorrow?.toFixed?.(1) || "N/A"}%`)
                          .join("\n");

            const disease_text =
                !diseases || Object.keys(diseases).length === 0
                    ? "No disease-related risks detected."
                    : Object.entries(diseases)
                          .map(([name, value]) => `${name.replace(/_/g, " ")} level ${value}`)
                          .join(", ");

            // ---- Prompt ----
            const prompt = `
Based on the following risks, give 2 or 3 short, natural suggestion and advice points in 1.
 , no headings and no bold words.  use simplified names.

Environmental risks: ${disaster_text}
Disease risks (1 = mild, 3 = high): ${disease_text}
disaster < 45 okay , < 60 moderate , > 60 high
Guidelines:
- 20 words max per line , 3 lines max.
- first line tell about the overall situation in one line with trend , no numbers.
- Then next line tell the impact on Public health in one line  .
- last 1-2 line ,  Focus on serious issues first as risks increase, advice in loud active tone According to Climate. 
- if riska are low or safe , advice should be reassuring. 
 ;
`;

            // ---- API Payload ----
            const payload = {
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: "Provide short helpful safety guidance." },
                    { role: "user", content: prompt },
                ],
                temperature: 0.4,
                max_tokens: 160,
            };

            // ---- LLM Call ----
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
        } catch (err) {
            console.log("LLM Error:", err);
            setSuggestion("Unable to fetch suggestions now.");
        } finally {
            setLoading(false);
        }
    };

    // ---- Trigger ONLY when actual update occurs ----
    useEffect(() => {
        getSuggestionsFromLLM();
    }, [stableTop, stableDisease]);

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="small" color="#000" />
            ) : (
                <Text style={styles.text}>{suggestion}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
    },
    text: {
        fontSize: 15,
        color: "#000",
        lineHeight: 22,
    },
});
