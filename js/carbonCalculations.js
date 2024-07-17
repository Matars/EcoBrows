// carbonCalculations.js
var CarbonCalculator = CarbonCalculator || {};

CarbonCalculator.Calculations = {
  calculateFootprint: async function (results) {
    let totalData = 0;
    let searchCount = 0;
    let totalTime = 0;

    results.forEach((page) => {
      totalData += CarbonCalculator.Constants.AVG_PAGE_SIZE_MB;
      if (page.url.match(/\b(google|bing)\.com\/search\b/)) {
        searchCount++;
      }
      totalTime += CarbonCalculator.BrowserHistory.estimatePageViewTime(page);
    });

    const dataInGB = totalData / 1000;
    const energyConsumption = this.calculateEnergyConsumption(
      dataInGB,
      totalTime,
      searchCount
    );
    return energyConsumption * CarbonCalculator.Constants.CARBON_PER_KWH * 1000;
  },

  calculateEnergyConsumption: function (
    dataInGB,
    totalTimeMinutes,
    searchCount
  ) {
    return (
      dataInGB * CarbonCalculator.Constants.ENERGY_PER_GB_TRANSFERRED +
      totalTimeMinutes * CarbonCalculator.Constants.ENERGY_PER_MINUTE_DEVICE +
      searchCount * CarbonCalculator.Constants.ENERGY_PER_SEARCH
    );
  },

  calculateSavings: function (footprint) {
    return footprint * (1 - CarbonCalculator.Constants.OPTIMIZATION_FACTOR);
  },
};
