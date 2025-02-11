import React, { useState, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    createStaticNavigation,
    ParamListBase,
    useNavigation,
  } from '@react-navigation/native';

function SignupScreen() {
    const [htmlUri, setHtmlUri] = useState<string | null>('');
    const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
    function handleMessage(event: { nativeEvent: { data: any; }; }){
            const message = event.nativeEvent.data;
            switch (message) {
                case 'navigateHome':
                  // Handle navigation or other actions here
                  navigation.navigate('Home');
                  break;
                default:
                  console.log('Received message:', message);
              }
        }
    useEffect(() => {
      (async () => {
        const asset = Asset.fromModule(require('../assets/templates/signup.html'));
        await asset.downloadAsync();  // This ensures the asset is downloaded locally
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
  export default SignupScreen;