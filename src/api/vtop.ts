import axios from 'axios';
import { NativeModules } from 'react-native';

// -------------------------------------------------------------------------
// CONFIGURATION
// -------------------------------------------------------------------------
const LOCAL_IP = '172.18.172.70';

const getMetroHost = () => {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (!scriptURL) return null;

    try {
        return new URL(scriptURL).hostname;
    } catch (_) {
        return null;
    }
};

const getBaseUrls = () => {
    const envHost = process.env.REACT_NATIVE_PACKAGER_HOSTNAME || null;
    const metroHost = getMetroHost();

    const hosts = [metroHost, envHost, LOCAL_IP].filter(Boolean);
    const uniqueHosts = [...new Set(hosts)];

    return uniqueHosts.map((host) => `http://${host}:3001`);
};

let bridgeModule = null;

const getBridgeModule = () => {
    if (bridgeModule) return bridgeModule;
    try {
        bridgeModule = require('../../_modules/vtop-bridge');
        return bridgeModule;
    } catch (error) {
        console.warn('⚠️ Native bridge unavailable in this runtime, using HTTP fallback.');
        return null;
    }
};

export const vtopLogin = async (credentials) => {
    const vtopBridge = getBridgeModule();
    if (vtopBridge?.vtopCall) {
        try {
            console.log("🚀 Attempting Native Rust Bridge login...");
            const result = await vtopBridge.vtopCall(
                credentials.username,
                credentials.password,
                credentials.semesterId ?? null
            );

            if (result && result.success) {
                console.log("✅ Native Bridge Success!");
                return result;
            }

            console.log("⚠️ Native Bridge returned failure, trying HTTP fallback...");
        } catch (nativeError) {
            console.warn("⚠️ Native Bridge call failed:", nativeError.message);
        }
    }

    // Fallback to HTTP (Expo Go path)
    const baseUrls = getBaseUrls();
    let lastNetworkError = null;

    for (const baseUrl of baseUrls) {
        try {
            console.log(`📡 Connecting to Laptop Backend: ${baseUrl}/api/vtop-login`);
            const response = await axios.post(`${baseUrl}/api/vtop-login`, credentials, {
                timeout: 60000
            });
            return response.data;
        } catch (error) {
            const status = error?.response?.status;
            const errorBody = error?.response?.data;

            if (status === 401) {
                const serverMessage = errorBody?.error || 'Login failed';
                const details = errorBody?.details ? ` (${errorBody.details})` : '';
                return {
                    success: false,
                    error: `${serverMessage}${details}`
                };
            }

            if (status && status >= 400 && status < 500) {
                return {
                    success: false,
                    error: errorBody?.error || `Request failed (${status})`
                };
            }

            if (status && status >= 500) {
                const rawMessage = errorBody?.details || errorBody?.error || `VTOP service error (${status})`;
                const normalized = String(rawMessage || '').toLowerCase();
                const message = normalized.includes('network connection error')
                    ? 'VTOP auto-login upstream failed (captcha/network stage). Please retry in a minute; if it persists, VTOP automation path is unavailable right now.'
                    : rawMessage;
                return {
                    success: false,
                    error: message
                };
            }

            lastNetworkError = error;
        }
    }

    {
        const error = lastNetworkError;
        const status = error?.response?.status;
        const errorBody = error?.response?.data;

        if (status === 401) {
            const serverMessage = errorBody?.error || 'Login failed';
            const details = errorBody?.details ? ` (${errorBody.details})` : '';
            return {
                success: false,
                error: `${serverMessage}${details}`
            };
        }

        if (status && status >= 400 && status < 500) {
            return {
                success: false,
                error: errorBody?.error || `Request failed (${status})`
            };
        }

        if (status && status >= 500) {
            const rawMessage = errorBody?.details || errorBody?.error || `VTOP service error (${status})`;
            const normalized = String(rawMessage || '').toLowerCase();
            const message = normalized.includes('network connection error')
                ? 'VTOP auto-login upstream failed (captcha/network stage). Please retry in a minute; if it persists, VTOP automation path is unavailable right now.'
                : rawMessage;
            return {
                success: false,
                error: message
            };
        }

        console.error('❌ Backend Connection Failed:', error.message);
        return {
            success: false,
            error: `Could not reach local backend on: ${baseUrls.join(', ')}. Ensure Rust server is running and Windows firewall allows port 3001.`
        };
    }
};
