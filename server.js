require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const { getAuthToken } = require('./services/ebayAuth');  
const path = require('path');

const ebayImageSearchRoutes = require('./routes/ebaySearchByImage');
const ebaySearchRoutes = require('./routes/ebaySearch');  
const authRoutes = require('./routes/supabaseRoute');
const inventoryRoutes = require('./routes/inventoryRoute'); 

const app = express();
const PORT = process.env.PORT || 3000;  

// Middleware
app.use(cors());  
app.use(express.json());  


// Test route for eBay Auth token
app.get('/test-ebay-auth', async (req, res) => {
    try {
        const token = await getAuthToken();
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get token' });
    }
});

// Searching for listings by keyword
app.use('/api/search', ebaySearchRoutes);  

// Searching for listings by image
app.use('/api', ebayImageSearchRoutes);

// 🔹 Supabase Auth
app.use('/auth', authRoutes);

app.use('/inventory', inventoryRoutes);  

// Optional root route for quick health check
app.get('/', (req, res) => {
  res.send('ezflip server is up and running!');
});


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));