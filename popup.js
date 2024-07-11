// Function to estimate footprint and savings
function estimateFootprintAndSavings() {
  const footprintElement = document.getElementById("carbonFootprint");
  const savingsElement = document.getElementById("carbonSavings");

  // Get the current timestamp
  const currentTime = Date.now();
  // Calculate the timestamp for 24 hours ago
  const oneDayAgo = currentTime - 24 * 60 * 60 * 1000;

  chrome.history.search(
    { text: "", startTime: oneDayAgo, maxResults: 1000 },
    function (results) {
      const footprint = calculateFootprint(results);
      const savings = calculateSavings(footprint);
      animateValue(footprintElement, 0, footprint, 1000);
      animateValue(savingsElement, 0, savings, 1000);
    }
  );
}

// Function to calculate footprint (as previously defined)
function calculateFootprint(results) {
  const CARBON_PER_GB = 0.06; // 60g CO2 per GB of data transfer
  const CARBON_PER_SEARCH = 0.2; // 0.2g CO2 per search query
  const AVG_PAGE_SIZE_MB = 2; // Average web page size in MB

  let totalData = 0;
  let searchCount = 0;

  results.forEach((page) => {
    totalData += AVG_PAGE_SIZE_MB;
    if (
      page.url.includes("google.com/search") ||
      page.url.includes("bing.com/search")
    ) {
      searchCount++;
    }
  });

  const dataInGB = totalData / 1000;
  const dataFootprint = dataInGB * CARBON_PER_GB;
  const searchFootprint = searchCount * CARBON_PER_SEARCH;
  const totalFootprint = dataFootprint + searchFootprint;

  return totalFootprint;
}

// Function to calculate savings (as previously defined)
function calculateSavings(footprint) {
  const AVG_IMAGE_PERCENTAGE = 0.5;
  const IMAGE_REDUCTION_FACTOR = 0.5;
  const imageFootprint = footprint * AVG_IMAGE_PERCENTAGE;
  const imageSavings = imageFootprint * IMAGE_REDUCTION_FACTOR;
  return imageSavings;
}

function animateValue(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    element.textContent = (progress * (end - start) + start).toFixed(2) + " g";
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      // Call adjustFontSize after animation completes
      adjustFontSize();
    }
  };
  window.requestAnimationFrame(step);
}

// Function to adjust font size based on the length of the number
function adjustFontSize() {
  const footprintElement = document.getElementById("carbonFootprint");
  const savingsElement = document.getElementById("carbonSavings");
  const elements = [footprintElement, savingsElement];

  elements.forEach((element) => {
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
    // Recalculate when eco mode is toggled
    estimateFootprintAndSavings();
  });
}

// Initialize the extension
function initializeExtension() {
  const toggleElement = document.getElementById("ecoModeToggle");

  // Load saved eco mode state
  chrome.storage.sync.get("ecoModeEnabled", function (data) {
    const isEcoModeEnabled =
      data.ecoModeEnabled !== undefined ? data.ecoModeEnabled : true;
    toggleElement.checked = isEcoModeEnabled;
    toggleEcoMode(isEcoModeEnabled);
  });

  // Add event listener for toggle
  toggleElement.addEventListener("change", function () {
    toggleEcoMode(this.checked);
  });

  // Initial calculation
  estimateFootprintAndSavings();
}

// Call the initialization function when the popup opens
document.addEventListener("DOMContentLoaded", initializeExtension);
// Call adjustFontSize on load
document.addEventListener("DOMContentLoaded", adjustFontSize);

// Recalculate when the popup is opened
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "popupOpened") {
    estimateFootprintAndSavings();
  }
});


// Set up MutationObserver to adjust font size when content changes
const observer = new MutationObserver(adjustFontSize);
observer.observe(document.getElementById('carbonFootprint'), { childList: true, characterData: true, subtree: true });
observer.observe(document.getElementById('carbonSavings'), { childList: true, characterData: true, subtree: true });

