
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import { BASE_URL } from "../../configs/base-url";
import { router } from "expo-router";

// 1. Import Stripe
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";

const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51MjBbNDiM3EAos9ocETiK2jsHzePLkUvL95YrsEwpCgThRFn4EI0eFyNl55l7jsJzEHoHbGXOyfDm9HYTLKLsKHw00jukt7PIy';

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

function RideDetailsScreen() {
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  
  // For the booking flow
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const stripe = useStripe();

  // Use the local search params from the route
  const { id } = useLocalSearchParams();

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

    // Only fetch if id exists
    if (id) {
      fetchRideDetails();
    }
  }, [id]);

  // 2. Booking logic with Payment Sheet
  const handleBookRide = async () => {
    if (!ride || !id) return;
    setError("");
    setBookingLoading(true);

    try {
      // Convert the ride cost to a string (if your backend expects a string)
      const amount = String(ride.cost);

      // 2A. Call your backend to create PaymentIntent, Ephemeral Key, and Customer
      const response = await axios.post(
        `${BASE_URL}/api/payment-sheet`,
        { rideId: id, amount },
        { withCredentials: true }
      );
      const { paymentIntent, ephemeralKey, customer } = response.data;

      // 2B. Initialize the Payment Sheet
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

      // 2C. Present the Payment Sheet
      const { error: paymentError } = await stripe.presentPaymentSheet();
      if (paymentError) {
        Alert.alert("Payment Error", paymentError.message);
      } else {
        // Payment succeeded, so call your backend to finalize the booking
        try {
          // 2D. Add the user to the ride
          //    If your backend returns 201 or 200, treat as success
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
          console.error(err);
          Alert.alert(
            "Error",
            "Payment succeeded, but failed to add you to the ride."
          );
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          "An error occurred while processing your payment."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  // 3. Render states
  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#8C7B6B" />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Ride not found.</Text>
      </View>
    );
  }

  // 4. Main UI
  return (
    <View style={styles.container}>
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

      {/* 5. Book Ride Button */}
      {bookingLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#8C7B6B" />
      ) : (
        <TouchableOpacity style={styles.bookButton} onPress={handleBookRide}>
          <Text style={styles.bookButtonText}>Book This Ride</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// 6. Wrap RideDetailsScreen in StripeProvider
export default function RideDetails() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <RideDetailsScreen />
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F3E9",
    padding: 20,
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
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 15,
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // Android shadow
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
    marginTop: 20,
    backgroundColor: "#C5D1AB",
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
});