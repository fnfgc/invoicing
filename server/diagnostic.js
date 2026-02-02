const http = require('http');
const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config(); // Fallback

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200, { 'Content-Type': 'text/html' });

    let output = `
    <html>
    <body style="font-family: monospace; padding: 20px;">
        <h1>Diagnostic Tool</h1>
        <h3>Environment Variables:</h3>
        <ul>
            <li>DB_HOST: ${process.env.DB_HOST}</li>
            <li>DB_USER: ${process.env.DB_USER}</li>
            <li>DB_MASTER_NAME: ${process.env.DB_MASTER_NAME}</li>
            <li>PORT: ${PORT}</li>
        </ul>
        <h3>Connection Test:</h3>
    `;

    try {
        const connection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_MASTER_NAME
        });

        connection.connect((err) => {
            if (err) {
                output += `<div style="color: red; font-weight: bold;">FAILED: ${err.message}</div>`;
                output += `<pre>${JSON.stringify(err, null, 2)}</pre>`;
            } else {
                output += `<div style="color: green; font-weight: bold;">SUCCESS! Connected to MySQL.</div>`;
                connection.end();
            }
            output += `</body></html>`;
            res.end(output);
        });
    } catch (e) {
        output += `<div style="color: red;">CRITICAL EXCEPTION: ${e.message}</div>`;
        output += `</body></html>`;
        res.end(output);
    }
});

server.listen(PORT, () => {
    console.log(`Diagnostic server running on port ${PORT}`);
});
