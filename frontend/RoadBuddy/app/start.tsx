import React, { useState } from "react";
import {
  Image,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { router } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function Start() {
  const [loading, setLoading] = useState(false);

  return (
    <View style={styles.container}>
      {/* Diagonal Background */}
      <View style={styles.backgroundTriangle} />

      {/* Welcome Text */}
      <Text style={styles.welcomeText}>Welcome to</Text>
      <Text style={styles.title}>RoadBuddy</Text>

      {/* Car and Bubble */}
      <Image
        source={require("../assets/images/brown-car-bubble.png")}
        style={styles.destinationImage}
      />

      {/* Sign In / Sign Up Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => router.push("/login")}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>SIGN IN</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signUpButton}
          onPress={() => router.push("/signup")}
        >
          <Text style={styles.buttonText}>SIGN UP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#BCD39C",
    position: "relative",
  },
  backgroundTriangle: {
    position: "absolute",
    top: 90,
    left: 0,
    width: 0,
    height: 0,
    borderLeftWidth: width,
    borderBottomWidth: height * 0.45,
    borderLeftColor: "transparent",
    borderBottomColor: "#C5DAA8",
    borderStyle: "solid",
  },
  welcomeText: {
    marginTop: 100,
    fontSize: 18,
    color: "#382f27",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#5C4B3D",
  },
  destinationImage: {
    width: "80%",
    height: "45%",
    resizeMode: "contain",
    marginTop: 20,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 30,
  },
  signInButton: {
    width: "60%",
    paddingVertical: 15,
    backgroundColor: "white",
    borderRadius: 40,
    alignItems: "center",
    marginBottom: 20,
  },
  signUpButton: {
    width: "60%",
    paddingVertical: 15,
    backgroundColor: "white",
    borderRadius: 40,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "bold",
    color: "#333",
    fontSize: 16,
  },
});
