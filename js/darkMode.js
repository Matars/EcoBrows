const DarkMode = {
  isEnabled: false,
  websiteAlreadyDark: false,

  init: function () {
    console.log("Initializing Dark Mode");
    this.loadSettings().then(() => {
      this.checkWebsiteDarkMode();
      this.applyDarkMode();
    });
  },

  loadSettings: function () {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["darkModeEnabled"], (result) => {
        this.isEnabled = result.darkModeEnabled || false;
        resolve();
      });
    });
  },

  checkWebsiteDarkMode: function () {
    if (window.location.hostname.includes('youtube.com')) {
      this.websiteAlreadyDark = this.isYouTubeDarkMode();
    } else {
      this.websiteAlreadyDark = this.isGeneralWebsiteDarkMode();
    }
    console.log("Website is already in dark mode:", this.websiteAlreadyDark);
  },

  isYouTubeDarkMode: function () {
    return document.documentElement.hasAttribute('dark') || 
           document.documentElement.hasAttribute('dark-theme') ||
           document.body.classList.contains('dark-theme');
  },

  isGeneralWebsiteDarkMode: function () {
    const darkModeSelectors = [
      'html[data-theme="dark"]',
      'html[data-color-mode="dark"]',
      'body.dark-mode',
      'body.darkmode',
      'body.dark-theme'
    ];

    if (darkModeSelectors.some(selector => document.querySelector(selector))) {
      return true;
    }

    const elementsToCheck = [
      document.body,
      document.querySelector('header'),
      document.querySelector('main'),
      document.querySelector('nav')
    ].filter(Boolean);

    return elementsToCheck.every(element => this.isElementDark(element));
  },

  isElementDark: function (element) {
    const style = window.getComputedStyle(element);
    const bgColor = style.backgroundColor;
    const textColor = style.color;

    const bgLuminance = this.calculateLuminance(this.extractRGB(bgColor));
    const textLuminance = this.calculateLuminance(this.extractRGB(textColor));

    // Check contrast ratio
    const contrastRatio = (Math.max(bgLuminance, textLuminance) + 0.05) / 
                          (Math.min(bgLuminance, textLuminance) + 0.05);

    return bgLuminance < 0.5 && contrastRatio > 4.5;
  },

  extractRGB: function (color) {
    const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [255, 255, 255];
  },

  calculateLuminance: function ([r, g, b]) {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  },

  applyDarkMode: function () {
    if (this.isEnabled && !this.websiteAlreadyDark) {
      this.applyCustomDarkMode();
    } else {
      this.removeDarkMode();
    }
  },

  applyCustomDarkMode: function () {
    document.documentElement.classList.add("extension-dark-mode");
    this.injectDarkModeStyles();
  },

  removeDarkMode: function () {
    document.documentElement.classList.remove("extension-dark-mode");
    const existingStyleTag = document.getElementById("extension-dark-mode-styles");
    if (existingStyleTag) {
      existingStyleTag.remove();
    }
  },

  injectDarkModeStyles: function () {
    const style = document.createElement("style");
    style.id = "extension-dark-mode-styles";
    style.textContent = `
      .extension-dark-mode {
        filter: invert(90%) hue-rotate(180deg);
      }
      .extension-dark-mode img, .extension-dark-mode video, .extension-dark-mode iframe {
        filter: invert(100%) hue-rotate(180deg);
      }
    `;
    document.head.appendChild(style);
  },
};

// Initialize Dark Mode
DarkMode.init();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateDarkMode") {
    DarkMode.loadSettings().then(() => {
      DarkMode.checkWebsiteDarkMode();
      DarkMode.applyDarkMode();
    });
  }
});