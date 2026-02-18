// State
let isPlaying = false;
let speed = 1.0;
let interactionMode = false;
let animationFrameId = null;
let lastTimestamp = 0;
let currentScrollY = 0;

// DOM elements
const scrollContainer = document.getElementById('scroll-container');
const scrollingContent = document.getElementById('scrolling-content');
const textEditor = document.getElementById('text-editor');
const textContent = document.getElementById('text-content');
const controls = document.getElementById('controls');
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const playPauseLabel = document.getElementById('play-pause-label');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const modeIndicator = document.getElementById('mode-indicator');

function init() {
    // Listen for initial data from dashboard
    if (window.electronAPI) {
        window.electronAPI.onInitTeleprompter((data) => {
            if (data && data.script) {
                textEditor.value = data.script;
                updateTextDisplay();
            }
            if (data && data.speed) {
                speed = data.speed;
                speedSlider.value = speed;
                speedValue.textContent = speed.toFixed(1);
            }
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
}

function updateTextDisplay() {
    textContent.textContent = textEditor.value;
}

function setPlayingState(playing) {
    isPlaying = playing;
    if (playIcon) playIcon.style.display = playing ? 'none' : 'block';
    if (pauseIcon) pauseIcon.style.display = playing ? 'block' : 'none';
    if (playPauseLabel) playPauseLabel.textContent = playing ? 'Pause' : 'Play';
}

function setInteractionMode(mode) {
    interactionMode = mode;
    if (mode) {
        // Interactive Mode
        controls.classList.remove('hidden');
        textEditor.classList.remove('hidden');
        modeIndicator.textContent = 'Interactive';
        modeIndicator.classList.add('interactive');

        // Pause scrolling when entering interactive mode
        if (isPlaying) togglePlayPause();
    } else {
        // Click-Through Mode
        controls.classList.add('hidden');
        textEditor.classList.add('hidden');
        modeIndicator.textContent = 'Click-Through';
        modeIndicator.classList.remove('interactive');
    }
}

function togglePlayPause() {
    if (isPlaying) {
        setPlayingState(false);
        stopScrolling();
    } else {
        setPlayingState(true);
        lastTimestamp = performance.now();
        startScrolling();
    }
}

function handleSpeedChange(e) {
    speed = parseFloat(e.target.value);
    speedValue.textContent = speed.toFixed(1);
}

function startScrolling() {
    function scroll(timestamp) {
        if (!isPlaying) return;

        const deltaTime = timestamp - lastTimestamp;

        if (deltaTime > 0 && deltaTime < 100) {
            const pixelsPerSecond = 50 * speed;
            const scrollAmount = (pixelsPerSecond * deltaTime) / 1000;

            currentScrollY += scrollAmount;

            scrollingContent.style.transform = `translateY(-${currentScrollY}px)`;

            const viewportHeight = scrollContainer.clientHeight;
            const contentHeight = scrollingContent.scrollHeight;

            if (currentScrollY + viewportHeight >= contentHeight) {
                setPlayingState(false);
                return;
            }
        }

        lastTimestamp = timestamp;
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

init();
