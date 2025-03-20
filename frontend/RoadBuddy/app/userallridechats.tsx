import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../configs/base-url";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface RideChat {
  id: string;
  from: string;
  to: string;
  ownerName: string;
  date: string;
  departureTime: string;
  lastMessage: string;
  UsernameLastMessage: string;
  lastMessageTimestamp: string | null;
}

const ComingUpRides = () => {
  const insets = useSafeAreaInsets();
  const [rides, setRides] = useState<RideChat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchRides = async () => {
    try {
      console.log("Fetching rides...");
      const response = await axios.get(`${BASE_URL}/api/get-all-user-ride-chats`, {
        withCredentials: true,
      });
  
      if (!response.data.ride_chats || response.data.ride_chats.length === 0) {
        setError("No rides available.");
        setRides([]);
        return;
      }
  
      setRides(response.data.ride_chats);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.error || "Failed to fetch ride chat rooms.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRides();
  };

  const renderRideItem = ({ item }: { item: RideChat }) => {
    return (
      <TouchableOpacity
        style={styles.rideCard}
        onPress={() =>
          router.push({
            pathname: "/messagingscreen",
            params: {
              rideChatId: item.id,
            },
          })
        }
      >
        <Text style={styles.lastMessage}>{item.lastMessage || "No messages yet."}</Text>
        <Text>Date: {item.lastMessageTimestamp || "No one has send a message yet."}</Text>
        <Text style={styles.usernameLastMessage}>Name: {item.UsernameLastMessage || "No one has send a message yet."}</Text>
        <Text style={styles.rideHeader}>
          {item.from} → {item.to}
        </Text>
        <Text style={styles.rideText}>Driver: {item.ownerName} | Date: {item.date} | Departure Time: {item.departureTime}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/home')}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.iconContainer}>
  <Ionicons name="car-outline" size={40} color="#FFF" style={styles.carIcon} />
  <Ionicons name="chatbubble-ellipses-outline" size={40} color="#FFF" style={styles.messageIcon} />
</View>
        <Text style={styles.title}>Ride Chat Rooms</Text>
      </View>

      {/* Ride Chats List */}
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#F8F3E9" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <FlatList
            data={rides}
            keyExtractor={(item) => item.id}
            renderItem={renderRideItem}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#A3A380",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#A3A380",
    paddingTop: 10,
  },
  headerContainer: {
    paddingTop: "5%",
    backgroundColor: "#A3A380",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    alignItems: "center",
    position: "relative",
  },
  carIcon: {
    paddingTop: 3,
    marginBottom: 5,
  },
  backButton: {
    position: "absolute",
    left: 15,
    top: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  rideCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 10,
    paddingTop: 5,
    marginVertical: 8,
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // Android shadow
    elevation: 2,
  },
  rideHeader: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#5C4B3D",
    marginBottom: 2,
  },
  rideText: {
    fontSize: 12,
    color: "#333",
    marginBottom: 1,
  },
  lastMessage: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: "bold",
    color: "#4B688B"
  },
  usernameLastMessage: {
    paddingBottom: 10,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 15,
  },
  messageIcon: {
    marginLeft: 10,
  },
});

export default ComingUpRides;