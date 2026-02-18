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

function setInteractionMode(mode) {
    interactionMode = mode;
    if (mode) {
        // Interactive Mode
        controls.classList.remove('hidden');
        textEditor.classList.remove('hidden'); // Shows editor over content
        modeIndicator.textContent = '🖱 Interactive';
        modeIndicator.classList.add('interactive');

        // Pause scrolling when entering interactive mode
        if (isPlaying) togglePlayPause();
    } else {
        // Click-Through Mode
        controls.classList.add('hidden');
        textEditor.classList.add('hidden'); // Hides editor, revealing content
        modeIndicator.textContent = '👻 Click-Through';
        modeIndicator.classList.remove('interactive');
    }
}

function togglePlayPause() {
    isPlaying = !isPlaying;
    playPauseBtn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';

    if (isPlaying) {
        lastTimestamp = performance.now();
        startScrolling();
    } else {
        stopScrolling();
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
            // Pixels per second calculation
            const pixelsPerSecond = 50 * speed;
            const scrollAmount = (pixelsPerSecond * deltaTime) / 1000;

            currentScrollY += scrollAmount;

            // Apply transform
            scrollingContent.style.transform = `translateY(-${currentScrollY}px)`;

            // Check if we reached the end
            // We compare currentScrollY + viewportHeight against total content height
            const viewportHeight = scrollContainer.clientHeight;
            const contentHeight = scrollingContent.scrollHeight;

            if (currentScrollY + viewportHeight >= contentHeight) {
                // Stop at end
                isPlaying = false;
                playPauseBtn.textContent = '▶ Play';
                // Optional: loop or stay at bottom? 
                // Creating a loop effect might be nice, but simple stop for now.
                // To loop: currentScrollY = -viewportHeight; 
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
