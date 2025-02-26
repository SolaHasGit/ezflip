const axios = require('axios');
const qs = require('qs');
const config = require('../config/ebayConfig');

let cachedToken = null;
let tokenExpiration = 0; 

async function getAuthToken() {
    // Use cached token if still valid
    if (cachedToken && Date.now() < tokenExpiration) {
        console.log('Using cached token');
        return cachedToken;
    }

    else{
       console.log('Fetching new token...'); 
    }
    
    const authString = Buffer.from(`${config.CLIENT_ID}:${config.CLIENT_SECRET}`).toString('base64');
    
    try {
        const response = await axios.post(
            config.AUTH_URL,
            qs.stringify({ grant_type: 'client_credentials', scope: config.SCOPE }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${authString}`,
                },
            }
        );

        cachedToken = response.data.access_token;
        tokenExpiration = Date.now() + response.data.expires_in * 1000; 

        console.log('Token acquired, expires at:', new Date(tokenExpiration));
        return cachedToken;
    } catch (error) {
        console.error('Error getting eBay auth token:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = { getAuthToken };