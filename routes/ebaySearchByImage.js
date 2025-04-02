const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getEbayImageSearch } = require('../services/ebayApi');

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Temporary upload folder

router.post('/image-search', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required.' });
        }

        const imagePath = path.join(__dirname, '..', req.file.path);
        const imageBase64 = fs.readFileSync(imagePath, 'base64');

        const ebayData = await getEbayImageSearch(imageBase64);

        fs.unlinkSync(imagePath); // Clean up temporary file

        res.json(ebayData);
    } catch (error) {
        console.error('Error in image-search route:', error.message);
        res.status(500).json({ error: 'Failed to perform image search' });
    }
});

module.exports = router;