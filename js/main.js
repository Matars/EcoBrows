var CarbonCalculator = CarbonCalculator || {};

CarbonCalculator.Main = {
  estimateFootprintAndSavings: async function () {
    try {
      const loadingIndicator = document.getElementById("loadingIndicator");
      loadingIndicator.style.display = "block";

      const elements = {
        footprint: document.getElementById("carbonFootprint"),
        savings: document.getElementById("carbonSavings"),
        totalSavings: document.getElementById("totalCarbonSavings"),
      };

      if (!Object.values(elements).every(Boolean)) {
        throw new Error("One or more required elements not found");
      }

      const [lastCalculationTimestamp, storedFootprint] =
        await CarbonCalculator.Storage.getStoredData();
      const newResults =
        await CarbonCalculator.BrowserHistory.getNewBrowsingHistory(
          lastCalculationTimestamp
        );
      const newFootprint =
        await CarbonCalculator.Calculations.calculateFootprint(newResults);
      const totalFootprint = storedFootprint + newFootprint;
      const savings =
        CarbonCalculator.Calculations.calculateSavings(totalFootprint);

      await CarbonCalculator.Storage.updateStoredData(totalFootprint);
      CarbonCalculator.DisplayUtils.updateDisplay(
        elements,
        totalFootprint,
        savings
      );

      loadingIndicator.style.display = "none";
    } catch (error) {
      console.error("Error in estimateFootprintAndSavings:", error);
      CarbonCalculator.DisplayUtils.displayError(
        "An error occurred while calculating your carbon footprint."
      );
    }
  },

  initializeExtension: function () {
    const ecoModeToggle = document.getElementById("ecoModeToggle");
    const imageOptimizationToggle = document.getElementById("imageOptimizationToggle");
    const videoOptimizationToggle = document.getElementById("videoOptimizationToggle");
    const tabSuspensionToggle = document.getElementById("tabSuspensionToggle");
    const darkModeToggle = document.getElementById("darkModeToggle");

    chrome.storage.sync.get(
      [
        "ecoModeEnabled",
        "imageOptimizationEnabled",
        "videoOptimizationEnabled",
        "tabSuspensionEnabled",
        "darkModeEnabled"
      ],
      (data) => {
        ecoModeToggle.checked = data.ecoModeEnabled ?? false;
        imageOptimizationToggle.checked = data.imageOptimizationEnabled ?? false;
        videoOptimizationToggle.checked = data.videoOptimizationEnabled ?? false;
        tabSuspensionToggle.checked = data.tabSuspensionEnabled ?? false;
        darkModeToggle.checked = data.darkModeEnabled ?? false;
      }
    );

    ecoModeToggle.addEventListener("change", (event) =>
      this.toggleEcoMode(event.target.checked)
    );
    imageOptimizationToggle.addEventListener("change", (event) =>
      this.toggleImageOptimization(event.target.checked)
    );
    videoOptimizationToggle.addEventListener("change", (event) =>
      this.toggleVideoOptimization(event.target.checked)
    );
    tabSuspensionToggle.addEventListener("change", (event) =>
      this.toggleTabSuspension(event.target.checked)
    );
    darkModeToggle.addEventListener("change", (event) =>
      this.toggleDarkMode(event.target.checked)
    );

    chrome.storage.local.get(["lastResetDate", "totalFootprint"], (result) => {
      const today = new Date().toDateString();
      if (result.lastResetDate !== today) {
        // Update the last reset date, but keep the current footprint
        chrome.storage.local.set({ lastResetDate: today }, () => {
          this.estimateFootprintAndSavings();
        });
      } else {
        this.estimateFootprintAndSavings();
      }
    });
  },

  toggleEcoMode: function (isEnabled) {
    chrome.storage.sync.set({ 
      ecoModeEnabled: isEnabled,
      imageOptimizationEnabled: isEnabled,
      videoOptimizationEnabled: isEnabled,
      tabSuspensionEnabled: isEnabled
    }, () => {
      console.log("Eco mode is set to " + isEnabled);
      this.updateAllToggles(isEnabled);
      chrome.runtime.sendMessage({
        action: "updateEcoMode",
        enabled: isEnabled,
      });
    });
  },

  toggleImageOptimization: function (isEnabled) {
    chrome.storage.sync.set({ imageOptimizationEnabled: isEnabled }, () => {
      console.log("Image optimization is set to " + isEnabled);
      chrome.runtime.sendMessage({
        action: "updateImageOptimization",
        enabled: isEnabled,
      });
      this.updateEcoModeBasedOnSettings();
    });
  },

  toggleVideoOptimization: function (isEnabled) {
    chrome.storage.sync.set({ videoOptimizationEnabled: isEnabled }, () => {
      console.log("Video optimization is set to " + isEnabled);
      chrome.runtime.sendMessage({
        action: "updateVideoOptimization",
        enabled: isEnabled,
      });
      this.updateEcoModeBasedOnSettings();
    });
  },

  toggleTabSuspension: function (isEnabled) {
    chrome.storage.sync.set({ tabSuspensionEnabled: isEnabled }, () => {
      console.log("Tab suspension is set to " + isEnabled);
      chrome.runtime.sendMessage({
        action: "updateTabSuspension",
        enabled: isEnabled,
      });
      this.updateEcoModeBasedOnSettings();
    });
  },

  toggleDarkMode: function (isEnabled) {
    chrome.storage.sync.set({ darkModeEnabled: isEnabled }, () => {
      console.log("Dark mode is set to " + isEnabled);
      chrome.runtime.sendMessage({
        action: "toggleDarkMode",
        enabled: isEnabled,
      }, function(response) {
        if (response && response.success) {
          console.log("Dark mode toggled successfully");
        } else {
          console.error("Failed to toggle dark mode");
        }
      });
      this.updateEcoModeBasedOnSettings();
    });
  },

  updateAllToggles: function (isEnabled) {
    const toggles = [
      "imageOptimizationToggle",
      "videoOptimizationToggle",
      "tabSuspensionToggle"
    ];

    toggles.forEach(toggleId => {
      const toggle = document.getElementById(toggleId);
      toggle.checked = isEnabled;
    });
  },

  updateEcoModeBasedOnSettings: function () {
    chrome.storage.sync.get(
      [
        "imageOptimizationEnabled",
        "videoOptimizationEnabled",
        "tabSuspensionEnabled"
      ],
      (data) => {
        const anyEnabled = Object.values(data).some(Boolean);
        const ecoModeToggle = document.getElementById("ecoModeToggle");
        
        if (anyEnabled && !ecoModeToggle.checked) {
          ecoModeToggle.checked = true;
          chrome.storage.sync.set({ ecoModeEnabled: true });
        } else if (!anyEnabled && ecoModeToggle.checked) {
          ecoModeToggle.checked = false;
          chrome.storage.sync.set({ ecoModeEnabled: false });
        }
      }
    );
  },
};

document.addEventListener(
  "DOMContentLoaded",
  CarbonCalculator.Main.initializeExtension.bind(CarbonCalculator.Main)
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "popupOpened") {
    CarbonCalculator.Main.estimateFootprintAndSavings();
  }
});