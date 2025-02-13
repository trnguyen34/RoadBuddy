import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/app/firebase-config";
import { BASE_URL } from "../configs/base-url"

export default function Signup() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSignup = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await axios.post(`${BASE_URL}/api/signup`, {
        name,
        email,
        password,
      });

      if (response.status === 201) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Retrieve the Firebase ID token
        const idToken = await user.getIdToken();

        // 3. Send the token to the Flask backend to set the session cookie
        await axios.post(
          `${BASE_URL}/auth`,
          {},
          {
            headers: {
              // Flask backend expects the token in the Authorization header
              Authorization: `Bearer ${idToken}`,
            },
            // Ensures that cookies (like the session cookie) are included with the request
            withCredentials: true,
          }
        );
        router.replace("/home");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || "Signup failed, please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sign Up</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
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
});