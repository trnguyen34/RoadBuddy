import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const MainScreen = () => {
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
      <Text style={styles.header}>RoadBuddy</Text>
      <Image source={require('../assets/images/green-car.png')} style={styles.carImage} />
      <Text style={styles.welcome}>Hello, User</Text>
      <View style={styles.events}>
        <Text style={styles.eventItem}>Upcoming Events</Text>
        <Text style={styles.eventItem}>Event 1</Text>
        <Text style={styles.eventItem}>Event 2</Text>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity onPress={() => handleButtonPress('My Rides')} style={styles.button}>
          <Text>My Rides</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleButtonPress('My Requests')} style={styles.button}>
          <Text>My Requests</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleLogout} style={[styles.button, styles.logoutButton]}>
        <Text style={{ color: 'white' }}>Logout</Text>
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5d4c42',
    marginTop: 20,
  },
  carImage: {
    width: 100,
    height: 100,
    position: 'absolute',
    top: 20,
  },
  welcome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 60,
  },
  events: {
    color: '#f4f4f4',
    marginTop: 20,
  },
  eventItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    padding: 5,
    margin: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 40,
  },
  button: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    width: 120,
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
});

export default MainScreen;
