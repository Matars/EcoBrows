// browserHistory.js
var CarbonCalculator = CarbonCalculator || {};

CarbonCalculator.BrowserHistory = {
  getNewBrowsingHistory: function (lastCalculationTimestamp) {
    return new Promise((resolve) => {
      chrome.history.search(
        {
          text: "",
          startTime: lastCalculationTimestamp,
          maxResults: 1000,
        },
        resolve
      );
    });
  },

  estimatePageViewTime: function (page) {
    const baseTime = 1;
    let multiplier = 1;

    if (page.url.includes("youtube.com")) {
      multiplier = 10;
    } else if (page.url.match(/\b(news|article|blog)\b/)) {
      multiplier = 3;
    }

    return baseTime * multiplier;
  },
};
