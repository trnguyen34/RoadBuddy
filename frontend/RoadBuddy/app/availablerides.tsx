// app/availablerides.tsx
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
type SortFunction = (a: Ride, b: Ride) => number;

interface SortConfig {
    [key: string]: SortFunction;
}
export default function AvailableRides() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshRides, setRefresh] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/available-rides`, {
          withCredentials: true,
        });
        setRides(response.data.rides);
      } catch (err: any) {
        setError(
          err.response?.data?.error || "Failed to fetch rides. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, []);

  const renderRideItem = ({ item }: { item: Ride }) => {
    // We wrap each card in a TouchableOpacity to make it clickable
    return (
      <TouchableOpacity
        style={styles.rideCard}
        onPress={() => {
          // Navigate to ride details page using the ride's ID
          router.push(`/ride/${item.id}`);
        }}
      >
        <Text style={styles.rideLocations}>
          {item.from} → {item.to}
        </Text>
        <Text style={styles.rideDate}>
          date: {item.date} | departure: {item.departureTime}
        </Text>
        <Text style={styles.rideText}>Driver: {item.ownerName}</Text>
        <View style={styles.row}>
          <Text style={styles.seatsText}>
            {item.currentPassengers.length}/{item.maxPassengers} seats
          </Text>
          <Text style={styles.costText}>${item.cost}</Text>
          <Ionicons name="chatbubble-outline" size={20} color="#333" />
        </View>
      </TouchableOpacity>
    );
  };

  function sortRides(criterion: keyof SortConfig | 'default', rides: Ride[]) {
    const sortConfig: SortConfig = {
        id: (a, b) => a.id.localeCompare(b.id),
        from: (a, b) => a.from.localeCompare(b.from),
        to: (a, b) => a.to.localeCompare(b.to),
        departure: (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime(),
        cost: (a, b) => a.cost-b.cost,
        maxPassengers: (a, b) => a.maxPassengers - b.maxPassengers,
        ownerName: (a, b) => a.ownerName.localeCompare(b.ownerName),  
        default: (a, b) => new Date(`${a.date}T${a.departureTime}`).getTime() - new Date(`${b.date}T${b.departureTime}`).getTime()
    };
    const sortFunction = sortConfig[criterion] ?? sortConfig['default'];
    rides.sort(sortFunction);
    setRides(rides);
    setRefresh(!refreshRides);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <Ionicons name="car-outline" size={40} color="#FFF" style={styles.carIcon} />
          <Text style={styles.ridesTitle}>Rides</Text>

          {/* Search Bar (placeholder) */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#5C4B3D" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#5C4B3D"
            />
            
          </View>
          <TouchableOpacity style={styles.sortButton} onPress={() => sortRides('', rides)}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color="#8C7B6B" style={{ marginTop: 20 }} />}
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <FlatList
            data={rides}
            keyExtractor={(item) => item.id}
            renderItem={renderRideItem}
            contentContainerStyle={styles.listContent}
            style={styles.list}
            extraData={refreshRides}
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
    backgroundColor: "#FBF4E5",
  },
  headerContainer: {
    backgroundColor: "#8C7B6B",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    paddingBottom: 50,
    alignItems: "center",
    paddingTop: 20,
  },
  backButton: {
    position: "absolute",
    left: 15,
    top: 15,
  },
  sortButton: {
    position: "absolute",
    marginRight: 5,
  },
  carIcon: {
    marginBottom: 5,
  },
  roadBuddyText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 10,
  },
  ridesTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 15,
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
  list: {
    marginTop: -30,
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  /******** Ride Card ********/
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
  rideLocations: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#5C4B3D",
    marginBottom: 6,
  },
  rideDate: {
    fontSize: 14,
    color: "#5C4B3D",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seatsText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  costText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  rideText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
});