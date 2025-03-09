import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { router } from "expo-router";
import { BASE_URL } from "../configs/base-url";

interface Notification {
  id: string;
  message: string;
  read: boolean;
  rideId: string;
  createdAt: string;
}

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const fadeAnim = useState(new Animated.Value(1))[0];

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/get-notifications`, {
        withCredentials: true,
      });
      setNotifications(response.data.notifications);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to fetch notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Watch for error changes and fade out after 2 seconds.
  useEffect(() => {
    if (error) {
      // Reset opacity in case a previous error was animated out
      fadeAnim.setValue(1);
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          // Clear error after the fade-out animation completes
          setError("");
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error, fadeAnim]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const handlePress = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/rides/${item.rideId}`);
        if (response.status === 200 && response.data) {
          router.push({
            pathname: "/ridedetails",
            params: { id: item.rideId },
          });
        } else {
          setError("Ride details no longer available");
        }
      } catch {
        setError("Ride details no longer available");
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          item.read ? styles.notificationRead : styles.notificationNew,
        ]}
        onPress={handlePress}
      >
        <View style={styles.notificationHeader}>
          <Ionicons
            name={item.read ? "notifications-outline" : "notifications"}
            size={24}
            color={item.read ? "#B0BEC5" : "#FFD700"}
          />
          <Text style={styles.notificationDate}>{item.createdAt}</Text>
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#D4A373" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      {error !== "" && (
        <Animated.View style={[styles.errorBanner, { opacity: fadeAnim }]}>
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#FFD700"]} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f1e5",
  },
  headerContainer: {
    backgroundColor: "#f7f1e5",
    paddingTop: "5%",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    alignItems: "center",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 15,
    top: 22,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#382f27",
    paddingBottom: 10
  },
  listContainer: {
    padding: 20,
  },
  notificationCard: {
    borderRadius: 15,
    padding: 20,
    marginVertical: 8,
    backgroundColor: "#6D4C41",
    borderLeftWidth: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationNew: {
    borderLeftColor: "#FFD700",
    backgroundColor: "#8C7B6B",
  },
  notificationRead: {
    borderLeftColor: "white",
    backgroundColor: "#8C7B6B",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  notificationMessage: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFF",
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: "#FFF",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    color: "red",
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: "#721C24",
    textAlign: "center",
    fontSize: 16,
  },
  errorBanner: {
    position: "absolute",
    top: 110,
    left: 20,
    right: 20,
    padding: 5,
    backgroundColor: "#F8D7DA",
    borderRadius: 5,
    zIndex: 30,
  },
});