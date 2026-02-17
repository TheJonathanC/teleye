// State
let isPlaying = false;
let speed = 1.0;
let interactionMode = false;
let animationFrameId = null;
let lastTimestamp = 0; // Using performance.now() consistent timing

// DOM elements
const scrollContainer = document.getElementById('scroll-container');
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
            // CRITICAL: Ensure we get data and update DOM immediately
            if (data && data.script) {
                textEditor.value = data.script;
                // Force update display
                textContent.textContent = data.script;
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
        controls.classList.remove('hidden');
        textEditor.classList.remove('hidden');
        textContent.classList.add('hidden');
        modeIndicator.textContent = '🖱 Interactive';
        modeIndicator.classList.add('interactive');
    } else {
        controls.classList.add('hidden');
        textEditor.classList.add('hidden');
        textContent.classList.remove('hidden');
        modeIndicator.textContent = '👻 Click-Through';
        modeIndicator.classList.remove('interactive');
    }
}

function togglePlayPause() {
    isPlaying = !isPlaying;
    playPauseBtn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';

    if (isPlaying) {
        // Reset timestamp reference when starting to prevent jump
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

        // Calculate delta time
        // Use the passed timestamp from RAF for consistency
        const deltaTime = timestamp - lastTimestamp;

        // Only scroll if some time has passed (not 0) and not a huge jump (e.g. background tab resume)
        // 100ms cap to prevent jump after lag
        if (deltaTime > 0 && deltaTime < 100) {
            // Speed logic: 50 base pixels per second * speed multiplier
            const pixelsPerSecond = 50 * speed;
            const scrollAmount = (pixelsPerSecond * deltaTime) / 1000;

            scrollContainer.scrollTop += scrollAmount;

            // Check if bottom reached using a small threshold (1px)
            // scrollTop allows fractional values in most modern browsers, 
            // but reading it back might round in some cases. clientHeight + scrollTop ~= scrollHeight
            if (Math.ceil(scrollContainer.scrollTop + scrollContainer.clientHeight) >= scrollContainer.scrollHeight) {
                // Determine loop or stop behavior. For now, stop.
                isPlaying = false;
                playPauseBtn.textContent = '▶ Play';
                // Reset to top
                scrollContainer.scrollTop = 0;
                return;
            }
        }

        lastTimestamp = timestamp;
        animationFrameId = requestAnimationFrame(scroll);
    }

    // Start loop
    animationFrameId = requestAnimationFrame(scroll);
}

function stopScrolling() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

init();
