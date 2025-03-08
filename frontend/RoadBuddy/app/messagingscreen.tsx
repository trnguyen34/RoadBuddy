import React, { useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";




// Message Component
const Message = ({ text, isSender }: { text: string; isSender: boolean }) => {
  return (
    <View style={[styles.messageContainer, isSender ? styles.sender : styles.receiver]}>
      <Text style={styles.messageText}>{text}</Text>
    </View>
  );
};

const messages = [
  { id: "1", text: "Hey, how are you?", isSender: false },
  { id: "2", text: "I'm good! How about you?", isSender: true },
  { id: "3", text: "Doing well, thanks!", isSender: false },
];

// Messaging Screen
const MessagingScreen = () => {
  const [text, setText] = useState("");
  const [refresh, toggleRefresh] = useState(true);
  const [msgid,setID] = useState(4);
  function handleMessage(){
    console.log(text);
    messages.push({id:msgid.toString(),text:text, isSender:true});
    setID(msgid+1);
    toggleRefresh(!refresh);
    setText("");
  }
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      {/* Back Button */}
         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
      <Text style={styles.header}>RoadBuddy</Text>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Message text={item.text} isSender={item.isSender} />}
        contentContainerStyle={styles.chatContainer}
        extraData={refresh}
      />
      <View style={styles.inputContainer}>
        <TextInput style={styles.input} placeholder="Type a message..." defaultValue={text} placeholderTextColor="#aaa" onChangeText={newText => setText(newText)}/>
        <TouchableOpacity style={styles.sendButton} onPress={() => handleMessage()}>
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 16,
    color: "#4D4036",
  },
  backButton: {
    position: "absolute",
    left: 30,
    top: 60,
    zIndex: 1,
  },
  chatContainer: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  messageContainer: {
    maxWidth: "75%",
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
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
    color: "#4D4036",
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
});

export default MessagingScreen;
