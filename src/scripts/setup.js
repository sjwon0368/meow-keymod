import $ from "https://code.jquery.com/jquery-3.6.0.min.js";

let step = 0;
        $("#next-step").on("click", function(event) {
            event.preventDefault();
            step++;
            if (step === 1) {
                $("#setup-text").text("Select your preferred key settings.");
                $(".container-default-keymode-set").removeClass("hidden");
                $("#progress-bar").css("width", "35%");
                $("#progress-text").text("Step 2/3");
                $(this).text("Next");
            } else if (step === 2) {
                if ($("#default-mode").val() === "none") {
                    $("#dialog-overlay").removeClass("hide").addClass("show").fadeIn();
                    $("#dialog").removeClass("hide").addClass("show").fadeIn();
                    step--;
                    return;
                }
                localStorage.setItem("userDefaultMode", $("#default-mode").val());
                $("#setup-text").text("Set the keys for switching between modes.");
                $(".container-keymode-switch-combo").removeClass("hidden");
                $(".keymode-buttons").removeClass("hidden");
                $(".keymode-labels").removeClass("hidden");
                $(".container-default-keymode-set").addClass("hidden");
                $("#progress-bar").css("width", "65%");
                $("#progress-text").text("Step 3/3");
                $(this).text("Confirm");
            } else if (step === 3) {
                if ($(".keymode-buttons #mode1").text() == "(Not set)" || $(".keymode-buttons #mode2").text() == "(Not set)" || $(".keymode-buttons #mode3").text() == "(Not set)") {
                    $("#dialog-text").text("You have not set all key combos.");
                    $("#dialog-ok").removeClass("hidden");
                    $("#dialog-overlay").removeClass("hide").addClass("show").fadeIn();
                    $("#dialog").removeClass("hide").addClass("show").fadeIn();
                    step--;
                    return;
                }
                $("#setup-text").text("Finished! You can now go to the main menu.");
                $(".container-keymode-switch-combo").addClass("hidden");
                $(".keymode-buttons").addClass("hidden");
                $(".keymode-labels").addClass("hidden");
                $("#progress-bar").css("width", "100%");
                $("#progress-text").text("All steps finished!");
                localStorage.setItem("userPref", "setupFinished");
                $(this).text("Continue");
            } else if (step === 4) {
                location.href = "./main.html"
            } else step = 1;
        });
        $("#dialog-ok").on("click", function() {
            $("#dialog").fadeOut(function() {
                $("#dialog").removeClass("show").addClass("hide");
            });
            $("#dialog-overlay").fadeOut(function() {
                $("#dialog-overlay").removeClass("show").addClass("hide");
            });
        });
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