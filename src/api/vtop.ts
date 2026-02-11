import axios from 'axios';
import * as VtopBridge from '../../_modules/vtop-bridge';

// -------------------------------------------------------------------------
// CONFIGURATION
// -------------------------------------------------------------------------
const LOCAL_IP = '172.18.173.123';
const BASE_URL = `http://${LOCAL_IP}:3001`;

export const vtopLogin = async (credentials) => {
    try {
        console.log("🚀 Attempting Native Rust Bridge login...");
        // Try the native bridge first (works offline/anywhere)
        const result = await VtopBridge.vtopCall(
            credentials.username,
            credentials.password
        );

        if (result && result.success) {
            console.log("✅ Native Bridge Success!");
            return result;
        }

        console.log("⚠️ Native Bridge returned failure or is unavailable, trying HTTP fallback...");
    } catch (nativeError) {
        console.warn("⚠️ Native Bridge call failed:", nativeError.message);
    }

    // Fallback to HTTP (your existing logic)
    try {
        console.log(`📡 Connecting to Laptop Backend: ${BASE_URL}/api/vtop-login`);
        const response = await axios.post(`${BASE_URL}/api/vtop-login`, credentials, {
            timeout: 60000
        });
        return response.data;
    } catch (error) {
        console.error('❌ Backend Connection Failed:', error.message);
        return {
            success: false,
            error: 'Could not reach local backend. Ensure "cargo run" is active OR the Native Bridge is correctly built into your APK.'
        };
    }
};
