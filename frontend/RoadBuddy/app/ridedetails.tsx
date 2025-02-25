// app/ridedetails.tsx
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useLocalSearchParams, router } from "expo-router";
import axios from "axios";
import { BASE_URL } from "../configs/base-url";
import MapView, { Marker, Polyline } from "react-native-maps";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { googlePlaceApi } from "../configs/google-api";
import { Ionicons } from "@expo/vector-icons";

const GOOGLE_MAPS_API_KEY = googlePlaceApi;

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

interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Decodes an encoded polyline string into an array of coordinates.
 */
function decodePolyline(encoded: string): Coordinate[] {
  let points: Coordinate[] = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({ latitude: lat * 1e-5, longitude: lng * 1e-5 });
  }
  return points;
}

function RideDetailsScreen() {
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  // Coordinates for markers and route polyline
  const [originCoord, setOriginCoord] = useState<Coordinate | null>(null);
  const [destinationCoord, setDestinationCoord] = useState<Coordinate | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  // Local state for addresses
  const [originAddress, setOriginAddress] = useState<string>("");
  const [destinationAddress, setDestinationAddress] = useState<string>("");

  const { id } = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  // BottomSheet ref and snap points
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["15%", "50%"], []);
  const handleSheetChanges = useCallback((index: number) => {
    console.log("BottomSheet index:", index);
  }, []);

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/rides/${id}`, {
          withCredentials: true,
        });
        setRide(response.data.ride);
      } catch (err) {
        setError("Failed to fetch ride details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRideDetails();
    }
  }, [id]);

  // Update addresses and fetch route when ride data is available
  useEffect(() => {
    if (ride) {
      setOriginAddress(ride.from);
      setDestinationAddress(ride.to);
      fetchRouteDirections(ride.from, ride.to);
    }
  }, [ride]);

  /**
   * Fetches directions from the Google Directions API, decodes the polyline,
   * and updates marker and route state.
   */
  const fetchRouteDirections = async (origin: string, destination: string) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
        origin
      )}&destination=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await axios.get(url);
      if (response.data.routes && response.data.routes.length) {
        const route = response.data.routes[0];
        const leg = route.legs[0];
        // Update marker coordinates using the leg's start and end locations
        setOriginCoord({
          latitude: leg.start_location.lat,
          longitude: leg.start_location.lng,
        });
        setDestinationCoord({
          latitude: leg.end_location.lat,
          longitude: leg.end_location.lng,
        });
        // Decode the overview polyline to get the route coordinates
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);
        // Fit the map to the route
        if (mapRef.current && points.length) {
          mapRef.current.fitToCoordinates(points, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          });
        }
      } else {
        console.error("No routes found");
      }
    } catch (err) {
      console.error("Error fetching directions", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8C7B6B" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Ride not found.</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Full Screen Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: originCoord ? originCoord.latitude : 37.78825,
          longitude: originCoord ? originCoord.longitude : -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onMapReady={() => {
          if (routeCoordinates.length) {
            mapRef.current.fitToCoordinates(routeCoordinates, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            });
          }
        }}
      >
        {originCoord && (
          <Marker
            coordinate={originCoord}
            title="Origin"
            description={ride.from}
          />
        )}
        {destinationCoord && (
          <Marker
            coordinate={destinationCoord}
            title="Destination"
            description={ride.to}
          />
        )}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={3}
            strokeColor="hotpink"
          />
        )}
      </MapView>

      {/* Draggable Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0} // Start collapsed (15% of screen height)
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={false}
        backgroundStyle={{ backgroundColor: "#fff" }}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.title}>Ride Details</Text>
          <View style={styles.card}>
            <Text style={styles.cardHeader}>
              {ride.from} → {ride.to}
            </Text>
            <Text style={styles.cardText}>Date: {ride.date}</Text>
            <Text style={styles.cardText}>Departure: {ride.departureTime}</Text>
            <Text style={styles.cardText}>
              Passengers: {ride.currentPassengers.length}/{ride.maxPassengers}
            </Text>
            <Text style={styles.cardText}>Cost: ${ride.cost}</Text>
            <Text style={styles.cardText}>Driver: {ride.ownerName}</Text>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F3E9",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 45,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  sheetContent: {
    flex: 1,
    padding: 10,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#5C4B3D",
    textAlign: "center",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5C4B3D",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
});

export default function RideDetails() {
    return <RideDetailsScreen />;
}
