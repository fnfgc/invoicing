const { app, BrowserWindow } = require('electron');
const path = require('path');

// Set Environment Variables for Server
process.env.IS_ELECTRON = 'true';
process.env.PORT = '5000';
process.env.USER_DATA_PATH = app.getPath('userData');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: "FNF Group POS",
    icon: path.join(__dirname, 'icon.png') // Use icon.png if available
  });

  // Start Server
  try {
      const { startServer } = require('./server/index.js');
      startServer(5000);
  } catch (err) {
      console.error("Failed to start server:", err);
  }

  // Load the app via localhost
  // Retry loading if server takes time
  const loadApp = () => {
      mainWindow.loadURL('http://localhost:5000').catch(() => {
          setTimeout(loadApp, 1000);
      });
  };
  
  // Initial delay to let express start
  setTimeout(loadApp, 1000);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

