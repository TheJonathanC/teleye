const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Window Controls
    closeDashboard() { ipcRenderer.send('close-dashboard'); },
    minimizeDashboard() { ipcRenderer.send('minimize-dashboard'); },

    // Dashboard
    startTeleprompter(data) {
        ipcRenderer.send('start-teleprompter', data);
    },

    // Teleprompter
    onInitTeleprompter(callback) {
        ipcRenderer.on('init-teleprompter', (event, data) => {
            callback(data);
        });
    },
    onInteractionModeChanged(callback) {
        ipcRenderer.on('interaction-mode-changed', (event, interactionMode) => {
            callback(interactionMode);
        });
        ipcRenderer.send('get-interaction-mode');
    },
    onTogglePlayPause(callback) {
        ipcRenderer.on('toggle-play-pause', () => {
            callback();
        });
    },
});
