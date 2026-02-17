const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onInteractionModeChanged(callback) {
        ipcRenderer.on('interaction-mode-changed', (event, interactionMode) => {
            callback(interactionMode);
        });
        // Request current state
        ipcRenderer.send('get-interaction-mode');
    },
    onTogglePlayPause(callback) {
        ipcRenderer.on('toggle-play-pause', () => {
            callback();
        });
    },
});
