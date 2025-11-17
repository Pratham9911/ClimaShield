import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Real-Time Climate Alerts",
    description:
      "Stay informed with instant AI-powered alerts on upcoming climate risks like heatwaves, floods, or pollution spikes in your area.",
    image: require("../assets/onboarding1.png"),
  },
  {
    id: "2",
    title: "Your Health, Your Safety",
    description:
      "Personalized analysis of how climate conditions may affect your health, with tailored precautions and safety tips.",
    image: require("../assets/onboarding2.png"),
  },
  {
    id: "3",
    title: "Insights & Preparedness",
    description:
      "Track local health and climate trends, access resources, and view reports to build resilience in your community.",
    image: require("../assets/onboarding3.png"),
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef();

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({
        index: currentIndex + 1,
      });
    } else {
      navigation.replace("Dashboard");
    }
  };

  return (
    <View style={styles.container}>

      {/* ----- IMAGE SLIDER (ONLY IMAGE MOVES) ----- */}
      <FlatList
        data={slides}
        ref={flatListRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.imageSlide}>
            <Image source={item.image} style={styles.image} />
          </View>
        )}
      />

      {/* ----- FIXED CONTENT (DOES NOT SLIDE) ----- */}
      <View style={styles.fixedContent}>

        {/* Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, currentIndex === index && styles.activeDot]}
            />
          ))}
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {slides[currentIndex].title}
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          {slides[currentIndex].description}
        </Text>

      </View>

      {/* ----- BOTTOM BUTTONS ----- */}
      <View style={styles.bottomButtons}>
        {currentIndex === slides.length - 1 ? (
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleNext}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleNext}>
            <Text style={styles.nextText}>Next ›</Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },

  imageSlide: {
    width: width,
    alignItems: "center",
    marginTop: 110, // reduced - moves image closer to center
  },

  image: {
    width: "75%",
    height: height * 0.32, // slightly larger image
    resizeMode: "contain",
  },

  fixedContent: {
    position: "absolute",
    top: height * 0.52, // pushes text area downward toward center
    width: "100%",
    paddingHorizontal: 30,
    alignItems: "center",
  },

  dotsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D5D5D5",
    marginHorizontal: 5,
  },

  activeDot: {
    backgroundColor: "#5A3E8C",
    width: 22,
  },

  title: {
    fontSize: 26, // larger for readability
    fontWeight: "700",
    color: "#5A3E8C",
    textAlign: "center",
    marginBottom: 12,
  },

  description: {
    fontSize: 16, // increased size
    color: "#6F6F6F",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 25,
  },

  bottomButtons: {
    position: "absolute",
    bottom: 90, // moved upward for better balance
    width: "100%",
    alignItems: "center",
  },

  nextText: {
    fontSize: 18, // slightly larger
    color: "#777",
    fontWeight: "500",
  },

  getStartedButton: {
    backgroundColor: "#4B0082",
    width: "80%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  getStartedText: {
    color: "#FFFFFF",
    fontSize: 18, // larger
    fontWeight: "600",
  },
});
