
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  Animated,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { router } from "expo-router";
import { BASE_URL } from "../configs/base-url";
import { Ionicons } from "@expo/vector-icons";

// Define valid options.
const validMakes = ["BMW", "Honda", "Ford", "Mercedez", "Toyota", "Lexus"].sort();
const validModels: { [key: string]: string[] } = {
  Toyota: ["Camry", "Corolla", "Prius"].sort(),
  Honda: ["Accord", "Civic", "Fit"].sort(),
  Ford: ["Focus", "Fusion", "Mustang"].sort(),
  Mercedez: ["AMG-GT", "S-Class Sedan", "C-Class Sedan", "Maybach"].sort(),
  BMW: ["M4 Coupe", "Z4 Roadster", "X1 SUV"].sort(),
  Lexus: ["GX", "RX 350", "RX 450H", "LX HYBRID"].sort()
};

const currentYear = new Date().getFullYear();
const validYears = Array.from(
  { length: currentYear - 2000 + 1 },
  (_, i) => (2000 + i).toString()
);

const validColors = [
  "Red",
  "Green",
  "Blue",
  "Black",
  "White",
  "Silver",
  "Gray",
  "Yellow",
  "Orange",
  "Brown",
];


export default function AddCar() {
  // Other fields.
  const [licensePlate, setLicensePlate] = useState<string>("");
  const [vin, setVin] = useState<string>("");

  // For make, model, year, and color, start with an empty string.
  const [make, setMake] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [color, setColor] = useState<string>("");

  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Modal visibility states for each selection.
  const [makeModalVisible, setMakeModalVisible] = useState<boolean>(false);
  const [modelModalVisible, setModelModalVisible] = useState<boolean>(false);
  const [yearModalVisible, setYearModalVisible] = useState<boolean>(false);
  const [colorModalVisible, setColorModalVisible] = useState<boolean>(false);

  const fadeAnim = useState(new Animated.Value(1))[0];
  const translateYAnim = useState(new Animated.Value(0))[0]; // Vertical position animation

  // When user selects a new make, update the model accordingly (resetting it).
  const handleMakeChange = (selectedMake: string) => {
    setMake(selectedMake);
    setModel(""); // Force user to choose a model for the new make.
    setError("");
    fadeAnim.setValue(1);
    translateYAnim.setValue(0);
  };

  const handleModelSelection = () => {
    if (!make) {
      setError("Please select a make first.");
      fadeAnim.setValue(1); // Reset opacity to fully visible
      translateYAnim.setValue(0); // Reset position
  
      // Start fade-out and slide-up animation after 2 seconds
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0, // Fade out
            duration: 1000, // 1 second fade-out
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: -10, // Move it up slightly
            duration: 1000, // 1 second slide-up
            useNativeDriver: true,
          }),
        ]).start(() => setError("")); // Clear error after animation completes
      }, 2000);
    } else {
      setModelModalVisible(true);
    }
  };

  const handleAddCar = async () => {
    // Validate that required selections are made.
    if (!make || !model || !year || !color || !licensePlate || !vin) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const payload = {
        make,
        model,
        licensePlate,
        vin,
        year,
        color,
        isPrimary: isPrimary.toString(),
      };

      const response = await axios.post(`${BASE_URL}/api/add-car`, payload, {
        withCredentials: true,
      });

      if (response.status === 201) {
        Alert.alert("Success", "Ride posted successfully!");
        router.replace("/home");
      } else {
        setError("Failed to add vehicle.");
      }
    } catch (err: any) {
      console.error("Add vehicle Error:", err);
      setError(err.response?.data?.error || "An error occurred.");
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
        <Text style={styles.title}>Add Car</Text>
      </View>
      {error ? (
      <Animated.View
          style={[
            { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] },
          ]}
        >
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      ) : null}

      {/* Touchable selectors */}
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setMakeModalVisible(true)}
      >
        <Text style={[styles.selectorText, !make && styles.placeholderText]}>
          {make || "Select Make"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.selector}
        onPress={handleModelSelection}
        >
        <Text style={[styles.selectorText, !model && styles.placeholderText]}>
          {model || "Select Model"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.selector}
        onPress={() => setYearModalVisible(true)}
      >
        <Text style={[styles.selectorText, !year && styles.placeholderText]}>
          {year || "Select Year"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.selector}
        onPress={() => setColorModalVisible(true)}
      >
        <Text style={[styles.selectorText, !color && styles.placeholderText]}>
          {color || "Select Color"}
        </Text>
      </TouchableOpacity>

      {/* License Plate Input */}
      <TextInput
        style={[
          styles.selector,
          licensePlate ? styles.selectorText : styles.placeholderText,
        ]}
        placeholder="License Plate"
        placeholderTextColor="#999"
        value={licensePlate}
        onChangeText={setLicensePlate}
      />

      {/* VIN Input */}
      <TextInput
        style={[
          styles.selector,
          vin ? styles.selectorText : styles.placeholderText,
        ]}
        placeholder="VIN"
        placeholderTextColor="#999"
        value={vin}
        onChangeText={setVin}
      />

      {/* Checkbox for Primary Car */}
      {/* <View style={styles.checkboxContainer}>
        <Text style={styles.label}>Primary Car?</Text>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setIsPrimary(!isPrimary)}
        >
          {isPrimary && <Text style={styles.checkboxTick}>✔</Text>}
        </TouchableOpacity>
      </View> */}

      <TouchableOpacity
        style={styles.button}
        onPress={handleAddCar}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Add Car</Text>
        )}
      </TouchableOpacity>

      {/* Modal for Make */}
      <Modal
        visible={makeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMakeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setMakeModalVisible(false)}
        >
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <Text style={styles.modalHeader}>Select Make</Text>
            <Picker
              selectedValue={make || validMakes[0]}
              onValueChange={(itemValue) => handleMakeChange(itemValue)}
              style={styles.picker}
            >
              {validMakes.map((mk) => (
                <Picker.Item key={mk} label={mk} value={mk} />
              ))}
            </Picker>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setMakeModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal for Model */}
      <Modal
        visible={modelModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModelModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModelModalVisible(false)}
        >
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <Text style={styles.modalHeader}>Select Model</Text>
            <Picker
              selectedValue={model || (make ? validModels[make][0] : "")}
              onValueChange={(itemValue) => setModel(itemValue)}
              style={styles.picker}
            >
              {make &&
                validModels[make].map((mod) => (
                  <Picker.Item key={mod} label={mod} value={mod} />
                ))}
            </Picker>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModelModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal for Year */}
      <Modal
        visible={yearModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setYearModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setYearModalVisible(false)}
        >
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <Text style={styles.modalHeader}>Select Year</Text>
            <Picker
              selectedValue={year || validYears[0]}
              onValueChange={(itemValue) => setYear(itemValue)}
              style={styles.picker}
            >
              {validYears.map((yr) => (
                <Picker.Item key={yr} label={yr} value={yr} />
              ))}
            </Picker>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setYearModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal for Color */}
      <Modal
        visible={colorModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setColorModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setColorModalVisible(false)}
        >
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <Text style={styles.modalHeader}>Select Color</Text>
            <Picker
              selectedValue={color || validColors[0]}
              onValueChange={(itemValue) => setColor(itemValue)}
              style={styles.picker}
            >
              {validColors.map((col) => (
                <Picker.Item key={col} label={col} value={col} />
              ))}
            </Picker>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setColorModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 20,
    backgroundColor: "#F8F3E9",
  },
  selector: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 22,
    backgroundColor: '#fff',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)',
  },
  selectorText: {
    fontSize: 16,
  },
  errorBox:{

  },
  placeholderText: {
    color: "#999",
    fontWeight: "normal",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalHeader: {
    fontSize: 20,
    marginBottom: 10,
  },
  picker: {
    width: "100%",
  },
  modalButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    width: "80%",
    alignSelf: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    marginRight: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxTick: {
    fontSize: 18,
  },
  button: {
    backgroundColor: '#C5D1AB',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 10,
    width: '100%',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)',
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  successText: {
    color: "green",
    marginBottom: 10,
    textAlign: "center",
  },
  headerContainer: {
    backgroundColor: "#8C7B6B",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    paddingBottom: 50,
    alignItems: "center",
    paddingTop: 20,
    marginTop: 0,
    marginBottom: 70,
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