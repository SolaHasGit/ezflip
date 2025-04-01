const express = require('express');
const multer = require('multer');  // Import multer for file uploads
const path = require('path');     // Import path to handle file paths
const fs = require('fs');         // Import fs for file cleanup
const { getSheetData, appendDataToSheet, parseCSV } = require('../services/googleSheetsService');

const router = express.Router();

// Configure file storage for CSV uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');  // Store files in the 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Add timestamp to filenames
    }
});

const upload = multer({ storage });  // Initialize multer with the storage configuration

// Route to get data from the Google Sheet (G2:H2)
router.get('/get-sheet-data', async (req, res) => {
    try {
        const sheetData = await getSheetData();
        res.status(200).json({ data: sheetData });
    } catch (error) {
        console.error('Error fetching sheet data:', error);
        res.status(500).json({ error: 'Failed to fetch sheet data.' });
    }
});

// Route to upload and process CSV
router.post('/upload-csv', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const filePath = path.join(__dirname, '../uploads', req.file.filename);

        // Parse the CSV file
        const csvData = await parseCSV(filePath);

        // Append the parsed CSV data to Google Sheets
        const appendResponse = await appendDataToSheet(csvData);

        // Delete the temporary file after processing
        try {
            fs.unlinkSync(filePath);  // Ensure the uploaded file is deleted
        } catch (err) {
            console.error('Error deleting file:', err);
        }

        res.status(200).json({ message: 'CSV data uploaded and appended to sheet successfully!', data: appendResponse });
    } catch (error) {
        console.error('Error uploading CSV:', error);
        res.status(500).json({ error: 'Failed to upload and append CSV data.' });
    }
});

module.exports = router;
