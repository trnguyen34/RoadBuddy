import React, { useState, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    createStaticNavigation,
    ParamListBase,
    useNavigation,
  } from '@react-navigation/native';

function RideOfferCreationScreen() {
    const [htmlUri, setHtmlUri] = useState<string | null>('');
    const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
    function handleMessage(event: { nativeEvent: { data: any; }; }){
            const message = event.nativeEvent.data;
            switch (message) {
                case 'navigateHome':
                  navigation.navigate('Home');
                  break;
                case 'navigateSignUp':
                    navigation.navigate('Signup');
                    break;
                default:
                  console.log('Received message:', message);
              }
        }
    useEffect(() => {
      (async () => {
        const asset = Asset.fromModule(require('../assets/templates/ridePost.html'));
        await asset.downloadAsync(); 
        setHtmlUri(asset.localUri || null);
      })();
    }, []);
  
    return htmlUri ? (
      <WebView
        originWhitelist={['*']}
        source={{ uri: htmlUri }}
        onMessage = {handleMessage}
      />
    ) : null;
  };
  export default RideOfferCreationScreen;