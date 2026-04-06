import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import { toastConfig } from './src/utils/toastConfig';
import { COLORS } from './src/utils/theme';

export default function App() {
  const [NavigatorComponent, setNavigatorComponent] = useState(null);
  const [bootError, setBootError] = useState(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }

    viewport.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover');

    document.documentElement.style.height = '100%';
    document.documentElement.style.backgroundColor = COLORS.bg;
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overscrollBehaviorY = 'contain';
    document.body.style.touchAction = 'manipulation';
    document.body.style.backgroundColor = COLORS.bg;

    const root = document.getElementById('root');
    if (root) {
      root.style.height = '100%';
      root.style.backgroundColor = COLORS.bg;
    }
  }, []);

  useEffect(() => {
    try {
      if (Platform.OS === 'web') {
        const module = require('./src/navigation/WebNavigator');
        setNavigatorComponent(() => module.WebNavigator || module.default);
      } else {
        const module = require('./src/navigation/AppNavigator');
        setNavigatorComponent(() => module.AppNavigator);
      }
    } catch (error) {
      setBootError(error);
    }
  }, []);

  if (bootError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#ffffff' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#111111' }}>App startup error</Text>
        <Text style={{ fontSize: 14, color: '#333333' }}>
          {String(bootError?.message || bootError)}
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <StatusBar style="light" />
            {NavigatorComponent ? (
              <NavigatorComponent />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Platform.OS === 'web' ? '#ffffff' : COLORS.bg }}>
                <ActivityIndicator size="large" color={Platform.OS === 'web' ? '#111111' : COLORS.primary} />
                <Text style={{ marginTop: 12, color: Platform.OS === 'web' ? '#222222' : COLORS.textSecondary }}>
                  Loading app...
                </Text>
              </View>
            )}
            <Toast config={toastConfig} />
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
