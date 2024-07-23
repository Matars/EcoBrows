// constants.js
var CarbonCalculator = CarbonCalculator || {};

CarbonCalculator.Constants = {
  // Existing constants
  CARBON_PER_KWH: 0.4,
  ENERGY_PER_GB_TRANSFERRED: 0.06,
  AVG_PAGE_SIZE_MB: 2,
  LAZY_LOADING_SAVINGS: 0.5,
  UNUSED_ELEMENTS_SAVINGS: 0.2,
  DEFERRED_SCRIPTS_SAVINGS: 0.1,
  ENERGY_PER_MINUTE_DEVICE: 0.00021,
  ENERGY_PER_SEARCH: 0.0003,
  OPTIMIZATION_FACTOR: 0.7,
  LAST_CALCULATION_KEY: "lastCalculationTimestamp",

  // New constants for video optimization and dark mode features
  VIDEO_PRELOAD_SAVINGS: 0.15,
  VIDEO_QUALITY_REDUCTION_SAVINGS: 0.3,
  VIDEO_AUTOPLAY_PREVENTION_SAVINGS: 0.1,
  VIDEO_OPTIMIZATION_FACTOR: 0.5,
};
