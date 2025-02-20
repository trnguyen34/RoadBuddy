// app/cominguprides.tsx
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { BASE_URL } from "../configs/base-url";

interface Ride {
  id: string;
  from: string;
  to: string;
  date: string;
  departureTime: string;
  cost: number;
  currentPassengers: string[];
  maxPassengers: number;
  ownerName: string;
}

function ComingUpRides() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/coming-up-rides`, {
          withCredentials: true,
        });
        setRides(response.data.rides);
      } catch (err: any) {
        setError(
          err.response?.data?.error ||
            "Failed to fetch rides. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, []);

  const renderRideItem = ({ item }: { item: Ride }) => {
    return (
      <TouchableOpacity style={styles.rideCard}>
        <Text style={styles.rideHeader}>
          {item.from} → {item.to}
        </Text>
        <Text style={styles.rideText}>Date: {item.date}</Text>
        <Text style={styles.rideText}>Departure: {item.departureTime}</Text>
        <Text style={styles.rideText}>Cost: ${item.cost}</Text>
        <Text style={styles.rideText}>
          Passengers: {item.currentPassengers.length}/{item.maxPassengers}
        </Text>
        <Text style={styles.rideText}>Driver: {item.ownerName}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>My Upcoming Rides</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#8C7B6B" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <FlatList
            data={rides}
            keyExtractor={(item) => item.id}
            renderItem={renderRideItem}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F3E9",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F8F3E9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#5C4B3D",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  rideCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 15,
    marginVertical: 8,
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // Android shadow
    elevation: 2,
  },
  rideHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5C4B3D",
    marginBottom: 8,
  },
  rideText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
});

export default ComingUpRides;