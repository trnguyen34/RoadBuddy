/* eslint-disable react/react-in-jsx-scope */
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{
            title: "RoadBuddy",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            title: "RoadBuddy",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="logout"
          options={{
            title: "Logout",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="addcar"
          options={{
            title: "",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="postride"
          options={{
            title: "Post Ride",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="home"
          options={{
            title: "",
            headerBackVisible: false,
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            title: "Login",
            headerBackVisible: false,
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="start"
          options={{
            title: "Start",
            headerBackVisible: false,
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="messagingscreen"
          options={{
            title: "",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="availablerides"
          options={{
            title: "",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="cominguprides"
          options={{
            title: "",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ride/[id]"
          options={{
            title: "",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ridedetails"
          options={{
            title: "",
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="notificationscreen" 
          options={{
            title: "notificationscreen",
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="userallridechats" 
          options={{
            title: "userallridechats",
            headerShown: false,
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}