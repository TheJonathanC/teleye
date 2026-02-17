const { app, BrowserWindow, globalShortcut, screen, ipcMain } = require('electron');
const path = require('path');

let mainWindow = null;
let interactionMode = false;

function createWindow() {
    // Get primary display dimensions
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth } = primaryDisplay.workAreaSize;

    // Create frameless, transparent, always-on-top window
    mainWindow = new BrowserWindow({
        width: 800,
        height: 150,
        x: Math.floor((screenWidth - 800) / 2), // Center horizontally
        y: 0, // Top of screen
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // Start with click-through enabled (interaction mode OFF)
    mainWindow.setIgnoreMouseEvents(true, { forward: true });

    // Load the HTML file
    mainWindow.loadFile('index.html');

    // Open DevTools in development mode
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    // Register global shortcuts
    globalShortcut.register('CommandOrControl+Shift+L', () => {
        if (mainWindow) {
            interactionMode = !interactionMode;
            mainWindow.setIgnoreMouseEvents(!interactionMode, { forward: true });
            mainWindow.webContents.send('interaction-mode-changed', interactionMode);
            console.log(`Interaction mode: ${interactionMode ? 'ON' : 'OFF'}`);
        }
    });

    globalShortcut.register('CommandOrControl+Shift+Space', () => {
        if (mainWindow) {
            mainWindow.webContents.send('toggle-play-pause');
            console.log('Play/Pause toggled');
        }
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('will-quit', () => {
    // Unregister all shortcuts
    globalShortcut.unregisterAll();
});

// IPC handlers
ipcMain.on('get-interaction-mode', (event) => {
    event.reply('interaction-mode-changed', interactionMode);
});
