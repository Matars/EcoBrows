// main.js
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
    const imageOptimizationToggle = document.getElementById(
      "imageOptimizationToggle"
    );
    const videoOptimizationToggle = document.getElementById(
      "videoOptimizationToggle"
    );

    chrome.storage.sync.get(
      [
        "ecoModeEnabled",
        "imageOptimizationEnabled",
        "videoOptimizationEnabled",
      ],
      (data) => {
        ecoModeToggle.checked = data.ecoModeEnabled ?? true;
        imageOptimizationToggle.checked = data.imageOptimizationEnabled ?? true;
        videoOptimizationToggle.checked =
          data.videoOptimizationEnabled ?? false;

        this.toggleEcoMode(ecoModeToggle.checked);
        this.toggleImageOptimization(imageOptimizationToggle.checked);
        this.toggleVideoOptimization(videoOptimizationToggle.checked);
      }
    );

    ecoModeToggle.addEventListener("change", () =>
      this.toggleEcoMode(ecoModeToggle.checked)
    );
    imageOptimizationToggle.addEventListener("change", () =>
      this.toggleImageOptimization(imageOptimizationToggle.checked)
    );
    videoOptimizationToggle.addEventListener("change", () =>
      this.toggleVideoOptimization(videoOptimizationToggle.checked)
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
    chrome.storage.sync.set({ ecoModeEnabled: isEnabled }, () => {
      console.log("Eco mode is set to " + isEnabled);
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
    });
  },

  toggleVideoOptimization: function (isEnabled) {
    chrome.storage.sync.set({ videoOptimizationEnabled: isEnabled }, () => {
      console.log("Video optimization is set to " + isEnabled);
      chrome.runtime.sendMessage({
        action: "updateVideoOptimization",
        enabled: isEnabled,
      });
    });
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
