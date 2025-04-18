import { showNotification } from "./notifications.js";

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
        chrome.storage.local.set({ [key]: value }, function() {
            console.log(`Saved ${key} to storage.`);
        });
    },
    load: function(key, callback) {
        chrome.storage.local.get([key], function(result) {
            callback(result[key]);
        });
    },
    exists: function(key, callback) {
        chrome.storage.local.get([key], function(result) {
            callback(result[key] !== undefined);
        });
    },
    reset: function(confirm) {
        if (confirm) {
            chrome.storage.local.clear(function() {
                console.log("Storage cleared.");
            });
        }
    },
    delete: function(key) {
        chrome.storage.local.remove([key], function() {
            console.log(`Removed ${key} from storage.`);
        });
    }
};

function saveChanges() {
    showNotification('Saving...', 'loading', 1000);
    localData.save("userDefaultMode", $("#default-mode").val());
    console.log("Saved default mode to: " + $("#default-mode").val());
    for (let index = 1; index < 4; index++) {
        localData.save(`userMode${index}SwitchKeyCombo`, $(`.keymode-buttons #mode${index}`).text());
        console.log(`Saved mode ${index} to: ` + $(`.keymode-buttons #mode${index}`).text());
    }
    setTimeout(() => {
        showNotification('Saved', 'success');
    }, 1200);
}

function load() {
    $("#loading").text("One Sec...");
    delay(1000, function() {
        localData.exists("userPref", function(exists) {
            if (!exists) {
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
                localData.load("userDefaultMode", function(value) {
                    $("#default-mode").val(value);
                });
                for (let index = 1; index < 4; index++) {
                    localData.load(`userMode${index}SwitchKeyCombo`, function(value) {
                        $(`.keymode-buttons #mode${index}`).text(value);
                    });
                }
                showNotification('Changes made in settings will be automatically saved.', 'info');
                //dummyFunctionForError(); // this is not a real function, just for testing error handling
            }
        });
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
                chrome.storage.local.set({ [`userMode${(activeKeyButton.id).replace("mode", "")}SwitchKeyCombo`]: activeKeyButton.textContent }, function() {
                    console.log(`Saved mode ${(activeKeyButton.id).replace("mode", "")} key combo to: ` + activeKeyButton.textContent);
                });
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