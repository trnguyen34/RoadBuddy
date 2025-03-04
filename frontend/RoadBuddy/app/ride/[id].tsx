import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import { BASE_URL } from "../../configs/base-url";
import { router } from "expo-router";
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { googlePlaceApi } from "../../configs/google-api";
import { Ionicons } from "@expo/vector-icons";
import {Ride} from "./ride";
const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51MjBbNDiM3EAos9ocETiK2jsHzePLkUvL95YrsEwpCgThRFn4EI0eFyNl55l7jsJzEHoHbGXOyfDm9HYTLKLsKHw00jukt7PIy";


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
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  // Coordinates for markers and the route polyline
  const [originCoord, setOriginCoord] = useState<Coordinate | null>(null);
  const [destinationCoord, setDestinationCoord] = useState<Coordinate | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  // Local state for addresses
  const [originAddress, setOriginAddress] = useState<string>("");
  const [destinationAddress, setDestinationAddress] = useState<string>("");

  const stripe = useStripe();
  const { id } = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  // BottomSheet ref and snap points
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["15%", "50%"], []);
  const handleSheetChanges = useCallback((index: number) => {
    console.log("BottomSheet index:", index);
  }, []);

  // Animated value for error fade
  const fadeAnim = useRef(new Animated.Value(1)).current;

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

  // When error changes, display it and then fade out after 2 seconds
  useEffect(() => {
    if (error !== "") {
      // Reset opacity to fully visible
      fadeAnim.setValue(1);
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setError("");
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error, fadeAnim]);

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
      )}&destination=${encodeURIComponent(destination)}&key=${googlePlaceApi}`;
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

  const handleBookRide = async () => {
    if (!ride || !id) return;
    setError("");
    setBookingLoading(true);
    try {
      const amount = String(ride.cost);
      const refund = "false"
      const response = await axios.post(
        `${BASE_URL}/api/payment-sheet`,
        { rideId: id, amount, refund },
        { withCredentials: true }
      );
      const { paymentIntent, ephemeralKey, customer } = response.data;
      const { error: initError } = await stripe.initPaymentSheet({
        paymentIntentClientSecret: paymentIntent,
        customerEphemeralKeySecret: ephemeralKey,
        customerId: customer,
        merchantDisplayName: "RoadBuddy Inc",
      });
      if (initError) {
        setError(initError.message || "Error initializing payment.");
        setBookingLoading(false);
        return;
      }
      const { error: paymentError } = await stripe.presentPaymentSheet();
      if (paymentError) {
        setError(paymentError.message);
      } else {
        try {
          const rideResponse = await axios.post(
            `${BASE_URL}/api/request-ride`,
            { rideId: id },
            { withCredentials: true }
          );
          if (rideResponse.status === 200 || rideResponse.status === 201) {
            Alert.alert(
              "Success",
              "Your payment is confirmed and you have been added to the ride!"
            );
            router.replace("/cominguprides");
          } else {
            Alert.alert(
              "Error",
              "Payment succeeded, but there was an issue joining the ride."
            );
          }
        } catch (err: any) {
          Alert.alert(
            "Error",
            "Payment succeeded, but failed to add you to the ride."
          );
        }
      }
    } catch (err: any) {
      // Instead of logging the raw error, extract a custom message.
      const serverError =
        err.response?.data?.error || err.response?.data?.message;
      const errorMessage =
        serverError && !serverError.includes("Request failed with status code 400")
          ? serverError
          : "An error occurred while processing your payment.";
      setError(errorMessage);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Inline Error Banner with fade effect */}
      {error !== "" && (
        <Animated.View style={[styles.errorBanner, { opacity: fadeAnim }]}>
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#8C7B6B" />
        </View>
      )}

      {/* Main content: render only if data has loaded and a ride exists */}
      {!loading && ride && (
        <>
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
                mapRef.current?.fitToCoordinates(routeCoordinates, {
                  edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                });
              }
            }}
          >
            {originCoord && (
              <Marker coordinate={originCoord} title="Origin" description={ride.from} />
            )}
            {destinationCoord && (
              <Marker coordinate={destinationCoord} title="Destination" description={ride.to} />
            )}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={3}
                strokeColor="hotpink"
              />
            )}
          </MapView>

          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </Text>
          </TouchableOpacity>

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
              {bookingLoading ? (
                <ActivityIndicator size="large" color="#8C7B6B" />
              ) : (
                <TouchableOpacity style={styles.bookButton} onPress={handleBookRide}>
                  <Text style={styles.bookButtonText}>Book This Ride</Text>
                </TouchableOpacity>
              )}
            </BottomSheetView>
          </BottomSheet>
        </>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F3E9",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
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
  errorBanner: {
    position: "absolute",
    top: 90,
    left: 20,
    right: 20,
    padding: 10,
    backgroundColor: "#F8D7DA",
    borderRadius: 5,
    zIndex: 30,
  },
  errorText: {
    color: "#721C24",
    textAlign: "center",
    fontSize: 16,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  sheetContent: {
    flex: 1,
    padding: 10,
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
  bookButton: {
    backgroundColor: "#C5D1AB",
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 5,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
});

export default function RideDetails() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <RideDetailsScreen />
    </StripeProvider>
  );
}