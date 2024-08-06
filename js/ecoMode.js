var CarbonCalculator = CarbonCalculator || {};

CarbonCalculator.EcoMode = {
  init: function() {
    this.ecoModeToggle = document.getElementById("ecoModeToggle");
    this.imageOptimizationToggle = document.getElementById("imageOptimizationToggle");
    this.videoOptimizationToggle = document.getElementById("videoOptimizationToggle");
    this.tabSuspensionToggle = document.getElementById("tabSuspensionToggle");
    this.darkModeToggle = document.getElementById("darkModeToggle");

    this.loadSettings();
    this.setupEventListeners();
  },

  loadSettings: function() {
    chrome.storage.sync.get(
      [
        "ecoModeEnabled",
        "imageOptimizationEnabled",
        "videoOptimizationEnabled",
        "tabSuspensionEnabled",
        "darkModeEnabled",
      ],
      (data) => {
        if (this.ecoModeToggle) this.ecoModeToggle.checked = data.ecoModeEnabled ?? false;
        if (this.imageOptimizationToggle) this.imageOptimizationToggle.checked = data.imageOptimizationEnabled ?? false;
        if (this.videoOptimizationToggle) this.videoOptimizationToggle.checked = data.videoOptimizationEnabled ?? false;
        if (this.tabSuspensionToggle) this.tabSuspensionToggle.checked = data.tabSuspensionEnabled ?? false;
        if (this.darkModeToggle) this.darkModeToggle.checked = data.darkModeEnabled ?? false;
      }
    );
  },

  setupEventListeners: function() {
    if (this.ecoModeToggle) {
      this.ecoModeToggle.addEventListener("change", (event) => this.toggleEcoMode(event.target.checked));
    }
    if (this.imageOptimizationToggle) {
      this.imageOptimizationToggle.addEventListener("change", (event) => this.toggleImageOptimization(event.target.checked));
    }
    if (this.videoOptimizationToggle) {
      this.videoOptimizationToggle.addEventListener("change", (event) => this.toggleVideoOptimization(event.target.checked));
    }
    if (this.tabSuspensionToggle) {
      this.tabSuspensionToggle.addEventListener("change", (event) => this.toggleTabSuspension(event.target.checked));
    }
    if (this.darkModeToggle) {
      this.darkModeToggle.addEventListener("change", (event) => this.toggleDarkMode(event.target.checked));
    }
  },

  toggleEcoMode: function(isEnabled) {
    chrome.storage.sync.get(["darkModeEnabled"], (data) => {
      const previousDarkModeState = data.darkModeEnabled;
      chrome.storage.sync.set(
        {
          ecoModeEnabled: isEnabled,
          imageOptimizationEnabled: isEnabled,
          videoOptimizationEnabled: isEnabled,
          tabSuspensionEnabled: isEnabled,
          darkModeEnabled: isEnabled,
        },
        () => {
          console.log("Eco mode is set to " + isEnabled);
          this.updateAllToggles(isEnabled);
          chrome.runtime.sendMessage({
            action: "updateEcoMode",
            enabled: isEnabled,
          });
          
          // Only toggle dark mode if its state has changed
          if (previousDarkModeState !== isEnabled) {
            this.toggleDarkMode(isEnabled);
          }
        }
      );
    });
  },

  toggleImageOptimization: function(isEnabled) {
    chrome.storage.sync.set({ imageOptimizationEnabled: isEnabled }, () => {
      console.log("Image optimization is set to " + isEnabled);
      chrome.runtime.sendMessage({
        action: "updateImageOptimization",
        enabled: isEnabled,
      });
      this.updateEcoModeBasedOnSettings();
    });
  },

  toggleVideoOptimization: function(isEnabled) {
    chrome.storage.sync.set({ videoOptimizationEnabled: isEnabled }, () => {
      console.log("Video optimization is set to " + isEnabled);
      chrome.runtime.sendMessage({
        action: "updateVideoOptimization",
        enabled: isEnabled,
      });
      this.updateEcoModeBasedOnSettings();
    });
  },

  toggleTabSuspension: function(isEnabled) {
    chrome.storage.sync.set({ tabSuspensionEnabled: isEnabled }, () => {
      console.log("Tab suspension is set to " + isEnabled);
      chrome.runtime.sendMessage({
        action: "updateTabSuspension",
        enabled: isEnabled,
      });
      this.updateEcoModeBasedOnSettings();
    });
  },

  toggleDarkMode: function(isEnabled) {
    chrome.storage.sync.set({ darkModeEnabled: isEnabled }, () => {
      console.log("Dark mode is set to " + isEnabled);
      chrome.runtime.sendMessage(
        {
          action: "toggleDarkMode",
          enabled: isEnabled,
        },
        (response) => {
          if (response && response.success) {
            console.log("Dark mode toggled successfully");
            this.updateDarkModeToggle(isEnabled);
          } else {
            console.error("Failed to toggle dark mode", response);
          }
        }
      );
      this.updateEcoModeBasedOnSettings();
    });
  },

  updateAllToggles: function(isEnabled) {
    const toggles = [
      this.imageOptimizationToggle,
      this.videoOptimizationToggle,
      this.tabSuspensionToggle,
      this.darkModeToggle,
    ];

    toggles.forEach((toggle) => {
      if (toggle) toggle.checked = isEnabled;
    });
  },

  updateEcoModeBasedOnSettings: function() {
    chrome.storage.sync.get(
      [
        "imageOptimizationEnabled",
        "videoOptimizationEnabled",
        "tabSuspensionEnabled",
        "darkModeEnabled",
      ],
      (data) => {
        const anyEnabled = Object.values(data).some(Boolean);
        if (this.ecoModeToggle) {
          if (anyEnabled && !this.ecoModeToggle.checked) {
            this.ecoModeToggle.checked = true;
            chrome.storage.sync.set({ ecoModeEnabled: true });
          } else if (!anyEnabled && this.ecoModeToggle.checked) {
            this.ecoModeToggle.checked = false;
            chrome.storage.sync.set({ ecoModeEnabled: false });
          }
        }
      }
    );
  },

  updateDarkModeToggle: function(isEnabled) {
    if (this.darkModeToggle) {
      this.darkModeToggle.checked = isEnabled;
    }
  },
};

// Initialize EcoMode when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  CarbonCalculator.EcoMode.init();
});