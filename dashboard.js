const scriptInput = document.getElementById('script-input');
const speedInput = document.getElementById('speed-input');
const speedDisplay = document.getElementById('speed-display');
const startBtn = document.getElementById('start-btn');

const closeBtn = document.getElementById('close-btn');
const minBtn = document.getElementById('min-btn');

// Window Controls
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        if (window.electronAPI) window.electronAPI.closeDashboard();
    });
}

if (minBtn) {
    minBtn.addEventListener('click', () => {
        if (window.electronAPI) window.electronAPI.minimizeDashboard();
    });
}

// Update speed display
speedInput.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    speedDisplay.textContent = value.toFixed(1) + 'x';
});

// Start teleprompter
startBtn.addEventListener('click', () => {
    const script = scriptInput.value;
    const speed = parseFloat(speedInput.value);

    // Send data to main process
    if (window.electronAPI) {
        window.electronAPI.startTeleprompter({ script, speed });
    }
});
