
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { Dimensions } from 'react-native';
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { BASE_URL } from "../configs/base-url"
import {Ride} from "./ride/ride";

const { width } = Dimensions.get('window');

export default function Home() {
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [rides, setRides] = useState<Ride[]>([]);

  const checkUserAuthentication = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/home`, { withCredentials: true });
      setMessage(response.data.message);
      setIsLoggedIn(true);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching home data:", err);
      setError("Failed to fetch home data.");
      setIsLoggedIn(false);
      setLoading(false);
    }
  };

  const fetchUnreadNotifications = async () => {
    if (!isLoggedIn) return;
    try {
      const response = await axios.get(`${BASE_URL}/api/unread-notifications-count`, { withCredentials: true });
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error("Error fetching unread notifications count:", error);
    }
  };

  const fetchUpcomingRides = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/coming-up-rides`, { withCredentials: true });
      const sortedRides = response.data.rides
        .sort((a: { date: string }, b: { date: string }) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 2);
      setRides(sortedRides);
    } catch (error) {
      console.error("Error fetching upcoming rides:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      checkUserAuthentication();

      if (isLoggedIn) {
        fetchUnreadNotifications();
        fetchUpcomingRides();
        const interval = setInterval(fetchUnreadNotifications, 2000);

        return () => clearInterval(interval);
      }
    }, [isLoggedIn])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }


  // Mock function for navigation or other interactions
  const handleButtonPress = (screen: string) => {
    console.log(`Navigate to ${screen}`);
  };

  return (
    
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.backgroundRectangle} />
      <Text style={styles.header}>RoadBuddy</Text>
      <Image source={require('../assets/images/green-car.png')} style={styles.carImage} />

      <View>
        <Text style={styles.welcome}>{message}</Text>
        {/* <Button title="Available Rides" onPress={() => router.push("/availablerides")} /> */}
        {/* <Button title="Comming Up Rides" onPress={() => router.push("/cominguprides")} /> */}
        {/* <Button title="Add Vehicle" onPress={() => router.push("/addcar")} /> */}
        {/* <Button title="Post Ride" onPress={() => router.push("/postride")} />
        <Button title="Request Ride" onPress={() => router.push("/requestride")} />
        <Button title="Logout" onPress={() => router.replace("/logout")} /> */}
      </View>

      <View style={styles.events}>
        <Text style={styles.eventItem}>Upcoming Rides</Text>
        {rides.length > 0 ? (
          rides.map((ride, index) => (
            <Text key={index} style={styles.eventItem}>{ride.from} → {ride.to} at {new Date(ride.date).toLocaleDateString("en-US")} {ride.departureTime}</Text>
          ))
        ) : (
          <Text style={styles.eventItem}>No upcoming rides</Text>
        )}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity onPress={() => router.push("/cominguprides")} style={styles.button}>
          <Text>My Rides</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/postride")} style={styles.button}>
          <Text>Post Ride</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity onPress={() => router.push("/availablerides")} style={styles.button}>
          <Text>Available Rides</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/addcar")} style={styles.button}>
          <Text>Add Vehicle</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.replace("/logout")} style={[styles.button, styles.logoutButton]}>
        <Text style={{ color: 'white' }}>Logout</Text>
      </TouchableOpacity>

      {/* Bottom Left Button - Notifications */}
      {isLoggedIn && (
        <TouchableOpacity onPress={() => router.push("/notificationscreen")} style={[styles.button, styles.bottomLeftButton]}>
          {unreadCount > 0 ? (
            <View style={styles.notificationIconContainer}>
              <Ionicons name="notifications" size={24} color="black" />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            </View>
          ) : (
            <Ionicons name="notifications-outline" size={24} color="black" />
          )}
        </TouchableOpacity>
      )}

      {/* Bottom Right Button */}
      <TouchableOpacity onPress={() => router.push("/userallridechats")} style={[styles.bottomRightButton, styles.bottomRightButton]}>
        <Ionicons name="chatbox-outline" size={20} color="black"/>
      </TouchableOpacity>
      <View style={styles.footer}>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f1e5',
  },
  backgroundRectangle: {
    position: 'absolute',
    bottom: 0,
    // left: 0,
    width: '100%',
    height: '70%',
    backgroundColor: '#A09189',
    borderTopLeftRadius: 150,
    // borderBottomRightRadius: 50,
    elevation: 0,
  },    
  header: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#382f27',
  },
  carImage: {
    width: 200,
    height: 180,
    position: 'absolute',
    top: 135,
    left: 40,
  },
  welcome: {
    fontSize: width * 0.065,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 200,
    marginBottom: 20,
  },
  events: {
    color: '#f4f4f4',
    // marginTop: 10,
    width: '70%',
  },
  eventItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    color: '#ddd',
    padding: 5,
    margin: 10,
    // width: '100%',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  button: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    width: 140,
    alignItems: 'center',
    shadowOffset: { width: 2, height: 2 },
    shadowColor: 'black',
    shadowOpacity: 0.2,
  },
  logoutButton: {
    backgroundColor: '#d9534f',
    marginTop: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    position: 'absolute',
    bottom: 10,
  },
  footerIcon: {
    width: 30,
    height: 30,
  },
  bottomLeftButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#DFD8CA',
    padding: 15,
    borderRadius: 100,
    width: 50,
    alignItems: 'center',
  },
  bottomRightButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#DFD8CA',
    padding: 15,
    borderRadius: 100,
    width: 50,
    alignItems: 'center',
  },
  notificationIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  error: {
    fontSize: 18,
    color: "red",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#5C4B3D",
  },
});