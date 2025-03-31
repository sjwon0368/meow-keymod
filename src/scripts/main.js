import $ from "https://code.jquery.com/jquery-3.6.0.min.js";

window.addEventListener('error', function(event) {
    showNotification(`Error: ${event.message}`, 'error');
    return true; // Prevent the default browser error handling
});

// userDefaultMode
// userMode1SwitchKeyCombo, userMode2SwitchKeyCombo, userMode3SwitchKeyCombo

function delay(ms, callback) {
    setTimeout(callback, ms);
}

const localData = {
    save: function(key, value) {
        localStorage.setItem(key, value);
    },
    load: function(key) {
        return localStorage.getItem(key);
    },
    exists: function(key) {
        return localStorage.getItem(key) !== null;
    },
    reset: function(comfirm) {
        if (confirm) {
            return localStorage.clear();
        }
    },
    delete: function(key) {
        return localStorage.removeItem(key);
    }
};

const notificationQueue = [];
const activeNotifications = [];
const maxNotifications = 3;

function showNotification(message, type, duration = 3500) {
    notificationQueue.push({ message, type, duration });
    if (activeNotifications.length < maxNotifications) {
        displayNextNotification();
    } else {
        const oldestNotification = activeNotifications.shift();
        if (oldestNotification.type === 'success' || oldestNotification.type === 'loading') {
            removeNotification(oldestNotification.element);
            displayNextNotification();
        }
    }
}

function displayNextNotification() {
    if (notificationQueue.length === 0) {
        return;
    }

    const { message, type, duration } = notificationQueue.shift();
    const notificationContainer = document.querySelector('.notification-container') || createNotificationContainer();
    const notificationBar = document.createElement('div');
    notificationBar.className = 'notification-bar';
    const notificationIcon = document.createElement('svg');
    notificationIcon.className = 'notification-icon';
    notificationIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    notificationIcon.setAttribute('viewBox', '0 0 24 24');
    notificationIcon.setAttribute('width', '24');
    notificationIcon.setAttribute('height', '24');
    const notificationText = document.createElement('span');
    notificationText.id = 'notification-text';
    notificationText.textContent = message;

    switch (type) {
        case 'success':
            notificationBar.style.backgroundColor = '#4CAF50';
            notificationIcon.innerHTML = '<path fill="white" d="M9 16.2l-4.2-4.2-1.4 1.4 5.6 5.6 12-12-1.4-1.4z"/>';
            break;
        case 'error':
            notificationBar.style.backgroundColor = '#F44336';
            notificationIcon.innerHTML = '<path fill="white" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13l-1.41 1.41L12 13.41l-3.59 3.59L7 15l3.59-3.59L7 7.83 8.41 6.41 12 10l3.59-3.59L17 7.83l-3.59 3.59L17 15z"/>';
            break;
        case 'warning':
            notificationBar.style.backgroundColor = '#FF9800';
            notificationIcon.innerHTML = '<path fill="white" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>';
            break;
        case 'info':
            notificationBar.style.backgroundColor = '#2196F3';
            notificationIcon.innerHTML = '<path fill="white" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm0-4h-2V7h2v8z"/>';
            break;
        case 'loading':
            notificationBar.style.backgroundColor = '#808080';
            notificationIcon.innerHTML = '<path fill="white" class="loading-icon" d="M12 2 A10 10 0 0 1 22 12"/>';
            break;
    }

    notificationBar.appendChild(notificationIcon);
    notificationBar.appendChild(notificationText);
    notificationContainer.appendChild(notificationBar);

    notificationBar.style.boxShadow = '0px 5px 15px rgba(0,0,0,0.3)';
    notificationBar.classList.add('show');
    activeNotifications.push({ element: notificationBar, type });

    setTimeout(() => {
        notificationBar.classList.remove('show');
        notificationBar.classList.add('hide');
        setTimeout(() => {
            removeNotification(notificationBar);
            displayNextNotification();
        }, 500); // Wait for the fade-out animation to complete
    }, duration);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
}

function removeNotification(notificationBar) {
    notificationBar.remove();
    activeNotifications.shift();
}

function saveChanges() {
    showNotification('Saving...', 'loading', 1000);
    localData.save("userDefaultMode", $("#default-mode").val());
    console.log("Saved default mode to: " + $("#default-mode").val());
    for (let index = 1; index < 4; index++) {
        localData.save($(`.keymode-buttons #mode${index}`).text());
        console.log(`Saved mode ${index} to: ` + $(`.keymode-buttons #mode${index}`).text());
    }
    setTimeout(() => {
        showNotification('Saved', 'success');
    }, 1200);
}

function load() {
    $("#loading").text("One Sec...");
    delay(1000, function() {
        if (!localData.exists("userPref")) {
            let countdown = 5;
            const intervalId = setInterval(function() {
                if (countdown > 0) {
                    $("#loading").text(`First time running. Redirecting to setup... (${countdown}s)`);
                    countdown--;
                } else {
                    clearInterval(intervalId);
                    $("#loading").text("Redirecting...");
                    location.href = "./setup.html";
                }
            }, 1000);
        } else {
            $("#loading").text("Hello.");
            $("#loading").addClass("hidden");
            $(".mod-main").removeClass("hidden");
            $("#default-mode").val(localData.load("userDefaultMode"));
            for (let index = 1; index < 4; index++) {
                $(`.keymode-buttons #mode${index}`).text(localData.load(`userMode${index}SwitchKeyCombo`));
            }
            showNotification('Changes made in settings will be automatically saved.', 'info');
            dummyFunctionForError(); // this is not a real function, just for testing error handling
        }
    });
}

delay(800, load);


// That good old painful key combo code
let activeKeyButton = null;
let keys = [];
const keySymbols = {
    "Control": "⌤",
    "Shift": "⇧",
    "Alt": "⌥",
    "Meta": "⌘",
    "Tab": "⭾"
};

const keyCombos = new Set();

document.querySelectorAll(".key-button").forEach(button => {
    button.addEventListener("click", function() {
        activeKeyButton = this;
        this.textContent = "(Waiting for keys)";
        keys = [];
        $("#dialog-text").text("Set a key combo for switching to " + $(`.keymode-labels #${this.id}`).text());
        $("#dialog-ok").addClass("hidden");
        $("#dialog-overlay").removeClass("hide").addClass("show").fadeIn();
        $("#dialog").removeClass("hide").addClass("show").fadeIn();
    });
});

document.addEventListener("keydown", function(event) {
    if (activeKeyButton) {
        event.preventDefault();
        const key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
        if (!keys.includes(key)) {
            keys.push(key);
            updateKeyButton();
        }
    }
});

document.addEventListener("keyup", function(event) {
    if (activeKeyButton) {
        // When all keys are released, check for duplicate key combos
        if (keys.length !== 0) {
            const keyCombo = formatKeys(keys);
            if (keyCombos.has(keyCombo)) {
                $("#dialog-text").text("You used the same key combo again.");
                $("#dialog-ok").removeClass("hidden");
                $("#dialog-overlay").removeClass("hide").addClass("show").fadeIn();
                $("#dialog").removeClass("hide").addClass("show").fadeIn();
                activeKeyButton.textContent = "(Not set)";
            } else {
                keyCombos.add(keyCombo);
                activeKeyButton.textContent = keyCombo;
                $("#dialog").removeClass("show").addClass("hide").fadeOut();
                $("#dialog-overlay").removeClass("show").addClass("hide").fadeOut();
                $("#dialog-ok").addClass("hidden");
                localStorage.setItem(`userMode${(activeKeyButton.id).replace("mode", "")}SwitchKeyCombo`, activeKeyButton.textContent);
                console.log(`Saved mode ${(activeKeyButton.id).replace("mode", "")} key combo to: ` + activeKeyButton.textContent);
            }
            activeKeyButton = null;
        }
    }
});

function updateKeyButton() {
    if (keys.length === 0) {
        activeKeyButton.textContent = "(Not set)";
        return;
    }

    let displayKeys = keys.map(k => keySymbols[k] || k);
    for (let i = 1; i < displayKeys.length; i++) {
        if (displayKeys[i].length === 1 && displayKeys[i - 1].length === 1) {
            displayKeys[i - 1] += " + ";
        }
    }
    activeKeyButton.textContent = displayKeys.join("");
}

function formatKeys(keys) {
    let displayKeys = keys.map(k => keySymbols[k] || k);
    for (let i = 1; i < displayKeys.length; i++) {
        if (displayKeys[i].length === 1 && displayKeys[i - 1].length === 1) {
            displayKeys[i - 1] += " + ";
        }
    }
    return displayKeys.join("");
}