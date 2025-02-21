import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import axios from 'axios';
import { router } from 'expo-router';
import { BASE_URL } from '../configs/base-url';

const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51MjBbNDiM3EAos9ocETiK2jsHzePLkUvL95YrsEwpCgThRFn4EI0eFyNl55l7jsJzEHoHbGXOyfDm9HYTLKLsKHw00jukt7PIy';

function RequestRideScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [rideId, setRideId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestRide = async () => {
    if (!rideId || !amount) {
      setError('Please fill in the ride ID and amount.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${BASE_URL}/api/payment-sheet`,
        { rideId, amount },
        { withCredentials: true }
      );
      const { paymentIntent, ephemeralKey, customer } = response.data;

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentIntent,
        customerEphemeralKeySecret: ephemeralKey,
        customerId: customer,
        merchantDisplayName: 'RoadBuddy Inc',
      });
      if (initError) {
        setError(initError.message || 'Error initializing payment.');
        setLoading(false);
        return;
      }

      const { error: paymentError } = await presentPaymentSheet();
      if (paymentError) {
        Alert.alert('Payment Error', paymentError.message);
      } else {
        try {
          const rideResponse = await axios.post(
            `${BASE_URL}/api/request-ride`,
            { rideId },
            { withCredentials: true }
          );
          if (rideResponse.status === 201) {
            Alert.alert(
              'Success',
              'Your payment is confirmed and you have been added to the ride!'
            );
          } else {
            Alert.alert(
              'Error',
              'Payment succeeded, but there was an issue joining the ride.'
            );
          }
        } catch (err: any) {
          console.error(err);
          Alert.alert(
            'Error',
            'Payment succeeded, but failed to add you to the ride.'
          );
        }
        router.push('/home');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          'An error occurred while processing your payment.'
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
        placeholderTextColor="#888"
        value={rideId}
        onChangeText={setRideId}
      />
      <TextInput
        style={styles.input}
        placeholder="Amount (USD)"
        placeholderTextColor="#888"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.primaryButton} onPress={handleRequestRide}>
        <Text style={styles.buttonText}>Request Ride</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" color="#007bff" />}
    </View>
  );
}

export default function App() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <RequestRideScreen />
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
  },
  header: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  primaryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
  },
});