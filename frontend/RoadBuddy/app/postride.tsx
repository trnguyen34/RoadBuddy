/* eslint-disable react/jsx-no-duplicate-props */
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  TouchableOpacity, 
  Platform,
  SafeAreaView,
  Modal,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import 'react-native-get-random-values';
import axios from 'axios';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BASE_URL } from "../configs/base-url";
import { googlePlaceApi } from "../configs/google-api";
import { Ionicons } from "@expo/vector-icons";

interface Car {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
}

export default function PostRide() {
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');

  // Date and Time states
  const today = new Date();
  const initialDateText = today.toISOString().split('T')[0];
  const initialTimeText = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const [date, setDate] = useState(new Date());
  const [dateText, setDateText] = useState(initialDateText);

  const [departureTime, setDepartureTime] = useState(new Date());
  const [departureTimeText, setDepartureTimeText] = useState(initialTimeText);

  // Controls to show/hide pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [maxPassengers, setMaxPassengers] = useState('');
  const [cost, setCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [cars, setCars] = useState<Car[]>([]);

  // New state: store the selected car object (or null)
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [carModalVisible, setCarModalVisible] = useState<boolean>(false);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await axios.get<{ cars: Car[] }>(`${BASE_URL}/api/get-cars`, {
          withCredentials: true,
        });

        if (response.status === 200) {
          setCars(response.data.cars);
        } else {
          Alert.alert(
            "Error",
            "You must have at least one vehicles added to post a ride. Do you want to add a vehicle?",
            [
              { text: "Cancel", onPress: () => router.replace("/home") },
              { text: "Proceed", onPress: () => router.replace("/addcar") },
            ]
          );
        }
      } catch (err) {
        console.error("Failed to fetch added vehicles:", err);
        setError("Failed to fetch added vehicles data.");
      }
    };
    fetchCars();
  }, []);

  // Helper to create a formatted string for a car
  const formatCar = (car: Car) => {
    return `${car.year} ${car.color.trim()} ${car.make.trim()} ${car.model.trim()}`;
  };

  // Helper to check if a given time (Date) is in the past relative to now
  const isTimeInPast = (selectedTime: Date) => {
    const now = new Date();
    return selectedTime.getTime() < now.getTime();
  };

  // Helper function for displaying date in MM-DD-YYYY format
  const formatDateForDisplay = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-');
    return `${month}-${day}-${year}`; // Convert to MM-DD-YYYY
  };

  const handlePostRide = async () => {
    setLoading(true);
    setError('');

    if (!fromAddress.trim()) {
      setError("Please enter a valid 'From' address.");
      setLoading(false);
      return;
    }
  
    if (!toAddress.trim()) {
      setError("Please enter a valid 'To' address.");
      setLoading(false);
      return;
    }

    // Validate that a car was selected
    if (!selectedCar) {
      setError("Please select a vehicle for this ride.");
      setLoading(false);
      return;
    }

    const todayString = new Date().toISOString().split('T')[0];
    if (dateText < todayString) {
      setError("Date cannot be in the past.");
      setLoading(false);
      return;
    }

    if (dateText === todayString && isTimeInPast(departureTime)) {
      setError("Departure time cannot be in the past.");
      setLoading(false);
      return;
    }

    if (!departureTimeText.trim()) {
      setError("Please fill in the 'departure time' field.");
      setLoading(false);
      return;
    }

    if (!maxPassengers.trim()) {  
      setError("Please fill in the 'maximum passengers' field.");
      setLoading(false);
      return;
    }

    if (!cost.replace('$ ', '')) {
      setError("Please fill in the 'cost' field.");
      setLoading(false);
      return;
    }

    if (parseFloat(cost) < 0.5) {
      setError("Cost must be at least $0.50");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        car_select: formatCar(selectedCar),
        license_plate: selectedCar.licensePlate,
        from: fromAddress,
        to: toAddress,
        date: dateText,
        departure_time: departureTimeText,
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
      <View style={[styles.headerContainer]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/home')}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Post A Ride</Text>
      </View>
      {/* "From" Autocomplete */}
      <SafeAreaView style={styles.autocompleteContainer}>
        <GooglePlacesAutocomplete
          placeholder="From"
          onPress={(data, details = null) => {
            setFromAddress(data.description);
          }}
          query={{ key: googlePlaceApi, components: 'country:us' }}
          fetchDetails={true}
          onFail={error => console.log(error)}
          onNotFound={() => console.log('no results')}
          styles={{
            container: { flex: 0 },
            description: {
              color: '#000',
              fontSize: 16,
            },
            predefinedPlacesDescription: {
              color: '#3caf50',
            },
            textInputContainer: {
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              backgroundColor: '#fff',
            },
            textInput: {
              height: 45,
              borderRadius: 8,
              paddingHorizontal: 10,
              fontSize: 16,
              color: '#000',
            },
          }}
        />
      </SafeAreaView>

      {/* "To" Autocomplete */}
      <SafeAreaView style={styles.autocompleteContainer}>
        <GooglePlacesAutocomplete
          placeholder="To"
          onPress={(data, details = null) => {
            setToAddress(data.description);
          }}
          query={{ key: googlePlaceApi, components: 'country:us' }}
          fetchDetails={true}
          onFail={error => console.log(error)}
          onNotFound={() => console.log('no results')}
          styles={{
            container: { flex: 0 },
            description: {
              color: '#000',
              fontSize: 16,
            },
            predefinedPlacesDescription: {
              color: '#3caf50',
            },
            textInputContainer: {
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              backgroundColor: '#fff',
            },
            textInput: {
              height: 45,
              borderRadius: 8,
              paddingHorizontal: 10,
              fontSize: 16,
              color: '#000',
            },
          }}
        />
      </SafeAreaView>

      {/* Date Picker */}
      <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.inputText}>
          {dateText ? formatDateForDisplay(dateText) : "Select Date (MM-DD-YYYY)"}
        </Text>
      </TouchableOpacity>

      {/* Modal for Date Picker */}
      <Modal
        transparent={true}
        visible={showDatePicker}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setShowDatePicker(false)}
        >
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setDate(selectedDate);
                  const formatted = selectedDate.toISOString().split('T')[0];
                  setDateText(formatted);
                }
              }}
            />
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Time Picker */}
      <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
        <Text style={styles.inputText}>{departureTimeText || "Select Departure Time"}</Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={showTimePicker}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setShowTimePicker(false)}
        >
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <DateTimePicker
              value={departureTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedTime) => {
                if (selectedTime) {
                  if (dateText === new Date().toISOString().split('T')[0] && isTimeInPast(selectedTime)) {
                    Alert.alert('Error', 'Departure time cannot be in the past.');
                  } else {
                    setDepartureTime(selectedTime);
                    const formattedTime = selectedTime.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    });
                    setDepartureTimeText(formattedTime);
                  }
                }
              }}
            />
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowTimePicker(false)}>
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Car Selection Field */}
      <TouchableOpacity style={styles.input} onPress={() => setCarModalVisible(true)}>
        <Text style={styles.inputText}>
          {selectedCar ? formatCar(selectedCar) : "Select Your vehicle"}
        </Text>
      </TouchableOpacity>

      {/* Modal for Car Selection */}
      <Modal
        visible={carModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCarModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setCarModalVisible(false)}
        >
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <Text style={styles.modalHeader}>Select Your Car</Text>
            <Picker
              selectedValue={selectedCar ? selectedCar.licensePlate : (cars[0]?.licensePlate || '')}
              onValueChange={(itemValue) => {
                // Find the car that matches the selected license plate
                const car = cars.find((c) => c.licensePlate === itemValue);
                if (car) {
                  setSelectedCar(car);
                }
              }}
              style={styles.picker}
            >
              {cars.map((car) => (
                <Picker.Item key={car.licensePlate} label={formatCar(car)} value={car.licensePlate} />
              ))}
            </Picker>
            <TouchableOpacity style={styles.modalButton} onPress={() => setCarModalVisible(false)}>
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Other ride details */}
      <TextInput
        style={styles.input}
        placeholder="Max Passengers"
        value={maxPassengers}
        keyboardType="numeric"
        maxLength={2}
        onChangeText={(text) => {
          const filteredText = text.replace(/[^0-9]/g, '');
          setMaxPassengers(filteredText);
        }}
      />

      <TextInput
        style={styles.input}
        placeholder="Cost"
        value={`$ ${cost}`}
        keyboardType="numeric"
        onChangeText={(text) => {
          let filteredText = text.replace(/[^0-9.]/g, '');
          if ((filteredText.match(/\./g) || []).length > 1) return;
          if (filteredText.startsWith('.')) {
            filteredText = `0${filteredText}`;
          }
          setCost(filteredText);
        }}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handlePostRide}>
          <Text style={styles.buttonText}>Post Ride</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 20,
    backgroundColor: '#F8F3E9',
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
    marginBottom: 22,
    fontSize: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  autocompleteContainer: {
    marginBottom: 22,
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalHeader: {
    fontSize: 20,
    marginBottom: 10,
  },
  picker: {
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    width: '80%',
    alignSelf: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputText: {
    fontSize: 16,
    color: '#000',
  },
  button: {
    marginTop: 10,
    width: '100%',
    padding: 10,
    backgroundColor: '#C5D1AB',
    borderRadius: 20,
    alignItems: 'center',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerContainer: {
    backgroundColor: "#8C7B6B",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    paddingBottom: 50,
    alignItems: "center",
    paddingTop: 20,
    marginTop: 0,
    marginBottom: 30,
  },
  backButton: {
    position: "absolute",
    left: 15,
    top: 22,
    marginTop: 70,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F8F3E9",
    marginTop: 70,
    // marginBottom: 40,
  },
});