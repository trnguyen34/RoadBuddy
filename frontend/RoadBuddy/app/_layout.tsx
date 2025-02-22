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
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            title: "RoadBuddy",
          }}
        />
        <Stack.Screen
          name="logout"
          options={{
            title: "Signup",
          }}
        />
        <Stack.Screen
          name="addcar"
          options={{
            title: "",
          }}
        />
        <Stack.Screen
          name="postride"
          options={{
            title: "Post Ride",
          }}
        />
        <Stack.Screen
          name="home"
          options={{
            title: "",
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            title: "Login",
            headerBackVisible: false,
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
      </Stack>
    </GestureHandlerRootView>
  );
}