import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const saveCredentials = async (credentials) => {
    try {
        await SecureStore.setItemAsync('vtop_credentials', JSON.stringify(credentials));
    } catch (e) { }
};

export const getCredentials = async () => {
    try {
        const creds = await SecureStore.getItemAsync('vtop_credentials');
        return creds ? JSON.parse(creds) : null;
    } catch (e) {
        return null;
    }
};

export const saveData = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) { }
};

export const getData = async (key) => {
    try {
        const val = await AsyncStorage.getItem(key);
        return val ? JSON.parse(val) : null;
    } catch (e) {
        return null;
    }
};

export const clearAll = async () => {
    try {
        await SecureStore.deleteItemAsync('vtop_credentials');
        await AsyncStorage.clear();
    } catch (e) { }
};
