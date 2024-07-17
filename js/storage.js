// storage.js
var CarbonCalculator = CarbonCalculator || {};

CarbonCalculator.Storage = {
  getStoredData: function () {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        ["totalFootprint", CarbonCalculator.Constants.LAST_CALCULATION_KEY],
        (result) => {
          resolve([
            result[CarbonCalculator.Constants.LAST_CALCULATION_KEY] || 0,
            result.totalFootprint || 0,
          ]);
        }
      );
    });
  },

  updateStoredData: function (totalFootprint) {
    return new Promise((resolve) => {
      const now = Date.now();
      chrome.storage.local.set(
        {
          totalFootprint: totalFootprint,
          [CarbonCalculator.Constants.LAST_CALCULATION_KEY]: now,
        },
        resolve
      );
    });
  },
};
