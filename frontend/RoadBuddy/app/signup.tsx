import React, { useState, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import {
    createStaticNavigation,
    ParamListBase,
    useNavigation,
  } from '@react-navigation/native';

function SignupScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
                  
    const handleSignIn = () => {
        // Implement your login logic here
        // For example, you might want to post a message to a native layer or handle it within React Native
        console.log('Sign In pressed');
        navigation.navigate('Home');
        
    };

    const navigateToSignUp = () => {
        // Implement navigation logic here
        console.log('Navigate to Sign Up');
        navigation.navigate('Signup');
    };
  
    return (
      <View style={styles.container}>
          <View style={styles.backgroundRectangle} />
          <TouchableOpacity onPress={() => console.log('Back button pressed')} style={styles.backButton}>
              <Text>&#8592;</Text>
          </TouchableOpacity>
          <Text style={styles.title}>RoadBuddy</Text>
          <Image source={require('../assets/images/destination.png')} style={styles.destinationImage} />
          <View style={styles.loginContainer}>
              <Text style={styles.header}>Sign Up</Text>
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
                  placeholder="Username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
              />
              <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
              />
              <TouchableOpacity onPress={handleSignIn} style={styles.signInButton}>
                  <Text style={styles.buttonText}>Sign Up</Text>
              </TouchableOpacity>
              {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          </View>
      </View>
    );
  };

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
        top: 20,
        left: 20,
    },
    title: {
        position: 'absolute',
        top: 20,
        alignSelf: 'center',
        fontSize: 28,
        fontWeight: 'bold',
        color: '#382f27',
    },
    loginContainer: {
        width: 250,
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
      top: -70,
      resizeMode: 'contain',
  },
});

  export default SignupScreen;