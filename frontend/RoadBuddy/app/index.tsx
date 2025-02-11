import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './login';
import HomeScreen from './home';
import SignupScreen from './signup';

const Stack = createNativeStackNavigator();

const App = () => {
    return (
      
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
    );
  };
export default App;
