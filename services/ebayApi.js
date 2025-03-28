const axios = require('axios');
const qs = require('qs');
const { getAuthToken } = require('./ebayAuth');
const config = require('../config/ebayConfig');

// Retry with exponential backoff
async function fetchWithRetry(url, params, token, retries = 5, backoffTime = 1000) {
    let attempt = 0;

    while (attempt < retries) {
        try {
            const response = await axios.get(url, {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`, // Pass token in the Authorization header
                    'Content-Type': 'application/json', // Set content type for eBay's Buy API
                },
            });

            // If request is successful, return the response
            return response;
        } catch (error) {
            // Handle rate limit errors (RateLimiter error code 10001)
            if (error.response && error.response.data.errorMessage[0].error[0].errorId[0] === '10001') {
                console.warn(`Rate limit exceeded, retrying in ${backoffTime}ms...`);

                // Wait for the backoff time before retrying
                await new Promise(resolve => setTimeout(resolve, backoffTime));

                // Exponentially increase the backoff time for retries
                backoffTime *= 2;
                attempt++;

                if (attempt === retries) {
                    console.error('Max retries reached. Could not fetch data.');
                    throw new Error('Max retries reached. Could not fetch data.');
                }
            } else {
                // If it's a different error, throw it
                console.error('Error fetching data:', error.message);
                throw error;
            }
        }
    }
}

// Fetch Active Listings Data from eBay (Buy API)
async function fetchActiveDataFromEbay(query) {
    const token = await getAuthToken();  // Get the auth token
    const url = config.EBAY_REST_API_URL;

    const params = {
        q: query,
        limit: 100,
        filter: 'buyingOptions:{FIXED_PRICE},condition:{USED,NEW}'  // Filter for active listings (new or used)
    };

    try {
        // Fetch data with retry mechanism and pass the token
        const response = await fetchWithRetry(url, params, token);

        if (!response.data.itemSummaries) {
            console.error('No item summaries found in the response');
            return [];
        }
        
        const totalItems = response.data.total;
        console.log(`Total active listings found: ${totalItems}`);

        return { total: totalItems, items: response.data.itemSummaries || [] };
    } catch (error) {
        console.error('Error fetching active eBay data:', error.message);
        throw new Error('Error fetching active data from eBay');
    }
}

// Fetch Sold Completed Listings Data from eBay (FindingService)
async function fetchSoldCompletedDataFromEbay(query) {
    const url = "https://svcs.ebay.com/services/search/FindingService/v1";

    const params = {
        "OPERATION-NAME": "findCompletedItems",
        "SERVICE-VERSION": "1.13.0",
        "SECURITY-APPNAME": config.CLIENT_ID, // eBay App ID
        "GLOBAL-ID": "EBAY-US",
        "keywords": query,
        "paginationInput.entriesPerPage": 1,
        "RESPONSE-DATA-FORMAT": "JSON",
        "itemFilter(0).name": "SoldItemsOnly",
        "itemFilter(0).value": "true",
    };

    try {
        // Fetch data with retry mechanism
        const response = await fetchWithRetry(url, params);

        const ack = response.data?.findCompletedItemsResponse?.[0]?.ack?.[0];
        if (ack !== "Success") {
            console.error("eBay API request failed:", response.data);
            return [];
        }

        const items = response.data?.findCompletedItemsResponse?.[0]?.searchResult?.[0]?.item || [];
        return items;
    } catch (error) {
        console.error("Error fetching sold completed eBay data:", error.message);
        throw new Error("Error fetching sold completed data from eBay");
    }
}

// Route to search on eBay
async function getEbayData(query = "iphone") {
    try {
        // Active Listings
        const activeData = await fetchActiveDataFromEbay(query);
        const activeListings = activeData.items; 
        const totalActiveListings = activeData.total;
        const activePrices = activeListings
            .map(item => parseFloat(item.price.value))
            .filter(price => !isNaN(price));

        const averageListedPrice = activePrices.length
            ? (activePrices.reduce((sum, price) => sum + price, 0) / activePrices.length).toFixed(2)
            : 0;

        // Sold Completed Listings (only sold items)
        /*
        const soldCompletedListings = await fetchSoldCompletedDataFromEbay(query);
        const soldCompletedPrices = soldCompletedListings
            .map(item => parseFloat(item.sellingStatus[0].currentPrice[0].__value__))
            .filter(price => !isNaN(price));

        const averageSoldPrice = soldCompletedPrices.length
            ? (soldCompletedPrices.reduce((sum, price) => sum + price, 0) / soldCompletedPrices.length).toFixed(2)
            : 0;

        const totalSoldCompletedListings = soldCompletedListings.length;

        // Corrected sell-through rate calculation
        const sellThroughRate = totalActiveListings > 0 
            ? parseFloat((totalSoldCompletedListings / totalActiveListings) * 100).toFixed(2)
            : 0;
        */
        // Return results
        return {
            averageListedPrice,
            totalActiveListings,
            //averageSoldPrice,
            //totalSoldCompletedListings,
            //sellThroughRate,
            activeListings
        };
    } catch (error) {
        console.error("Error in route:", error.message);
        throw new Error("Failed to fetch data from eBay");
    }
}

module.exports = { getEbayData };
