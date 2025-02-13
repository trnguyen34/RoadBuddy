// app/addCar.tsx

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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { router } from "expo-router";
import { BASE_URL } from "../configs/base-url"

// Define valid options.
const validMakes = ["Toyota", "Honda", "Ford"];
const validModels: { [key: string]: string[] } = {
  Toyota: ["Camry", "Corolla", "Prius"],
  Honda: ["Accord", "Civic", "Fit"],
  Ford: ["Focus", "Fusion", "Mustang"],
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

  // When user selects a new make, update the model accordingly (resetting it).
  const handleMakeChange = (selectedMake: string) => {
    setMake(selectedMake);
    setModel(""); // Force user to choose a model for the new make.
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
        isPrimary: isPrimary.toString(), // Or simply isPrimary if API accepts booleans
      };

      const response = await axios.post(`${BASE_URL}/api/add-car`, payload, {
        withCredentials: true,
      });

      if (response.status === 201) {
        // setSuccess("Car added successfully!");
        Alert.alert('Success', 'Ride posted successfully!');
				router.replace('/home');
      } else {
        setError("Failed to add car.");
      }
    } catch (err: any) {
      console.error("Add Car Error:", err);
      setError(err.response?.data?.error || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* <Text style={styles.header}>Add a Car</Text> */}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}

      {/* Touchable selectors for make, model, year, and color */}
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
        onPress={() => setModelModalVisible(true)}
        disabled={!make} // Disable model selection until a make is chosen.
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

      {/* License Plate Input with similar styling */}
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

      {/* VIN Input with similar styling */}
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
      <View style={styles.checkboxContainer}>
        <Text style={styles.label}>Primary Car?</Text>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setIsPrimary(!isPrimary)}
        >
          {isPrimary && <Text style={styles.checkboxTick}>✔</Text>}
        </TouchableOpacity>
      </View>

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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
          </View>
        </View>
      </Modal>

      {/* Modal for Model */}
      <Modal
        visible={modelModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
          </View>
        </View>
      </Modal>

      {/* Modal for Year */}
      <Modal
        visible={yearModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setYearModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
          </View>
        </View>
      </Modal>

      {/* Modal for Color */}
      <Modal
        visible={colorModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setColorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: "#fff",
    // justifyContent: "center"
  },
  header: { 
    fontSize: 28, 
    fontWeight: "bold", 
    marginBottom: 20, 
    textAlign: "center" 
  },
  input: { 
    height: 45, 
    borderColor: "#ccc", 
    borderWidth: 1, 
    borderRadius: 8, 
    paddingHorizontal: 10, 
    marginBottom: 12 
  },
  selector: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectorText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  placeholderText: {
    color: "#999",
    fontStyle: "italic",
    fontWeight: "normal",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  picker: {
    width: "100%",
  },
  modalButton: {
    marginTop: 10,
    backgroundColor: "#007bff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
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
    backgroundColor: "#007bff", 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: "center",
    marginTop: 10,
  },
  backButton: {
    backgroundColor: "#6c757d",
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "600"
  },
  errorText: { 
    color: "red", 
    marginBottom: 10, 
    textAlign: "center"
  },
  successText: {
    color: "green",
    marginBottom: 10,
    textAlign: "center"
  },
});