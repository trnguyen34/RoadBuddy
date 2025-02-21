// app/home.tsx

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Button, ActivityIndicator } from "react-native";
import axios from "axios";
import { router } from "expo-router";
import { BASE_URL } from "../configs/base-url"

export default function Home() {
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/home`, {
        withCredentials: true,
      })
      .then((response) => {
        console.log("Response data:", response.data); 
        setMessage(response.data.message);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching home data:", err.response || err);
        setError("Failed to fetch home data.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>{message}</Text>
      <Button title="Available Rides" onPress={() => router.push("/availablerides")} />
      <Button title="Comming Up Rides" onPress={() => router.push("/cominguprides")} />
      <Button title="Add Vehicle" onPress={() => router.push("/addcar")} />
      <Button title="Post Ride" onPress={() => router.push("/postride")} />
      <Button title="Request Ride" onPress={() => router.push("/requestride")} />
      <Button title="Logout" onPress={() => router.replace("/logout")} />
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcome: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  error: {
    fontSize: 18,
    color: "red",
  },
});