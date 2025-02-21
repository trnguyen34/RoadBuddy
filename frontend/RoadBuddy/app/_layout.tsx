/* eslint-disable react/react-in-jsx-scope */
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{
          title: "RoadBuddy",
        }} />
      <Stack.Screen
        name="signup"
        options={{
          title: "RoadBuddy",
        }} />
      <Stack.Screen
        name="logout"
        options={{
          title: "Signup",
        }} />
      <Stack.Screen
        name="addcar"
        options={{
          title: "",
        }} />
      <Stack.Screen
        name="postride"
        options={{
          title: "Post Ride",
        }} />
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
          headerShown: false
        }} />
      <Stack.Screen
        name="cominguprides"
        options={{
          title: "",
          headerShown: false
        }} />
    </Stack>
  );
}
