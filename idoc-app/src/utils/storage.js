import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// expo-secure-store is native-only; use localStorage on web
const secureStoreAvailable = () => (
  typeof SecureStore?.getItemAsync === 'function'
  && typeof SecureStore?.setItemAsync === 'function'
  && typeof SecureStore?.deleteItemAsync === 'function'
);

const storage = {
  async getItem(key) {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }

    if (!secureStoreAvailable()) {
      return AsyncStorage.getItem(key);
    }

    try {
      return await SecureStore.getItemAsync(key);
    } catch (_) {
      return AsyncStorage.getItem(key);
    }
  },

  async setItem(key, value) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }

    if (!secureStoreAvailable()) {
      return AsyncStorage.setItem(key, value);
    }

    try {
      return await SecureStore.setItemAsync(key, value);
    } catch (_) {
      return AsyncStorage.setItem(key, value);
    }
  },

  async deleteItem(key) {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }

    if (!secureStoreAvailable()) {
      return AsyncStorage.removeItem(key);
    }

    try {
      return await SecureStore.deleteItemAsync(key);
    } catch (_) {
      return AsyncStorage.removeItem(key);
    }
  },
};

export default storage;
