import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/auth';
import { CartProvider } from '../src/cart';
import { api } from '../src/api';
import { colors } from '../src/theme';

export default function RootLayout() {
  // Load the Stripe publishable key from the backend at launch so the same
  // server config drives both web and mobile.
  const [publishableKey, setPublishableKey] = useState('');

  useEffect(() => {
    api.config()
      .then((c) => setPublishableKey(c.publishableKey || ''))
      .catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={publishableKey} merchantIdentifier="merchant.com.merchly.app">
        <AuthProvider>
          <CartProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: '700' },
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ title: 'Log in', presentation: 'modal' }} />
              <Stack.Screen name="register" options={{ title: 'Create account', presentation: 'modal' }} />
              <Stack.Screen name="product/[id]" options={{ title: '' }} />
              <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
            </Stack>
          </CartProvider>
        </AuthProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
