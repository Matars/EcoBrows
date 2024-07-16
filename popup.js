// Constants
const CARBON_PER_KWH = 0.4; // kgCO2e per kWh (average, updated)
const ENERGY_PER_GB_TRANSFERRED = 0.06; // kWh per GB (includes both server and network energy)
const AVG_PAGE_SIZE_MB = 2; // Average web page size in MB
const LAZY_LOADING_SAVINGS = 0.5; // 50% data savings from lazy loading
const UNUSED_ELEMENTS_SAVINGS = 0.2; // 20% savings from removing unused elements
const DEFERRED_SCRIPTS_SAVINGS = 0.1; // 10% savings from deferring scripts
const ENERGY_PER_MINUTE_DEVICE = 0.00021; // kWh per minute of device usage
const ENERGY_PER_SEARCH = 0.0003; // kWh per search query
const OPTIMIZATION_FACTOR = 0.7; // Assume 30% reduction in data transfer with optimization
const LAST_CALCULATION_KEY = "lastCalculationTimestamp";

// Function to estimate footprint and savings
async function estimateFootprintAndSavings() {
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

    const [lastCalculationTimestamp, storedFootprint] = await getStoredData();
    const newResults = await getNewBrowsingHistory(lastCalculationTimestamp);
    const newFootprint = await calculateFootprint(newResults);
    const totalFootprint = storedFootprint + newFootprint;
    const savings = calculateSavings(totalFootprint);

    await updateStoredData(totalFootprint);
    updateDisplay(elements, totalFootprint, savings);

    loadingIndicator.style.display = "none";
  } catch (error) {
    console.error("Error in estimateFootprintAndSavings:", error);
    displayError("An error occurred while calculating your carbon footprint.");
  }
}

// Function to get stored data
function getStoredData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ["totalFootprint", LAST_CALCULATION_KEY],
      (result) => {
        resolve([
          result[LAST_CALCULATION_KEY] || 0,
          result.totalFootprint || 0,
        ]);
      }
    );
  });
}

// Function to update stored data
function updateStoredData(totalFootprint) {
  return new Promise((resolve) => {
    const now = Date.now();
    chrome.storage.local.set(
      {
        totalFootprint: totalFootprint,
        [LAST_CALCULATION_KEY]: now,
      },
      resolve
    );
  });
}

// Function to get new browsing history since last calculation
function getNewBrowsingHistory(lastCalculationTimestamp) {
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
}

// Function to calculate footprint
async function calculateFootprint(results) {
  let totalData = 0;
  let searchCount = 0;
  let totalTime = 0;

  results.forEach((page) => {
    totalData += AVG_PAGE_SIZE_MB; // Assume average page size for simplicity
    if (page.url.match(/\b(google|bing)\.com\/search\b/)) {
      searchCount++;
    }
    totalTime += estimatePageViewTime(page);
  });

  const dataInGB = totalData / 1000;
  const energyConsumption = calculateEnergyConsumption(
    dataInGB,
    totalTime,
    searchCount
  );
  return energyConsumption * CARBON_PER_KWH * 1000; // Convert kgCO2e to gCO2e
}

// Helper function to calculate energy consumption
function calculateEnergyConsumption(dataInGB, totalTimeMinutes, searchCount) {
  return (
    dataInGB * ENERGY_PER_GB_TRANSFERRED +
    totalTimeMinutes * ENERGY_PER_MINUTE_DEVICE +
    searchCount * ENERGY_PER_SEARCH
  );
}

// Function to estimate page view time based on content type
function estimatePageViewTime(page) {
  const baseTime = 1; // Default to 1 minute
  let multiplier = 1;

  if (page.url.includes("youtube.com")) {
    multiplier = 10; // Assume longer time for video content
  } else if (page.url.match(/\b(news|article|blog)\b/)) {
    multiplier = 3; // Assume longer time for reading content
  }

  return baseTime * multiplier;
}

// Function to calculate savings
function calculateSavings(footprint) {
  return footprint * (1 - OPTIMIZATION_FACTOR);
}

// Function to update the display
function updateDisplay(elements, footprint, savings) {
  animateValue(
    elements.footprint,
    parseFloat(elements.footprint.textContent),
    footprint,
    1000
  );
  animateValue(
    elements.savings,
    parseFloat(elements.savings.textContent),
    savings,
    1000
  );
  // For simplicity, we're using the same value for totalSavings as savings
  animateValue(
    elements.totalSavings,
    parseFloat(elements.totalSavings.textContent),
    savings,
    1000
  );
}

// Animation function with easing
function animateValue(element, start, end, duration) {
  if (!element) {
    console.error("Element not found for animation");
    return;
  }

  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const easedProgress = easeOutCubic(progress);
    const current = start + (end - start) * easedProgress;
    element.textContent = current.toFixed(2) + " g";
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      adjustFontSize();
    }
  };
  window.requestAnimationFrame(step);
}

// Easing function for smoother animation
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Function to adjust font size
function adjustFontSize() {
  const elements = [
    "carbonFootprint",
    "carbonSavings",
    "totalCarbonSavings",
  ].map((id) => document.getElementById(id));
  elements.forEach((element) => {
    if (!element) {
      console.warn(
        `Element with id '${element}' not found for font size adjustment`
      );
      return;
    }

    let fontSize = 24;
    element.style.fontSize = `${fontSize}px`;

    while (element.scrollWidth > element.offsetWidth && fontSize > 10) {
      fontSize--;
      element.style.fontSize = `${fontSize}px`;
    }
  });
}

// Function to display error messages
function displayError(message) {
  const errorElement = document.getElementById("errorMessage");
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = "block";
  } else {
    console.error(message);
  }
}

// Function to toggle eco mode
function toggleEcoMode(isEnabled) {
  chrome.storage.sync.set({ ecoModeEnabled: isEnabled }, () => {
    console.log("Eco mode is set to " + isEnabled);
    chrome.runtime.sendMessage({ action: "updateEcoMode", enabled: isEnabled });
    estimateFootprintAndSavings();
  });
}

// Function to toggle image optimization
function toggleImageOptimization(isEnabled) {
  chrome.storage.sync.set({ imageOptimizationEnabled: isEnabled }, () => {
    console.log("Image optimization is set to " + isEnabled);
    chrome.runtime.sendMessage({
      action: "updateImageOptimization",
      enabled: isEnabled,
    });
  });
}

// Function to initialize the extension
function initializeExtension() {
  const ecoModeToggle = document.getElementById("ecoModeToggle");
  const imageOptimizationToggle = document.getElementById(
    "imageOptimizationToggle"
  );

  chrome.storage.sync.get(
    ["ecoModeEnabled", "imageOptimizationEnabled"],
    (data) => {
      ecoModeToggle.checked = data.ecoModeEnabled ?? true;
      imageOptimizationToggle.checked = data.imageOptimizationEnabled ?? true;

      toggleEcoMode(ecoModeToggle.checked);
      toggleImageOptimization(imageOptimizationToggle.checked);
    }
  );

  ecoModeToggle.addEventListener("change", () =>
    toggleEcoMode(ecoModeToggle.checked)
  );
  imageOptimizationToggle.addEventListener("change", () =>
    toggleImageOptimization(imageOptimizationToggle.checked)
  );

  const today = new Date().toDateString();
  chrome.storage.local.get("lastResetDate", (result) => {
    if (result.lastResetDate !== today) {
      chrome.storage.local.set(
        {
          lastResetDate: today,
          totalFootprint: 0,
          [LAST_CALCULATION_KEY]: Date.now(),
        },
        () => {
          estimateFootprintAndSavings();
        }
      );
    } else {
      estimateFootprintAndSavings();
    }
  });
}

// OTHER --------------------------------------------------------------------------------------------

// Function to update the display
function updateDisplay(elements, footprint, savings) {
  animateValue(
    elements.footprint,
    parseFloat(elements.footprint.textContent),
    footprint,
    1000
  );
  animateValue(
    elements.savings,
    parseFloat(elements.savings.textContent),
    savings,
    1000
  );
  // For simplicity, we're using the same value for totalSavings as savings
  animateValue(
    elements.totalSavings,
    parseFloat(elements.totalSavings.textContent),
    savings,
    1000
  );
}

// Animation function with easing
function animateValue(element, start, end, duration) {
  if (!element) {
    console.error("Element not found for animation");
    return;
  }

  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const easedProgress = easeOutCubic(progress);
    const current = start + (end - start) * easedProgress;
    element.textContent = current.toFixed(2) + " g";
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      adjustFontSize();
    }
  };
  window.requestAnimationFrame(step);
}

// Easing function for smoother animation
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Function to adjust font size
function adjustFontSize() {
  const elements = [
    "carbonFootprint",
    "carbonSavings",
    "totalCarbonSavings",
  ].map((id) => document.getElementById(id));
  elements.forEach((element) => {
    if (!element) {
      console.warn(
        `Element with id '${element}' not found for font size adjustment`
      );
      return;
    }

    let fontSize = 24;
    element.style.fontSize = `${fontSize}px`;

    while (element.scrollWidth > element.offsetWidth && fontSize > 10) {
      fontSize--;
      element.style.fontSize = `${fontSize}px`;
    }
  });
}

// Function to display error messages
function displayError(message) {
  const errorElement = document.getElementById("errorMessage");
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = "block";
  } else {
    console.error(message);
  }
}

// Function to toggle eco mode
function toggleEcoMode(isEnabled) {
  chrome.storage.sync.set({ ecoModeEnabled: isEnabled }, () => {
    console.log("Eco mode is set to " + isEnabled);
    chrome.runtime.sendMessage({ action: "updateEcoMode", enabled: isEnabled });
    estimateFootprintAndSavings();
  });
}

// Function to toggle image optimization
function toggleImageOptimization(isEnabled) {
  chrome.storage.sync.set({ imageOptimizationEnabled: isEnabled }, () => {
    console.log("Image optimization is set to " + isEnabled);
    chrome.runtime.sendMessage({
      action: "updateImageOptimization",
      enabled: isEnabled,
    });
  });
}

// Function to initialize the extension
function initializeExtension() {
  const ecoModeToggle = document.getElementById("ecoModeToggle");
  const imageOptimizationToggle = document.getElementById(
    "imageOptimizationToggle"
  );

  chrome.storage.sync.get(
    ["ecoModeEnabled", "imageOptimizationEnabled"],
    (data) => {
      ecoModeToggle.checked = data.ecoModeEnabled ?? true;
      imageOptimizationToggle.checked = data.imageOptimizationEnabled ?? true;

      toggleEcoMode(ecoModeToggle.checked);
      toggleImageOptimization(imageOptimizationToggle.checked);
    }
  );

  ecoModeToggle.addEventListener("change", () =>
    toggleEcoMode(ecoModeToggle.checked)
  );
  imageOptimizationToggle.addEventListener("change", () =>
    toggleImageOptimization(imageOptimizationToggle.checked)
  );

  const today = new Date().toDateString();
  chrome.storage.local.get("lastResetDate", (result) => {
    if (result.lastResetDate !== today) {
      chrome.storage.local.set(
        {
          lastResetDate: today,
          totalFootprint: 0,
          [LAST_CALCULATION_KEY]: Date.now(),
        },
        () => {
          estimateFootprintAndSavings();
        }
      );
    } else {
      estimateFootprintAndSavings();
    }
  });
}

// Event listeners
document.addEventListener("DOMContentLoaded", initializeExtension);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "popupOpened") {
    estimateFootprintAndSavings();
  }
});

// Set up MutationObserver to adjust font size when content changes
const observer = new MutationObserver(adjustFontSize);
const config = { childList: true, characterData: true, subtree: true };

["carbonFootprint", "carbonSavings", "totalCarbonSavings"].forEach((id) => {
  const element = document.getElementById(id);
  if (element) {
    observer.observe(element, config);
  } else {
    console.warn(`Element with id '${id}' not found for MutationObserver`);
  }
});
