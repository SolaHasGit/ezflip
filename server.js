require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const ebaySearchRouter = require('./routes/ebaySearch');  
const { getAuthToken } = require('./services/ebayAuth');  

const googleSheetsRouter = require('./routes/googleSheetsRoute');

const app = express();
const PORT = process.env.PORT || 3000;  

// Middleware
app.use(cors());  // Enable Cross-Origin Resource Sharing (CORS) if needed
app.use(express.json());  // Parse incoming JSON requests

// Test route for eBay Auth token
app.get('/test-ebay-auth', async (req, res) => {
    try {
        const token = await getAuthToken();
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get token' });
    }
});

// Searching for listings routes
app.use('/api/search', ebaySearchRouter);  

// Google Sheets Routes
app.use('/api/sheets', googleSheetsRouter);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));