
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Button, StyleSheet } from "react-native";
import axios from "axios";
import { router } from "expo-router";
import { BASE_URL } from "../configs/base-url"

export default function Logout() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Call the logout endpoint when the component mounts
    axios
      .post(`${BASE_URL}/api/logout`, {}, { withCredentials: true })
      .then((response) => {
        // On successful logout, navigate to the login screen
        router.replace("/start");
      })
      .catch((err) => {
        console.error("Logout error:", err);
        setError("Failed to logout. Please try again.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Logging out...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Try Again"
          onPress={() => {
            setLoading(true);
            setError("");
            // Retry logging out
            axios
              .post(`${BASE_URL}/api/logout`, {}, { withCredentials: true })
              .then((response) => {
                router.replace("/login");
              })
              .catch((err) => {
                console.error("Logout error:", err);
                setError("Failed to logout. Please try again.");
                setLoading(false);
              });
          }}
        />
      </View>
    );
  }

  // Optional: If not loading and no error, show a simple message and a button to go to login.
  return (
    <View style={styles.container}>
      <Text>You have been logged out.</Text>
      <Button title="Go to Login" onPress={() => router.replace("/login")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
});