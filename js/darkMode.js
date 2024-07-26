// darkmode.js

const DarkMode = {
    isEnabled: false,

    init: function() {
        console.log("Initializing Dark Mode");
        chrome.storage.sync.get(['darkModeEnabled'], (result) => {
            this.isEnabled = result.darkModeEnabled || false;
            if (this.isEnabled) {
                this.enable();
            }
        });
    },

    enable: function() {
        this.applyDarkMode();
        this.isEnabled = true;
        chrome.storage.sync.set({darkModeEnabled: true});
        console.log("Dark Mode enabled");
    },

    disable: function() {
        this.removeDarkMode();
        this.isEnabled = false;
        chrome.storage.sync.set({darkModeEnabled: false});
        console.log("Dark Mode disabled");
    },

    toggle: function() {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
    },

    applyDarkMode: function() {
        document.documentElement.classList.add('dark-mode');
        this.injectDarkModeStyles();
    },

    removeDarkMode: function() {
        document.documentElement.classList.remove('dark-mode');
        const existingStyleTag = document.getElementById('dark-mode-styles');
        if (existingStyleTag) {
            existingStyleTag.remove();
        }
    },

    injectDarkModeStyles: function() {
        const style = document.createElement('style');
        style.id = 'dark-mode-styles';
        style.textContent = `
            .dark-mode {
                filter: invert(90%) hue-rotate(180deg);
            }
            .dark-mode img, .dark-mode video, .dark-mode iframe {
                filter: invert(100%) hue-rotate(180deg);
            }
        `;
        document.head.appendChild(style);
    },

    applyToPopup: function() {
        if (this.isEnabled) {
            this.applyDarkMode();
        }
    }
};

// Initialize Dark Mode
DarkMode.init();

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleDarkMode") {
        DarkMode.toggle();
        sendResponse({success: true, isDarkModeEnabled: DarkMode.isEnabled});
    } else if (request.action === "getDarkModeStatus") {
        sendResponse({isDarkModeEnabled: DarkMode.isEnabled});
    }
    return true;
});

// Apply dark mode to extension popup
if (window.location.protocol === 'chrome-extension:') {
    DarkMode.applyToPopup();
}