import { requireNativeModule } from 'expo-modules-core';

const getVtopBridge = () => {
    try {
        return requireNativeModule('VtopBridge');
    } catch (error) {
        return null;
    }
};

export async function vtopCall(username, password, semesterId = null) {
    const VtopBridge = getVtopBridge();
    if (!VtopBridge?.vtopCall) {
        throw new Error('Native module VtopBridge is unavailable in this runtime');
    }

    const payload = JSON.stringify({
        username,
        password,
        semesterId
    });

    const resultJson = await VtopBridge.vtopCall(payload);
    return JSON.parse(resultJson);
}
