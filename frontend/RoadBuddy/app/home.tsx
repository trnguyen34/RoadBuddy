// // app/home.tsx

// import React, { useEffect, useState } from "react";
// import { View, Text, StyleSheet, Button, ActivityIndicator } from "react-native";
// import axios from "axios";
// import { router } from "expo-router";
// import { BASE_URL } from "../configs/base-url"

// export default function Home() {
//   const [message, setMessage] = useState<string>("");
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string>("");

//   useEffect(() => {
//     axios
//       .get(`${BASE_URL}/api/home`, {
//         withCredentials: true,
//       })
//       .then((response) => {
//         console.log("Response data:", response.data); 
//         setMessage(response.data.message);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Error fetching home data:", err.response || err);
//         setError("Failed to fetch home data.");
//         setLoading(false);
//       });
//   }, []);

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#007bff" />
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.center}>
//         <Text style={styles.error}>{error}</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Text style={styles.welcome}>{message}</Text>
//       <Button title="Available Rides" onPress={() => router.push("/availablerides")} />
//       <Button title="Comming Up Rides" onPress={() => router.push("/cominguprides")} />
//       <Button title="Add Vehicle" onPress={() => router.push("/addcar")} />
//       <Button title="Post Ride" onPress={() => router.push("/postride")} />
//       <Button title="Request Ride" onPress={() => router.push("/requestride")} />
//       <Button title="Logout" onPress={() => router.replace("/logout")} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//     backgroundColor: "#fff",
//   },
//   center: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   welcome: {
//     fontSize: 24,
//     fontWeight: "bold",
//     textAlign: "center",
//   },
//   error: {
//     fontSize: 18,
//     color: "red",
//   },
// });








// import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { Dimensions } from 'react-native'; // for responsive styling
import React, { useEffect, useState } from "react";
import axios from "axios";
import { router } from "expo-router";
import { BASE_URL } from "../configs/base-url"

const { width } = Dimensions.get('window');

export default function Home() {
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/home`, {
        withCredentials: true,
      })
      .then((response) => {
        console.log("Response data:", response.data); 
        setMessage(response.data.message);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching home data:", err.response || err);
        setError("Failed to fetch home data.");
        setLoading(false);
      });
  }, []);

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



  // Define a function for logout, for example
  const handleLogout = () => {
    console.log('Logout action');
  };

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
        <Text style={styles.eventItem}>Upcoming Events</Text>
        <Text style={styles.eventItem}>Event 1</Text>
        <Text style={styles.eventItem}>Event 2</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity onPress={() => router.push("/cominguprides")} style={styles.button}>
          <Text>My Rides</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleButtonPress('My Requests')} style={styles.button}>
          <Text>My Requests</Text>
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

      {/* Bottom Left Button */}
      <TouchableOpacity onPress={() => router.push("/requestride")} style={[styles.button, styles.bottomLeftButton]}>
        <Text style={{ color: 'black' }}>R</Text>
      </TouchableOpacity>

      {/* Bottom Right Button */}
      <TouchableOpacity onPress={() => router.push("/postride")} style={[styles.bottomRightButton, styles.bottomRightButton]}>
        <Text style={{ color: 'black' }}>P</Text>
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
    top: 20,
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
  error: {
    fontSize: 18,
    color: "red",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});