import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Dimensions } from 'react-native'; // for responsive styling

const { width } = Dimensions.get('window');

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
      <View style={styles.backgroundRectangle} />
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

      {/* Bottom Left Button */}
      <TouchableOpacity onPress={() => handleButtonPress('Messages')} style={[styles.button, styles.bottomLeftButton]}>
        <Text style={{ color: 'black' }}>M</Text>
      </TouchableOpacity>

      {/* Bottom Right Button */}
      <TouchableOpacity onPress={() => handleButtonPress('Post Ride/Request')} style={[styles.bottomRightButton, styles.bottomRightButton]}>
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
    width: 180,
    height: 180,
    position: 'absolute',
    top: 120,
    left: 50,
  },
  welcome: {
    fontSize: width * 0.08,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 170,
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
});

export default MainScreen;
