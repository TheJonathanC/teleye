const { app, BrowserWindow, globalShortcut, screen, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let dashboardWindow = null;
let teleprompterWindow = null;
let interactionMode = false;
let teleprompterData = {
    script: '',
    speed: 1.0
};

// ─── Auto Updater ─────────────────────────────────────────────
function setupAutoUpdater() {
    // Don't check for updates in dev mode
    if (!app.isPackaged) return;

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available', (info) => {
        dialog.showMessageBox(dashboardWindow, {
            type: 'info',
            title: 'Update Available',
            message: `Teleye ${info.version} is available.`,
            detail: 'Downloading update in the background...',
            buttons: ['OK'],
            icon: path.join(__dirname, 'teleye.png')
        });
    });

    autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox(dashboardWindow, {
            type: 'info',
            title: 'Update Ready',
            message: 'Update downloaded.',
            detail: 'Restart Teleye now to install the latest version.',
            buttons: ['Restart Now', 'Later'],
            defaultId: 0,
            icon: path.join(__dirname, 'teleye.png')
        }).then(({ response }) => {
            if (response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });

    autoUpdater.on('error', (err) => {
        console.error('Auto-updater error:', err);
    });

    // Check for updates 3 seconds after launch
    setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify();
    }, 3000);
}

// ─── Dashboard Window ─────────────────────────────────────────
function createDashboard() {
    dashboardWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        show: false,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        resizable: true,
        hasShadow: true,
        icon: path.join(__dirname, 'teleye.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    dashboardWindow.loadFile('dashboard.html');

    dashboardWindow.once('ready-to-show', () => {
        dashboardWindow.show();
        dashboardWindow.focus();
        setupAutoUpdater();
    });

    // Fallback show
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

// ─── Teleprompter Window ──────────────────────────────────────
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
        backgroundColor: '#00000000',
        alwaysOnTop: true,
        resizable: true,
        hasShadow: false,
        icon: path.join(__dirname, 'teleye.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    teleprompterWindow.setIgnoreMouseEvents(true, { forward: true });
    teleprompterWindow.loadFile('index.html');

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

    if (dashboardWindow) {
        dashboardWindow.hide();
    }

    registerTeleprompterShortcuts();
}

// ─── Shortcuts ────────────────────────────────────────────────
function registerTeleprompterShortcuts() {
    globalShortcut.register('CommandOrControl+Space', () => {
        if (teleprompterWindow) {
            teleprompterWindow.webContents.send('toggle-play-pause');
        }
    });

    globalShortcut.register('CommandOrControl+Alt+X', () => {
        if (teleprompterWindow) {
            teleprompterWindow.close();
        }
    });

    globalShortcut.register('CommandOrControl+Shift+L', () => {
        if (teleprompterWindow) {
            interactionMode = !interactionMode;
            teleprompterWindow.setIgnoreMouseEvents(!interactionMode, { forward: true });
            teleprompterWindow.webContents.send('interaction-mode-changed', interactionMode);
        }
    });
}

// ─── App Lifecycle ────────────────────────────────────────────
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

// ─── IPC Handlers ────────────────────────────────────────────
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
