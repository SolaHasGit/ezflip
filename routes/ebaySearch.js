const express = require('express');
const axios = require('axios');
const { getAuthToken } = require('../services/ebayAuth');
const config = require('../config/ebayConfig');

const router = express.Router();

// Route to search on eBay, default to iphone search
router.get('/', async (req, res) => {
    try {
        // Get eBay Auth Token
        const token = await getAuthToken();

        // Set up the search query 
        const query = req.query.query||'iphone'; // 

        // Make a request to the eBay Finding API
        const response = await axios.get(config.EBAY_FINDING_API_URL, {
            headers: {
                'X-EBAY-SOA-SECURITY-APPNAME': config.CLIENT_ID,  
                'Authorization': `Bearer ${token}`,  
            },
            params: {
                'OPERATION-NAME': 'findItemsByKeywords',
                'SERVICE-VERSION': '1.13.0',
                'SECURITY-APPNAME': config.CLIENT_ID,
                'keywords': query,  
                'GLOBAL-ID': 'EBAY-US',
                'paginationInput.entriesPerPage': 10,  // Number of items per page
                'RESPONSE-DATA-FORMAT': 'JSON',  // Response format
            },
        });

        console.log(response.data);
        
        res.json(response.data);

    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({ error: 'Error fetching listings from eBay' });
    }
});

module.exports = router;