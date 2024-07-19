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

    chrome.storage.sync.get(
      ["ecoModeEnabled", "imageOptimizationEnabled"],
      (data) => {
        ecoModeToggle.checked = data.ecoModeEnabled ?? true;
        imageOptimizationToggle.checked = data.imageOptimizationEnabled ?? true;

        CarbonCalculator.EcoMode.toggleEcoMode(ecoModeToggle.checked);
        CarbonCalculator.EcoMode.toggleImageOptimization(
          imageOptimizationToggle.checked
        );
      }
    );

    ecoModeToggle.addEventListener("change", () =>
      CarbonCalculator.EcoMode.toggleEcoMode(ecoModeToggle.checked)
    );
    imageOptimizationToggle.addEventListener("change", () =>
      CarbonCalculator.EcoMode.toggleImageOptimization(
        imageOptimizationToggle.checked
      )
    );

    chrome.storage.local.get(["lastResetDate", "totalFootprint"], (result) => {
      const today = new Date().toDateString();
      if (result.lastResetDate !== today) {
        // Update the last reset date, but keep the current footprint
        chrome.storage.local.set(
          {
            lastResetDate: today,
          },
          () => {
            this.estimateFootprintAndSavings();
          }
        );
      } else {
        this.estimateFootprintAndSavings();
      }
    });
  },
};

// Event listeners
document.addEventListener(
  "DOMContentLoaded",
  CarbonCalculator.Main.initializeExtension.bind(CarbonCalculator.Main)
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "popupOpened") {
    CarbonCalculator.Main.estimateFootprintAndSavings();
  }
});
