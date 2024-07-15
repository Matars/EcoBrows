// File: popup.js

// Constants
const CARBON_PER_KWH = 0.475;
const SERVER_ENERGY_PER_GB = 0.00072;
const NETWORK_ENERGY_PER_GB = 0.00188;
const DEVICE_ENERGY_PER_HOUR = 0.06;
const SEARCH_ENGINE_ENERGY = 0.0003;

// Function to estimate footprint and savings
function estimateFootprintAndSavings() {
  const footprintElement = document.getElementById("carbonFootprint");
  const savingsElement = document.getElementById("carbonSavings");
  const totalSavingsElement = document.getElementById("totalCarbonSavings");

  if (!footprintElement || !savingsElement || !totalSavingsElement) {
    console.error("One or more required elements not found");
    return;
  }

  const currentTime = Date.now();
  const oneDayAgo = currentTime - 24 * 60 * 60 * 1000;

  chrome.history.search(
    { text: "", startTime: oneDayAgo, maxResults: 1000 },
    function (results) {
      calculateFootprint(results)
        .then(footprint => {
          const savings = calculateSavings(footprint);
          animateValue(footprintElement, 0, footprint, 1000);
          animateValue(savingsElement, 0, savings, 1000);
          
          return estimateTotalSavings(results);
        })
        .then(totalSavings => {
          animateValue(totalSavingsElement, 0, totalSavings, 1000);
        })
        .catch(error => {
          console.error("Error in estimateFootprintAndSavings:", error);
          footprintElement.textContent = "Error";
          savingsElement.textContent = "Error";
          totalSavingsElement.textContent = "Error";
        });
    }
  );
}

// Improved function to calculate footprint
async function calculateFootprint(results) {
  let totalData = 0;
  let searchCount = 0;
  let totalTime = 0;

  for (const page of results) {
    try {
      const pageSize = await getPageSize(page.url);
      totalData += pageSize / 1024 / 1024; // Convert bytes to MB
      
      if (page.url.includes("google.com/search") || page.url.includes("bing.com/search")) {
        searchCount++;
      }

      totalTime += 1 / 60; // Estimate 1 minute per page, convert to hours
    } catch (error) {
      console.warn(`Error processing page ${page.url}:`, error);
      // Continue with the next page
    }
  }

  const dataInGB = totalData / 1000;
  const serverEnergy = dataInGB * SERVER_ENERGY_PER_GB;
  const networkEnergy = dataInGB * NETWORK_ENERGY_PER_GB;
  const deviceEnergy = totalTime * DEVICE_ENERGY_PER_HOUR;
  const searchEnergy = searchCount * SEARCH_ENGINE_ENERGY;

  const totalEnergy = serverEnergy + networkEnergy + deviceEnergy + searchEnergy;
  return totalEnergy * CARBON_PER_KWH * 1000; // Convert kgCO2e to gCO2e
}

// Helper function to get the size of a webpage
function getPageSize(url) {
  return new Promise((resolve, reject) => {
    fetch(url, { method: 'HEAD', mode: 'no-cors' })
      .then(response => {
        const contentLength = response.headers.get('content-length');
        resolve(contentLength ? parseInt(contentLength) : 2 * 1024 * 1024); // Default to 2MB if size is unknown
      })
      .catch(() => resolve(2 * 1024 * 1024)); // Default to 2MB if fetch fails
  });
}

// Function to calculate savings
function calculateSavings(footprint) {
  const AVG_IMAGE_PERCENTAGE = 0.5;
  const IMAGE_REDUCTION_FACTOR = 0.5;
  const imageFootprint = footprint * AVG_IMAGE_PERCENTAGE;
  return imageFootprint * IMAGE_REDUCTION_FACTOR;
}

// Function to estimate total savings
async function estimateTotalSavings(results) {
  try {
    const footprintWithExtension = await calculateFootprint(results);
    const footprintWithoutExtension = await calculateFootprintWithoutExtension(results);
    return footprintWithoutExtension - footprintWithExtension;
  } catch (error) {
    console.error("Error in estimateTotalSavings:", error);
    return 0; // Return 0 if there's an error
  }
}

// Function to calculate footprint without extension optimizations
async function calculateFootprintWithoutExtension(results) {
  // Implementation similar to calculateFootprint, but using getPageSizeWithoutOptimization
  // ... (similar to calculateFootprint, but use getPageSizeWithoutOptimization)
}

// Helper function to get the size of a webpage without optimization
function getPageSizeWithoutOptimization(url) {
  return new Promise((resolve) => {
    fetch(url, { method: 'HEAD', mode: 'no-cors' })
      .then(response => {
        const contentLength = response.headers.get('content-length');
        // Assume 20% larger size without optimization
        resolve(contentLength ? parseInt(contentLength) * 1.2 : 2.4 * 1024 * 1024);
      })
      .catch(() => resolve(2.4 * 1024 * 1024)); // Default to 2.4MB if fetch fails
  });
}

function animateValue(element, start, end, duration) {
  if (!element) {
    console.error("Element not found for animation");
    return;
  }

  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    element.textContent = (progress * (end - start) + start).toFixed(2) + " g";
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      adjustFontSize();
    }
  };
  window.requestAnimationFrame(step);
}

// Function to adjust font size based on the length of the number
function adjustFontSize() {
  const elements = [
    document.getElementById("carbonFootprint"),
    document.getElementById("carbonSavings"),
    document.getElementById("totalCarbonSavings")
  ];

  elements.forEach((element) => {
    if (!element) {
      console.warn("Element not found for font size adjustment");
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

// Function to toggle eco mode
function toggleEcoMode(isEnabled) {
  chrome.storage.sync.set({ ecoModeEnabled: isEnabled }, function () {
    console.log("Eco mode is set to " + isEnabled);
    estimateFootprintAndSavings();
  });
}

// Initialize the extension
function initializeExtension() {
  const toggleElement = document.getElementById("ecoModeToggle");
  if (!toggleElement) {
    console.error("Eco mode toggle element not found");
    return;
  }

  chrome.storage.sync.get("ecoModeEnabled", function (data) {
    const isEcoModeEnabled = data.ecoModeEnabled !== undefined ? data.ecoModeEnabled : true;
    toggleElement.checked = isEcoModeEnabled;
    toggleEcoMode(isEcoModeEnabled);
  });

  toggleElement.addEventListener("change", function () {
    toggleEcoMode(this.checked);
  });

  estimateFootprintAndSavings();
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  initializeExtension();
  adjustFontSize();
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "popupOpened") {
    estimateFootprintAndSavings();
  }
});

// Set up MutationObserver to adjust font size when content changes
const observerCallback = (mutationsList, observer) => {
  adjustFontSize();
};

const observer = new MutationObserver(observerCallback);
const config = { childList: true, characterData: true, subtree: true };

["carbonFootprint", "carbonSavings", "totalCarbonSavings"].forEach(id => {
  const element = document.getElementById(id);
  if (element) {
    observer.observe(element, config);
  } else {
    console.warn(`Element with id '${id}' not found for MutationObserver`);
  }
});