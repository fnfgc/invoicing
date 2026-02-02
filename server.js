// Entry point for Hostinger deployment to avoid path issues
const http = require('http');

try {
    const { startServer } = require('./server/index.js');
    startServer();
} catch (err) {
    console.error("CRITICAL: Failed to start server/index.js", err);
    
    // Fallback if even the require fails (e.g. syntax error or missing dependency)
    const server = http.createServer((req, res) => {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`
            <html>
            <body style="font-family: sans-serif; padding: 50px; text-align: center;">
                <h1>500 Critical Startup Error</h1>
                <p>The application failed to load the main server file.</p>
                <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 5px; text-align: left; display: inline-block;">
                    <strong>Error:</strong>
                    <pre>${err.message}</pre>
                    <pre>${err.stack}</pre>
                </div>
            </body>
            </html>
        `);
    });
    
    server.listen(process.env.PORT || 3000, () => {
        console.log("Emergency fallback server running");
    });
}
