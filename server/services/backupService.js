const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const cron = require('node-cron');

// Configuration
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const BACKUP_INTERVAL = '0 0 * * *'; // Every day at midnight
// const BACKUP_INTERVAL = '*/5 * * * *'; // Every 5 minutes (for testing)

let driveClient = null;

/**
 * Initialize Google Drive Client
 * Requires credentials.json in the server root or specified via env var
 */
const initGoogleDrive = () => {
    try {
        const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || path.join(__dirname, '../google-credentials.json');
        
        if (!fs.existsSync(credentialsPath)) {
            console.log('Google Drive Backup: No credentials file found. Skipping initialization.');
            return null;
        }

        const auth = new google.auth.GoogleAuth({
            keyFile: credentialsPath,
            scopes: SCOPES,
        });

        driveClient = google.drive({ version: 'v3', auth });
        console.log('Google Drive Backup: Client initialized successfully.');
        return driveClient;
    } catch (error) {
        console.error('Google Drive Backup: Initialization failed.', error.message);
        return null;
    }
};

/**
 * Upload File to Google Drive
 * @param {string} filePath - Absolute path to the file
 * @param {string} fileName - Name to display in Drive
 * @param {string} mimeType - MIME type of the file
 */
const uploadFile = async (filePath, fileName, mimeType = 'application/x-sqlite3') => {
    if (!driveClient) {
        driveClient = initGoogleDrive();
        if (!driveClient) return;
    }

    try {
        const fileMetadata = {
            name: fileName,
            parents: [BACKUP_FOLDER_ID] 
        };
        const media = {
            mimeType: mimeType,
            body: fs.createReadStream(filePath),
        };

        const res = await driveClient.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });

        console.log('Backup successful. File Id:', res.data.id);
        return res.data.id;
    } catch (error) {
        console.error('Backup failed:', error.message);
    }
};

/**
 * Start Backup Scheduler
 * @param {string} dbPath - Path to the database file
 */
const startBackupService = (dbPath) => {
    if (!dbPath) return;

    console.log(`Backup Service: Scheduled for ${BACKUP_INTERVAL}`);

    cron.schedule(BACKUP_INTERVAL, async () => {
        console.log('Running scheduled backup...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup_pos_${timestamp}.db`;
        await uploadFile(dbPath, fileName);
    });
};

module.exports = {
    initGoogleDrive,
    uploadFile,
    startBackupService
};
