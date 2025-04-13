import { showNotification } from "./notifications.js";

let currentMode = "key"; // Default mode
let keyState = {};
let mousePosition = { x: 525, y: 310 }; // Center of a 1050x620 canvas
let smoothMousePosition = { x: 525, y: 310 };
let velocity = { x: 0, y: 0 };
let acceleration = 0.5;
let maxSpeed = 5;
let friction = 0.9;
let throwTarget = null;

// Load user preferences from storage
chrome.storage.local.get(["userDefaultMode", "userMode1SwitchKeyCombo", "userMode2SwitchKeyCombo", "userMode3SwitchKeyCombo"], (data) => {
    currentMode = data.userDefaultMode || "key";
    modeKeyCombos = {
        key: data.userMode1SwitchKeyCombo || "",
        mouse: data.userMode2SwitchKeyCombo || "",
        throw: data.userMode3SwitchKeyCombo || ""
    };
    showNotification(`Loaded default mode: ${currentMode}`, "info");
});

// Track key states
document.addEventListener("keydown", (event) => {
    keyState[event.key.toLowerCase()] = true;
    handleModeSwitch(event);
});

document.addEventListener("keyup", (event) => {
    keyState[event.key.toLowerCase()] = false;
});

// Track mouse position via messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "mousemove") {
        mousePosition.x = message.x;
        mousePosition.y = message.y;
    }
    if (message.type === "mousedown" && currentMode === "throw" && keyState[" "]) {
        throwTarget = { x: smoothMousePosition.x, y: smoothMousePosition.y };
        performThrow();
    }
});

// Handle mode switching
function handleModeSwitch(event) {
    const pressedKeys = Object.keys(keyState).filter((key) => keyState[key]);
    const pressedCombo = formatKeys(pressedKeys);

    if (pressedCombo === modeKeyCombos.key) {
        currentMode = "key";
        showNotification("Switched to Key Mode", "success");
    } else if (pressedCombo === modeKeyCombos.mouse) {
        currentMode = "mouse";
        showNotification("Switched to Mouse Tracker Mode", "success");
    } else if (pressedCombo === modeKeyCombos.throw) {
        currentMode = "throw";
        showNotification("Switched to Throw Mode", "success");
    }
}

// Format keys for comparison
function formatKeys(keys) {
    return keys.sort().join(" + ");
}

// Update based on the current mode
function updateState() {
    if (currentMode === "key") {
        handleKeyMode();
    } else if (currentMode === "mouse") {
        handleMouseMode();
    } else if (currentMode === "throw") {
        handleThrowMode();
    }

    // Send updated positions to the DOM
    chrome.runtime.sendMessage({
        type: "update",
        mode: currentMode,
        position: smoothMousePosition,
        throwTarget: throwTarget
    });

    requestAnimationFrame(updateState);
}

// Handle Key Mode (smooth WASD movement)
function handleKeyMode() {
    if (keyState["w"]) velocity.y -= acceleration;
    if (keyState["s"]) velocity.y += acceleration;
    if (keyState["a"]) velocity.x -= acceleration;
    if (keyState["d"]) velocity.x += acceleration;

    // Apply friction and limit speed
    velocity.x *= friction;
    velocity.y *= friction;
    velocity.x = Math.max(-maxSpeed, Math.min(maxSpeed, velocity.x));
    velocity.y = Math.max(-maxSpeed, Math.min(maxSpeed, velocity.y));

    // Update position
    mousePosition.x += velocity.x;
    mousePosition.y += velocity.y;

    // Keep within canvas bounds
    mousePosition.x = Math.max(0, Math.min(1050, mousePosition.x));
    mousePosition.y = Math.max(0, Math.min(620, mousePosition.y));
}

// Handle Mouse Tracker Mode (smooth following)
function handleMouseMode() {
    smoothMousePosition.x += (mousePosition.x - smoothMousePosition.x) * 0.1;
    smoothMousePosition.y += (mousePosition.y - smoothMousePosition.y) * 0.1;
}

// Handle Throw Mode
function handleThrowMode() {
    smoothMousePosition.x += (mousePosition.x - smoothMousePosition.x) * 0.1;
    smoothMousePosition.y += (mousePosition.y - smoothMousePosition.y) * 0.1;
}

// Perform the throw action
function performThrow() {
    if (throwTarget) {
        showNotification(`Throwing at (${throwTarget.x}, ${throwTarget.y})`, "info");

        // Send throw action to the DOM
        chrome.runtime.sendMessage({
            type: "throw",
            target: throwTarget
        });

        throwTarget = null; // Reset target after throw
    }
}

// Start the update loop
updateState();
