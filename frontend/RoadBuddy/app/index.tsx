import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { router } from "expo-router";
import Start from "./start";

// export default function Index() {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.text}>Welcome to RoadBuddy</Text>
//       <Button title="Log In" onPress={() => router.push("/login")} />
//       <Button title="Sign Up" onPress={() => router.push("/signup")} />
//     </View>
//   );
// }

export default function Index() {
  return <Start />;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 24, fontWeight: "bold" },
});
