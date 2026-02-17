const { app, BrowserWindow, globalShortcut, screen, ipcMain } = require('electron');
const path = require('path');

let dashboardWindow = null;
let teleprompterWindow = null;
let interactionMode = false;
let teleprompterData = {
    script: '',
    speed: 1.0
};

function createDashboard() {
    dashboardWindow = new BrowserWindow({
        width: 800,
        height: 700,
        center: true,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        titleBarStyle: 'hiddenInset', // macOS style
        backgroundColor: '#f5f7fa',
    });

    dashboardWindow.loadFile('dashboard.html');

    dashboardWindow.on('closed', () => {
        dashboardWindow = null;
        if (teleprompterWindow) {
            teleprompterWindow.close();
        }
    });
}

function createTeleprompter() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth } = primaryDisplay.workAreaSize;

    teleprompterWindow = new BrowserWindow({
        width: 800,
        height: 150,
        x: Math.floor((screenWidth - 800) / 2),
        y: 0,
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

    teleprompterWindow.setIgnoreMouseEvents(true, { forward: true });
    teleprompterWindow.loadFile('index.html');

    // Send script data once loaded
    teleprompterWindow.webContents.on('did-finish-load', () => {
        teleprompterWindow.webContents.send('init-teleprompter', teleprompterData);
    });

    teleprompterWindow.on('closed', () => {
        teleprompterWindow = null;
        interactionMode = false;
        globalShortcut.unregisterAll();
        if (dashboardWindow) {
            dashboardWindow.show();
        }
    });

    // Hide dashboard
    if (dashboardWindow) {
        dashboardWindow.hide();
    }

    // Register shortcuts
    registerTeleprompterShortcuts();
}

function registerTeleprompterShortcuts() {
    globalShortcut.register('CommandOrControl+Shift+L', () => {
        if (teleprompterWindow) {
            interactionMode = !interactionMode;
            teleprompterWindow.setIgnoreMouseEvents(!interactionMode, { forward: true });
            teleprompterWindow.webContents.send('interaction-mode-changed', interactionMode);
        }
    });

    globalShortcut.register('CommandOrControl+Shift+Space', () => {
        if (teleprompterWindow) {
            teleprompterWindow.webContents.send('toggle-play-pause');
        }
    });

    globalShortcut.register('CommandOrControl+Shift+Escape', () => {
        if (teleprompterWindow) {
            teleprompterWindow.close();
        }
    });
}

app.whenReady().then(() => {
    createDashboard();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createDashboard();
        }
    });
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// IPC handlers
ipcMain.on('start-teleprompter', (event, data) => {
    teleprompterData = data;
    createTeleprompter();
});

ipcMain.on('get-interaction-mode', (event) => {
    event.reply('interaction-mode-changed', interactionMode);
});
