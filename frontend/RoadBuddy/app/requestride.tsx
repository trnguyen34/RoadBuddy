import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { CardField, useStripe, StripeProvider } from '@stripe/stripe-react-native';
import axios from 'axios';
import { router } from 'expo-router';
import { BASE_URL } from '../configs/base-url';

const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51MjBbNDiM3EAos9ocETiK2jsHzePLkUvL95YrsEwpCgThRFn4EI0eFyNl55l7jsJzEHoHbGXOyfDm9HYTLKLsKHw00jukt7PIy';

function RequestRideScreen() {
  const { createToken } = useStripe();

  // Ride details state
  const [rideId, setRideId] = useState('');
  const [amount, setAmount] = useState('');
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal visibility for card details
  const [modalVisible, setModalVisible] = useState(false);

  // Function to submit the ride request after card details are complete
  const submitRideRequest = async () => {
    setError('');
    setLoading(true);
    try {
      // Create a Stripe token
      const { token, error: tokenError } = await createToken({ type: 'Card' });
      if (tokenError) {
        setError(tokenError.message || 'Token creation failed.');
        setLoading(false);
        return;
      }
      if (!token) {
        setError('Token not generated. Please try again.');
        setLoading(false);
        return;
      }

      const payload = {
        rideId,
        amount,
        cardToken: token.id,
      };

      const response = await axios.post(`${BASE_URL}/api/request-ride`, payload, {
        withCredentials: true,
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Ride request submitted successfully.');
        router.push('/home');
      } else {
        Alert.alert('Error', 'Failed to submit ride request.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          'An error occurred while submitting your ride request.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Main handler for the request ride action
  const handleRequestRide = () => {
    if (!rideId || !amount) {
      setError('Please fill in the ride ID and amount.');
      return;
    }

    // If card details are incomplete, open the modal.
    if (!cardDetails || !cardDetails.complete) {
      setModalVisible(true);
      return;
    }

    // Otherwise, submit the ride request.
    submitRideRequest();
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

      {/* Modal for entering card details, slides from the bottom */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Enter Your Card Details</Text>
            <CardField
              postalCodeEnabled={true}
              placeholder={{ number: '4242 4242 4242 4242' }}
              cardStyle={styles.card}
              style={styles.cardField}
              onCardChange={(card) => setCardDetails(card)}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                if (cardDetails && cardDetails.complete) {
                  setModalVisible(false);
                  submitRideRequest();
                } else {
                  Alert.alert('Error', 'Please complete your card details.');
                }
              }}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  modalHeader: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#333',
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 20,
  },
  card: {
    backgroundColor: '#fff',
    textColor: '#000',
    fontSize: 16,
    placeholderColor: '#A9A9A9',
  },
  modalButton: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});