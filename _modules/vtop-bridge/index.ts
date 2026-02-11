import { requireNativeModule } from 'expo-modules-core';

const VtopBridge = requireNativeModule('VtopBridge');

export async function vtopCall(username, password, semesterId = null) {
    const payload = JSON.stringify({
        username,
        password,
        semesterId
    });

    const resultJson = await VtopBridge.vtopCall(payload);
    return JSON.parse(resultJson);
}
