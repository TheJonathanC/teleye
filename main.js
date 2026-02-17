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
        width: 1000,
        height: 800,
        show: false, // Wait for content
        frame: false,
        transparent: true,
        resizable: true,
        hasShadow: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    dashboardWindow.loadFile('dashboard.html');

    // Show when ready to prevent flickering
    dashboardWindow.once('ready-to-show', () => {
        dashboardWindow.show();
        dashboardWindow.focus();
    });

    // Fallback: if ready-to-show doesn't fire for some reason
    setTimeout(() => {
        if (dashboardWindow && !dashboardWindow.isVisible()) {
            dashboardWindow.show();
        }
    }, 1000);

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
        height: 200,
        x: Math.floor((screenWidth - 800) / 2),
        y: 0,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: true,
        hasShadow: false,
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
    // Start/Stop: Ctrl + Space
    globalShortcut.register('CommandOrControl+Space', () => {
        if (teleprompterWindow) {
            teleprompterWindow.webContents.send('toggle-play-pause');
        }
    });

    // Exit: Ctrl + Alt + X
    globalShortcut.register('CommandOrControl+Alt+X', () => {
        if (teleprompterWindow) {
            teleprompterWindow.close();
        }
    });

    // Interaction: Ctrl + Shift + L
    globalShortcut.register('CommandOrControl+Shift+L', () => {
        if (teleprompterWindow) {
            interactionMode = !interactionMode;
            teleprompterWindow.setIgnoreMouseEvents(!interactionMode, { forward: true });
            teleprompterWindow.webContents.send('interaction-mode-changed', interactionMode);
        }
    });
}

app.whenReady().then(() => {
    // Disable hardware acceleration if causing issues (optional, but good for transparency)
    // app.disableHardwareAcceleration(); 

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

// IPC handlers - Ensure robust communication
ipcMain.on('close-dashboard', () => {
    if (dashboardWindow) dashboardWindow.close();
});

ipcMain.on('minimize-dashboard', () => {
    if (dashboardWindow) dashboardWindow.minimize();
});

ipcMain.on('start-teleprompter', (event, data) => {
    teleprompterData = data;
    createTeleprompter();
});

ipcMain.on('get-interaction-mode', (event) => {
    event.reply('interaction-mode-changed', interactionMode);
});
