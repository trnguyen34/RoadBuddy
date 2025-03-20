import React, { useState, useEffect, useRef } from "react";
import { 
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useLocalSearchParams } from "expo-router";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/app/firebase-config";
import { BASE_URL } from "../configs/base-url";
import axios from "axios";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  isOwner: boolean;
}

const MessagingScreen = () => {
  const { rideChatId } = useLocalSearchParams();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/user-id`, { withCredentials: true });
        setCurrentUserId(response.data.userId);
      } catch (err) {
        console.error("Failed to fetch user ID", err);
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (!rideChatId) return;
  
    const messagesRef = collection(db, "ride_chats", rideChatId as string, "messages");
    const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));
  
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const updatedMessages = snapshot.docs.map((doc) => {
        const data = doc.data();
  
        return {
          id: doc.id,
          text: data.text,
          senderId: data.senderId,
          senderName: data.senderName,
          isOwner: data.isOwner,
          timestamp: data.timestamp?.toDate().toLocaleString("en-US", { 
            timeZone: "America/Los_Angeles", 
            hour: "2-digit", 
            minute: "2-digit", 
            hour12: true 
          }) || "Unknown Time",
        };
      }) as Message[];
  
      setMessages(updatedMessages);
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, [rideChatId]);

  const handleSendMessage = async () => {
    if (!text.trim()) return;
    setText("");

    try {
      const response = await axios.post(
        `${BASE_URL}/api/send-message`,
        {
          rideId: rideChatId,
          text: text.trim(),
        },
        { withCredentials: true }
      );
  
      if (response.status === 201) {
        console.log("Message sent successfully!");
      } else {
        console.error("Failed to send message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.header}>RoadBuddy</Text>

        {/* Chat Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={styles.messageWrapper}>
              {item.senderId !== currentUserId && (
                <Text style={styles.senderName}>{item.senderName}</Text>
              )}
              <View style={[styles.messageContainer, item.senderId === currentUserId ? styles.sender : styles.receiver]}>
                <Text style={styles.messageText}>{item.text}</Text>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input Field & Send Button */}
        <View style={styles.inputContainer}>
          <TextInput
            autoFocus
            style={styles.input}
            placeholder="Type a message..."
            value={text}
            placeholderTextColor="#aaa"
            onChangeText={(newText) => setText(newText)}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  messageWrapper: {
    marginBottom: 8,
  },
  senderName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
    marginLeft: 5,
  },
  messageContainer: {
    maxWidth: "75%",
    padding: 10,
    borderRadius: 10,
    marginVertical: 2,
  },
  sender: {
    alignSelf: "flex-end",
    backgroundColor: "#A3A380",
  },
  receiver: {
    alignSelf: "flex-start",
    backgroundColor: "#DAD3C8",
  },
  messageText: {
    fontSize: 16,
    color: "#4D4036",
  },
  container: {
    flex: 1,
    backgroundColor: "#F6F1E9",
    padding: 16,
    paddingTop: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 16,
    color: "#4D4036",
  },
  backButton: {
    position: "absolute",
    left: 30,
    top: 75,
    zIndex: 1,
  },
  chatContainer: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#4D4036",
  },
  sendButton: {
    backgroundColor: "#A3A380",
    padding: 10,
    borderRadius: 20,
    marginLeft: 10,
  },
  timestamp: {
    fontSize: 10,
    textAlign: "left",
    color: "#777",
    marginTop: 4,
  },
});

export default MessagingScreen;