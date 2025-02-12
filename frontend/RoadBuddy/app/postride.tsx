
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

const BASE_URL = 'http://192.168.4.26:8090';

export default function PostRide() {
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [date, setDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [maxPassengers, setMaxPassengers] = useState('');
  const [cost, setCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePostRide = async () => {
    if (!fromAddress || !toAddress || !date || !departureTime || !maxPassengers || !cost) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        from: fromAddress,
        to: toAddress,
        date: date,
        departure_time: departureTime,
        max_passengers: parseInt(maxPassengers, 10),
        cost: parseFloat(cost),
      };

      const response = await axios.post(`${BASE_URL}/api/post-ride`, payload, {
        withCredentials: true,
      });

      if (response.status === 201) {
        Alert.alert('Success', 'Ride posted successfully!');
        router.replace('/home');
      } else {
        Alert.alert('Error', 'Failed to post ride.');
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.error || 'An error occurred.');
    } finally {
      setLoading(false);
    }
};

  return (
    <View style={styles.container}>
      {/*
      <View style={styles.autocompleteContainer}>
        <GooglePlacesAutocomplete
          placeholder="From"
          onPress={(data, details = null) => {
            setFromAddress(data.description);
          }}
          query={{
            key: 'YOUR_GOOGLE_API_KEY',
            language: 'en',
            components: 'country:us',
          }}
          fetchDetails={true}
          styles={{
            textInputContainer: styles.autocompleteTextInputContainer,
            textInput: styles.autocompleteTextInput,
          }}
        />
      </View>

      <View style={styles.autocompleteContainer}>
        <GooglePlacesAutocomplete
          placeholder="To"
          onPress={(data, details = null) => {
            setToAddress(data.description);
          }}
          query={{
            key: 'YOUR_GOOGLE_API_KEY',
            language: 'en',
            components: 'country:us',
          }}
          fetchDetails={true}
          styles={{
            textInputContainer: styles.autocompleteTextInputContainer,
            textInput: styles.autocompleteTextInput,
          }}
        />
      </View>
      */}

      {/* Regular TextInput for the "From" address */}
      <TextInput
        style={styles.input}
        placeholder="From"
        value={fromAddress}
        onChangeText={setFromAddress}
      />

      {/* Regular TextInput for the "To" address */}
      <TextInput
        style={styles.input}
        placeholder="To"
        value={toAddress}
        onChangeText={setToAddress}
      />

      {/* Other ride details */}
      <TextInput
        style={styles.input}
        placeholder="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
      />
      <TextInput
        style={styles.input}
        placeholder="Departure Time (e.g., 08:00 AM)"
        value={departureTime}
        onChangeText={setDepartureTime}
      />
      <TextInput
        style={styles.input}
        placeholder="Max Passengers"
        value={maxPassengers}
        onChangeText={setMaxPassengers}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Cost"
        value={cost}
        onChangeText={setCost}
        keyboardType="numeric"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <Button title="Post Ride" onPress={handlePostRide} />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  autocompleteContainer: {
    marginBottom: 12,
  },
  autocompleteTextInputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 0,
  },
  autocompleteTextInput: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
  },
});
