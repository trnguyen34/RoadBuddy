
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
	TextInput,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../configs/base-url";
import { router, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {Ride} from "./ride/ride";

function ComingUpRides() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchRides = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/coming-up-rides`, {
        withCredentials: true,
      });

      // Sort rides by date first, then by departure time
      const sortedRides = response.data.rides.sort((a: Ride, b: Ride) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }

        const timeA = a.departureTime.split(":").map(Number);
        const timeB = b.departureTime.split(":").map(Number);
        const departureTimeA = timeA[0] * 60 + timeA[1];
        const departureTimeB = timeB[0] * 60 + timeB[1];

        return departureTimeA - departureTimeB;
      });

      setRides(sortedRides);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to fetch rides. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false); // Stop refreshing animation
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRides();
  };

  const renderRideItem = ({ item }: { item: Ride }) => {
    return (
      <TouchableOpacity
        style={styles.rideCard}
        onPress={() =>
          router.push({
            pathname: "/ridedetails",
            params: {
              id: item.id,
              from: item.from,
              to: item.to,
              date: item.date,
              departureTime: item.departureTime,
              cost: item.cost.toString(),
              currentPassengers: JSON.stringify(item.currentPassengers),
              maxPassengers: item.maxPassengers.toString(),
              car: item.car,
              licensePlate: item.licensePlate,
              ownerName: item.ownerName,
            },
          })
        }
      >
        <Text style={styles.rideHeader}>
          {item.from} → {item.to}
        </Text>
        <Text style={styles.rideText}>Date: {item.date}</Text>
        <Text style={styles.rideText}>Departure: {item.departureTime}</Text>
        <Text style={styles.rideText}>Cost: ${item.cost}</Text>
        <Text style={styles.rideText}>
          Passengers: {item.currentPassengers.length}/{item.maxPassengers}
        </Text>
        <Text style={styles.rideText}>Car: {item.car}</Text>
        <Text style={styles.rideText}>License Plate: {item.licensePlate}</Text>
        <Text style={styles.rideText}>Driver: {item.ownerName}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.headerContainer]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/home')}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Ionicons name="car-outline" size={40} color="#FFF" style={styles.carIcon} />
        <Text style={styles.title}>My Upcoming Rides</Text>
      </View>

      {/* Rides List */}
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#F8F3E9" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <FlatList
            data={rides}
            keyExtractor={(item) => item.id}
            renderItem={renderRideItem}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#8C7B6B",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#8C7B6B",
		paddingTop: 10,
  },
  headerContainer: {
		paddingTop: "5%",
    backgroundColor: "#8C7B6B",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    alignItems: "center",
    position: "relative",
  },
	carIcon: {
		paddingTop: 3,
    marginBottom: 5,
  },
  backButton: {
    position: "absolute",
    left: 15,
    top: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
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
	searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F3E9",
    width: "80%",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 5,
    color: "#5C4B3D",
  },
});

export default ComingUpRides;