// ecoMode.js
var CarbonCalculator = CarbonCalculator || {};

CarbonCalculator.EcoMode = {
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
};
