require('dotenv').config();

module.exports = {
    CLIENT_ID: process.env.EBAY_CLIENT_ID,
    CLIENT_SECRET: process.env.EBAY_CLIENT_SECRET,
    AUTH_URL: 'https://api.sandbox.ebay.com/identity/v1/oauth2/token',
    SCOPE: 'https://api.ebay.com/oauth/api_scope',
    EBAY_FINDING_API_URL: 'https://svcs.sandbox.ebay.com/services/search/FindingService/v1',  // eBay Finding API URL for searching listings
    
};