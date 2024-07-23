// carbonCalculations.js
CarbonCalculator.Calculations = {
  calculateFootprint: async function (results) {
    let totalData = 0;
    let searchCount = 0;
    let totalTime = 0;
    let pagesWithVideo = 0;

    results.forEach((page) => {
      totalData += CarbonCalculator.Constants.AVG_PAGE_SIZE_MB;
      if (page.url.match(/\b(google|bing)\.com\/search\b/)) {
        searchCount++;
      }
      if (page.hasVideo) {
        pagesWithVideo++;
      }
      totalTime += CarbonCalculator.BrowserHistory.estimatePageViewTime(page);
    });

    const dataInGB = totalData / 1000;
    const hasVideo = pagesWithVideo > 0;

    const energyConsumption = this.calculateEnergyConsumption(
      dataInGB,
      totalTime,
      searchCount,
      hasVideo,
  
    );
    return energyConsumption * CarbonCalculator.Constants.CARBON_PER_KWH * 1000;
  },

  calculateEnergyConsumption: function (
    dataInGB,
    totalTimeMinutes,
    searchCount,
    hasVideo,

  ) {
    let energyConsumption =
      dataInGB * CarbonCalculator.Constants.ENERGY_PER_GB_TRANSFERRED +
      totalTimeMinutes * CarbonCalculator.Constants.ENERGY_PER_MINUTE_DEVICE +
      searchCount * CarbonCalculator.Constants.ENERGY_PER_SEARCH;

    // Apply video optimization savings
    if (hasVideo) {
      const videoSavings =
        CarbonCalculator.Constants.VIDEO_PRELOAD_SAVINGS +
        CarbonCalculator.Constants.VIDEO_QUALITY_REDUCTION_SAVINGS +
        CarbonCalculator.Constants.VIDEO_AUTOPLAY_PREVENTION_SAVINGS;
      energyConsumption *=
        1 - videoSavings * CarbonCalculator.Constants.VIDEO_OPTIMIZATION_FACTOR;
    }

    return energyConsumption;
  },

  calculateSavings: function (footprint) {
    return footprint * (1 - CarbonCalculator.Constants.OPTIMIZATION_FACTOR);
  },
};
