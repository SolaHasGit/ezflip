const express = require('express');
const { getEbayData } = require('../services/ebayApi'); // Import the function that fetches data
const router = express.Router();

// Route to handle eBay search
router.get("/", async (req, res) => {
    try {
        const query = req.query.query || "iphone"; // Default search query is 'iphone'

        // Fetch eBay data (active listings, sold completed listings, etc.)
        const ebayData = await getEbayData(query);

        // Send the response with the data
        res.json(ebayData);
    } catch (error) {
        console.error("Error in ebaySearch route:", error.message);
        res.status(500).json({ error: "Failed to fetch data from eBay" });
    }
});

module.exports = router;
