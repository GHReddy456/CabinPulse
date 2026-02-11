import axios from 'axios';

// -------------------------------------------------------------------------
// CONFIGURATION
// -------------------------------------------------------------------------
// PRODUCTION: Use your Render/Vercel URL
// LOCAL: Use your computer's IP (from ipconfig) so your phone can connect
// -------------------------------------------------------------------------
const LOCAL_IP = '172.18.173.123';
const BASE_URL = `http://${LOCAL_IP}:3001`;

export const vtopLogin = async (credentials) => {
    try {
        console.log(`📡 Connecting to Backend: ${BASE_URL}/api/vtop-login`);

        const response = await axios.post(`${BASE_URL}/api/vtop-login`, credentials, {
            timeout: 60000 // 60 seconds (VTOP can be slow)
        });

        return response.data;
    } catch (error) {
        console.error('❌ Backend Connection Failed:', error.message);
        return {
            success: false,
            error: 'Could not reach local backend. Ensure "cargo run" is active and phone is on same WiFi.'
        };
    }
};
