// State
let isPlaying = false;
let speed = 1.0;
let interactionMode = false;
let animationFrameId = null;
let lastTime = 0;

// DOM elements
const scrollContainer = document.getElementById('scroll-container');
const textEditor = document.getElementById('text-editor');
const textContent = document.getElementById('text-content');
const controls = document.getElementById('controls');
const playPauseBtn = document.getElementById('play-pause-btn');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const modeIndicator = document.getElementById('mode-indicator');

// Initialize
function init() {
    // Listen for initial data from dashboard
    if (window.electronAPI) {
        window.electronAPI.onInitTeleprompter((data) => {
            textEditor.value = data.script;
            speed = data.speed;
            speedSlider.value = speed;
            speedValue.textContent = speed.toFixed(1);
            updateTextDisplay();
        });

        window.electronAPI.onInteractionModeChanged((mode) => {
            setInteractionMode(mode);
        });

        window.electronAPI.onTogglePlayPause(() => {
            togglePlayPause();
        });
    }

    // Event listeners
    playPauseBtn.addEventListener('click', togglePlayPause);
    speedSlider.addEventListener('input', handleSpeedChange);
    textEditor.addEventListener('input', updateTextDisplay);

    // Initial display update
    updateTextDisplay();
}

// Update text display
function updateTextDisplay() {
    textContent.textContent = textEditor.value;
}

// Set interaction mode
function setInteractionMode(mode) {
    interactionMode = mode;

    if (mode) {
        // Interactive mode
        controls.classList.remove('hidden');
        textEditor.classList.remove('hidden');
        textContent.classList.add('hidden');
        modeIndicator.textContent = '🖱 Interactive';
        modeIndicator.classList.add('interactive');
    } else {
        // Click-through mode
        controls.classList.add('hidden');
        textEditor.classList.add('hidden');
        textContent.classList.remove('hidden');
        modeIndicator.textContent = '👻 Click-Through';
        modeIndicator.classList.remove('interactive');
    }
}

// Toggle play/pause
function togglePlayPause() {
    isPlaying = !isPlaying;
    playPauseBtn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';

    if (isPlaying) {
        startScrolling();
    } else {
        stopScrolling();
    }
}

// Handle speed change
function handleSpeedChange(e) {
    speed = parseFloat(e.target.value);
    speedValue.textContent = speed.toFixed(1);
}

// Auto-scroll logic
function startScrolling() {
    lastTime = null; // Reset lastTime when starting

    function scroll(timestamp) {
        if (!isPlaying) return;

        // Initialize lastTime on first frame
        if (lastTime === null) {
            lastTime = timestamp;
        }

        const deltaTime = timestamp - lastTime;
        const pixelsPerSecond = 50 * speed;
        const scrollAmount = (pixelsPerSecond * deltaTime) / 1000;

        scrollContainer.scrollTop += scrollAmount;

        // Check if we've reached the bottom
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        if (scrollTop + clientHeight >= scrollHeight - 10) {
            // Pause at bottom
            isPlaying = false;
            playPauseBtn.textContent = '▶ Play';

            // Reset to top after a brief pause
            setTimeout(() => {
                scrollContainer.scrollTop = 0;
            }, 1000);

            return;
        }

        lastTime = timestamp;
        animationFrameId = requestAnimationFrame(scroll);
    }

    animationFrameId = requestAnimationFrame(scroll);
}

function stopScrolling() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// Initialize on load
init();
