// requestride.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { CardField, useStripe } from "@stripe/stripe-react-native";
import axios from "axios";
import { router } from "expo-router";
import { BASE_URL } from "../configs/base-url";

export default function RequestRide() {
  const { createToken } = useStripe();

  // State for ride details
  const [rideId, setRideId] = useState("");
  const [amount, setAmount] = useState("");

  const [cardDetails, setCardDetails] = useState<any>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestRide = async () => {
    if (!rideId || !amount) {
      setError("Please fill in the ride ID and amount.");
      return;
    }

    if (!cardDetails || !cardDetails.complete) {
      setError("Please fill in your credit card details.");
      return;
    }

    setError("");
    setLoading(true);

    const { token, error: tokenError } = await createToken({ type: "Card" });
    if (tokenError) {
      setError(tokenError.message || "Token creation failed.");
      setLoading(false);
      return;
    }
    if (!token) {
      setError("Token not generated. Please try again.");
      setLoading(false);
      return;
    }

    const payload = {
      rideId,
      amount,
      cardToken: token.id,
    };

    try {
      const response = await axios.post(`${BASE_URL}/api/request-ride`, payload, {
        withCredentials: true,
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert("Success", "Ride request submitted successfully.");
        router.replace("/home");
      } else {
        Alert.alert("Error", "Failed to submit ride request.");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          "An error occurred while submitting your ride request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Request a Ride</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <TextInput
        style={styles.input}
        placeholder="Ride ID"
        value={rideId}
        onChangeText={setRideId}
      />
      <TextInput
        style={styles.input}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      
      {/* Credit Card Entry */}
      <Text style={styles.label}>Enter your credit card details:</Text>
      <CardField
        postalCodeEnabled={true}
        placeholder={{
          number: "4242 4242 4242 4242",
          expiration: "MM/YY",
          cvc: "CVC",
          postalCode: "ZIP",
        }}
        cardStyle={styles.card}
        style={styles.cardContainer}
        onCardChange={(cardDetails) => {
          setCardDetails(cardDetails);
          console.log("Card details changed:", cardDetails);
        }}
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <Button title="Request Ride" onPress={handleRequestRide} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  cardContainer: {
    height: 50,
    marginVertical: 20,
  },
  card: {
    backgroundColor: "#fff",
    textColor: "#000",
    fontSize: 16,
    placeholderColor: "#A9A9A9",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
});