import React, { useState, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';

const App = () => {
  const [htmlUri, setHtmlUri] = useState<string | null>('');

  useEffect(() => {
    (async () => {
      const asset = Asset.fromModule(require('../assets/templates/home.html'));
      await asset.downloadAsync();  // This ensures the asset is downloaded locally
      setHtmlUri(asset.localUri || null);
    })();
  }, []);

  return htmlUri ? (
    <WebView
      originWhitelist={['*']}
      source={{ uri: htmlUri }}
    />
  ) : null;
};

export default App;