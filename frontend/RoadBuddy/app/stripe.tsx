// stripe.tsx
import React, { useState } from 'react';
import { View, Button, Alert, StyleSheet, Text } from 'react-native';
import { StripeProvider, CardField, useStripe } from '@stripe/stripe-react-native';

const InnerStripeComponent = () => {
  const { createToken } = useStripe();
  const [tokenId, setTokenId] = useState<string | null>(null);

  const handleCreateToken = async () => {
    // Create a token using the card details entered in CardField
    const { token, error } = await createToken({ type: 'Card' });
    if (error) {
      Alert.alert('Error', error.message);
    } else if (token) {
      setTokenId(token.id);
      Alert.alert('Token Created', token.id);
			console.log(token.id)
    }
  };

  return (
    <View style={styles.container}>
      <CardField
        postalCodeEnabled={true}
        placeholder={{ number: '4242 4242 4242 4242' }}
        cardStyle={styles.card}
        style={styles.cardContainer}
        onCardChange={(cardDetails) => {
          console.log('Card details', cardDetails);
        }}
      />
      <Button title="Get Token" onPress={handleCreateToken} />
      {tokenId && <Text style={styles.tokenText}>Token: {tokenId}</Text>}
    </View>
  );
};

// Main export that wraps the component with StripeProvider and includes your public key
export default function StripeToken() {
  return (
    <StripeProvider publishableKey="pk_test_51MjBbNDiM3EAos9ocETiK2jsHzePLkUvL95YrsEwpCgThRFn4EI0eFyNl55l7jsJzEHoHbGXOyfDm9HYTLKLsKHw00jukt7PIy">
      <InnerStripeComponent />
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  cardContainer: {
    height: 50,
    marginVertical: 30,
  },
  card: {
    backgroundColor: '#fff',
    textColor: '#000',
  },
  tokenText: {
    marginTop: 20,
    fontSize: 16,
  },
});