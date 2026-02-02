const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Log file will be created in the server root
const logFile = path.join(__dirname, '../install_log.txt');

function log(message) {
    const timestamp = new Date().toISOString();
    const msg = `[${timestamp}] ${message}\n`;
    console.log(msg.trim());
    try {
        fs.appendFileSync(logFile, msg);
    } catch (err) {
        console.error("Failed to write to log file:", err);
    }
}

log("--- STARTING DEPENDENCY INSTALLATION SCRIPT ---");
log(`Current Directory: ${process.cwd()}`);
log(`Script Directory: ${__dirname}`);
log(`Target Directory (Server Root): ${path.join(__dirname, '..')}`);

// 1. Check Node Version
log(`Node Version: ${process.version}`);

// 2. Run npm install in SERVER directory
log("Executing 'npm install --omit=dev' in SERVER directory...");

const installServer = exec('npm install --omit=dev', { 
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'production' }
});

installServer.stdout.on('data', (data) => {
    log(`[server npm stdout] ${data}`);
});

installServer.stderr.on('data', (data) => {
    log(`[server npm stderr] ${data}`);
});

installServer.on('close', (code) => {
    log(`Server npm install exited with code ${code}`);
    
    // 3. Run npm install in ROOT directory (for safety)
    log("Executing 'npm install' in ROOT directory...");
    const installRoot = exec('npm install', { 
        cwd: path.join(__dirname, '../../'),
        env: { ...process.env, NODE_ENV: 'production' }
    });
    
    installRoot.stdout.on('data', (data) => {
        log(`[root npm stdout] ${data}`);
    });
    
    installRoot.stderr.on('data', (data) => {
        log(`[root npm stderr] ${data}`);
    });

    installRoot.on('close', (rootCode) => {
         log(`Root npm install exited with code ${rootCode}`);
         if (code === 0 || rootCode === 0) {
            log("Installation commands finished.");
            verifyInstallation();
         } else {
            log("Installation commands FAILED.");
         }
         
         setTimeout(() => {
            log("Script finishing. You can now check install_log.txt");
            process.exit(code || rootCode);
        }, 2000);
    });
});

function verifyInstallation() {
    log("Verifying 'mysql2' installation...");
    try {
        const mysqlPath = require.resolve('mysql2', { paths: [path.join(__dirname, '..')] });
        log(`SUCCESS: mysql2 found at ${mysqlPath}`);
        
        // Try requiring it
        const mysql = require(mysqlPath);
        log("SUCCESS: mysql2 loaded successfully.");
        
        // Create a simple HTTP server so Hostinger sees the app as "Running" instead of crashing immediately
        startSuccessServer();
        
    } catch (err) {
        log(`FAILURE: Could not load mysql2. Error: ${err.message}`);
        log(`Require Stack: ${err.requireStack}`);
    }
}

function startSuccessServer() {
    const http = require('http');
    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Dependencies Installed Successfully! You can now revert your Startup File to index.js and restart the server.');
    });
    
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        log(`Temporary server listening on port ${port}. Access your site to verify success.`);
    });
}
