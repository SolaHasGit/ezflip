const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

const isRender = process.env.RENDER === 'true';
const credentialsPath = isRender
  ? '/etc/secrets/googleCredentials.json'
  : path.join(__dirname, '../googleSheetsCredentials.json');

// Config flag to toggle between service account and OAuth (for future transitions)
const useServiceAccount = process.env.USE_SERVICE_ACCOUNT === 'true';

// Google Sheets API initialization (common for both service account and OAuth)
async function authenticateGoogleSheets() {
    const auth = useServiceAccount
        ? new google.auth.GoogleAuth({
              keyFile: credentialsPath,
              scopes: ['https://www.googleapis.com/auth/spreadsheets'],
          })
        : new google.auth.OAuth2(
              process.env.GOOGLE_CLIENT_ID,
              process.env.GOOGLE_CLIENT_SECRET,
              process.env.GOOGLE_REDIRECT_URI
          ); // OAuth2 credentials

    const client = await auth.getClient();
    return client;
}

// Function to get the last row number from the Google Sheet, starting from row 3
async function getLastRow() {
    const authClient = await authenticateGoogleSheets();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const spreadsheetId = process.env.SPREADSHEET_ID;  // Use the environment variable for the sheet ID
    const range = 'Sheet1!A:A';  // Get column A to determine the last row

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    // Find the last row with data in column A, but skip the first two rows
    const lastRow = response.data.values ? response.data.values.length + 1 : 3;  // Start from row 3 if no data exists
    return lastRow;
}

// Function to append data to the Google Sheet starting from row 3
async function appendDataToSheet(newData) {
    const authClient = await authenticateGoogleSheets();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const spreadsheetId = process.env.SPREADSHEET_ID;  // Use the environment variable for the sheet ID

    // Get the last row to append data after it
    const lastRow = await getLastRow();
    
    // Define the range where to append data (starting from row 3)
    const range = `Sheet1!A${lastRow}`;  // Start appending from the next available row

    const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        resource: { values: newData },
    });

    return response.data;
}

// Function to get specific data from the Google Sheet (e.g., G2:H2)
async function getSheetData() {
    const authClient = await authenticateGoogleSheets();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const spreadsheetId = process.env.SPREADSHEET_ID;  // Use the environment variable for the sheet ID
    const range = 'Sheet1!G2:H2';  // Specify the range of the cells you want to fetch

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    return response.data.values;  // This will return an array of values from G2:H2
}

// Function to parse CSV file and get data as an array
async function parseCSV(filePath) {
    const results = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                results.push(Object.values(row));  // Convert each row object to an array of values
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

module.exports = { appendDataToSheet, getSheetData, parseCSV };
