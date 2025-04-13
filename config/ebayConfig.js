require('dotenv').config();

module.exports = {
    CLIENT_ID: process.env.EBAY_CLIENT_ID,
    CLIENT_SECRET: process.env.EBAY_CLIENT_SECRET,
    AUTH_URL: 'https://api.ebay.com/identity/v1/oauth2/token',
    SCOPE: 'https://api.ebay.com/oauth/api_scope',
    EBAY_REST_API_URL: 'https://api.ebay.com/buy/browse/v1/item_summary/search',  // eBay RESTful API URL for listings

    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SECRET_KEY,
};