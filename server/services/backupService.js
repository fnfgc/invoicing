const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const cron = require('node-cron');
const masterDB = require('../master_db'); // Import Master DB to get tenant info

// Configuration
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const BACKUP_INTERVAL = '0 0 * * *'; // Every day at midnight
const BACKUP_FOLDER_ID = '1hKhv-xZ0pJA7HexCoHnEOF938MpyTZB9'; // User provided shared folder
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
        // Check if file exists before uploading
        if (!fs.existsSync(filePath)) {
            console.warn(`Backup skipped: File not found at ${filePath}`);
            return;
        }

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

        console.log(`Backup successful: ${fileName} (ID: ${res.data.id})`);
        return res.data.id;
    } catch (error) {
        console.error(`Backup failed for ${fileName}:`, error.message);
    }
};

/**
 * Sanitize filename
 */
const sanitizeFilename = (name) => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

/**
 * Run Full Backup Cycle (Master DB + All Tenant DBs)
 */
const runFullBackup = async () => {
    console.log('Starting Full Backup Cycle...');
    console.warn('Backup Service: MySQL backup is currently disabled in this environment.');
    // Future Implementation: Use mysqldump or SELECT INTO OUTFILE if permissions allow
    return;
};

/**
 * Start Backup Scheduler
 */
const startBackupService = () => {
    console.log(`Backup Service: Scheduled for ${BACKUP_INTERVAL}`);

    cron.schedule(BACKUP_INTERVAL, async () => {
        await runFullBackup();
    });
};

module.exports = {
    initGoogleDrive,
    uploadFile,
    startBackupService,
    runFullBackup
};
