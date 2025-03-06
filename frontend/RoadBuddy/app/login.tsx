// app/login.tsx

import React, { useState } from "react";
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/app/firebase-config";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import { BASE_URL } from "../configs/base-url"

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("One or more fields are empty");
      setLoading(false);
      return;
    }

    setError("");
    setLoading(true);
    try {
      // 1. Authenticate with Firebase
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

      // 4. Navigate to the home screen upon success
      router.replace("/home");
    } catch (err: any) {
      setError("Incorrect email or password.");
    } finally {
      setLoading(false);
    }
  };
return (
    <View style={styles.container}>
        <View style={styles.backgroundRectangle} />
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>RoadBuddy</Text>
        <Image source={require('../assets/images/destination.png')} style={styles.destinationImage} />
        <View style={styles.loginContainer}>
            <Text style={styles.header}>Sign In</Text>
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

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.signInButton} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
                <Text>Don't have an account?</Text>
                <TouchableOpacity
                  style={styles.signUpButton}
                  onPress={() => router.push("/signup")}
                >
                  <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F8F3E9',
      position: 'relative',
  },
  backgroundRectangle: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '50%',
      backgroundColor: '#A09189',
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
      elevation: 0,
  },    
  backButton: {
      position: 'absolute',
      top: 80,
      left: 20,
  },
  title: {
      position: 'absolute',
      top: 70,
      alignSelf: 'center',
      fontSize: 28,
      fontWeight: 'bold',
      color: '#382f27',
  },
  loginContainer: {
      width: 270,
      backgroundColor: 'white',
      padding: 30,
      borderRadius: 10,
      boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)',
      textAlign: 'center',
      alignItems: 'center',
  },
  header: {
      fontSize: 34,
      color: '#5C4B3D',
      marginBottom: 20,
  },
  input: {
      width: '100%',
      padding: 10,
      marginVertical: 10,
      borderBottomWidth: 2,
      borderBottomColor: '#C1B6A4',
      fontSize: 16,
      color: '#5C4B3D',
  },
  signInButton: {
      marginTop: 10,
      width: '100%',
      padding: 10,
      backgroundColor: '#C5D1AB',
      borderRadius: 20,
      alignItems: 'center',
  },
  buttonText: {
      fontWeight: 'bold',
      color: '#333',
  },
  error: {
      color: 'red',
      marginTop: 10,
  },
  signupContainer: {
      marginTop: 20,
      alignItems: 'center',
      width: '100%',
  },
  signUpButton: {
      marginTop: 10,
      width: '100%',
      padding: 10,
      backgroundColor: '#C5D1AB',
      borderRadius: 20,
      alignItems: 'center',
  },
  destinationImage: {
      width: '80%',
      height: '55%',
      position: 'absolute',
      top: -60,
      resizeMode: 'contain',
  },
});