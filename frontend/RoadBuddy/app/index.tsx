import React, { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
const HomeHTML = require('./templates/home.html');
console.log('HomeHTML:', HomeHTML);
class MyWeb extends Component {
  render() {
    return (
      <WebView
        source={HomeHTML}
        style={{flex: 1}}
      />
    );
  }
}