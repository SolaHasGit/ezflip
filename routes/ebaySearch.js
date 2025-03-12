const express = require('express');
const axios = require('axios');
const { getAuthToken } = require('../services/ebayAuth');
const config = require('../config/ebayConfig');

const router = express.Router();

// Helper function to fetch active listings from the Buy API
async function fetchActiveDataFromEbay(query) {
    const token = await getAuthToken();
    const url = config.EBAY_REST_API_URL;

    const params = {
        q: query,
        limit: 100,
        filter: 'buyingOptions:{FIXED_PRICE},condition:{USED,NEW}'  // Filter for active listings (new or used)
    };

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            params,
        });

        return response.data.itemSummaries || [];
    } catch (error) {
        console.error('Error fetching active eBay data:', error.message);
        throw new Error('Error fetching active data from eBay');
    }
}

async function fetchSoldCompletedDataFromEbay(query) {
    const token = await getAuthToken();
    const url = 'https://svcs.sandbox.ebay.com/services/search/FindingService/v1';

    const params = {
        'OPERATION-NAME': 'findCompletedItems',
        'SERVICE-VERSION': '1.13.0',
        'SECURITY-APPNAME': config.CLIENT_ID,
        'keywords': query,
        'GLOBAL-ID': 'EBAY-US',
        'paginationInput.entriesPerPage': 100,
        'RESPONSE-DATA-FORMAT': 'JSON',
    };

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            params,
        });

        // Log the full response for inspection
        console.log('eBay Response:', response.data);
        const ack = response.data?.findCompletedItemsResponse?.[0]?.ack?.[0];
        if (ack !== 'Success') {
            console.error('eBay API request failed:', response.data);
            return [];
        }

        // Check if the response structure matches expectations
        const items = response.data?.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item || [];
        if (items.length === 0) {
            console.log('No completed (sold) items found.');
        }

        return items;
    } catch (error) {
        console.error('Error fetching sold completed eBay data:', error.message);
        console.error('Error details:', error.response ? error.response.data : error.message);
        throw new Error('Error fetching sold completed data from eBay');
    }
}


// Route to search on eBay
router.get('/', async (req, res) => {
    try {
        const query = req.query.query || 'iphone';

        // Active Listings
        const activeListings = await fetchActiveDataFromEbay(query);
        const activePrices = activeListings
            .map(item => parseFloat(item.price.value))
            .filter(price => !isNaN(price));

        const averageListedPrice = activePrices.length
            ? (activePrices.reduce((sum, price) => sum + price, 0) / activePrices.length).toFixed(2)
            : 0;

        const totalActiveListings = activeListings.length;

        // Sold Completed Listings (only sold items)
        const soldCompletedListings = await fetchSoldCompletedDataFromEbay(query);
        const soldCompletedPrices = soldCompletedListings
            .map(item => parseFloat(item.price.value))
            .filter(price => !isNaN(price));

        const averageSoldPrice = soldCompletedPrices.length
            ? (soldCompletedPrices.reduce((sum, price) => sum + price, 0) / soldCompletedPrices.length).toFixed(2)
            : 0;

        const totalSoldCompletedListings = soldCompletedListings.length;

        const sellThroughRate = (totalSoldCompletedListings / totalActiveListings).toFixed(2) * 100;

        // Send response with calculated data
        res.json({
            averageListedPrice,
            totalActiveListings,
            averageSoldPrice,
            totalSoldCompletedListings,
            sellThroughRate,
            activeListings,
            soldCompletedListings  
        });

    } catch (error) {
        console.error('Error in route:', error.message);
        res.status(500).json({ error: 'Failed to fetch data from eBay' });
    }
});

module.exports = router;
