// Define dark mode styles
const DARK_MODE_STYLES = `
  html, body {
    background-color: #1a1a1a !important;
    color: #e0e0e0 !important;
  }
  a {
    color: #7fdbff !important;
  }
  input, textarea, select {
    background-color: #2a2a2a !important;
    color: #e0e0e0 !important;
    border-color: #444 !important;
  }
  /* Add more specific styles as needed */
`;

// Function to apply dark mode to a specific tab
function applyDarkMode(tabId, isEnabled) {
  if (isEnabled) {
    chrome.scripting.insertCSS({
      target: { tabId: tabId },
      css: DARK_MODE_STYLES
    });
  } else {
    chrome.scripting.removeCSS({
      target: { tabId: tabId },
      css: DARK_MODE_STYLES
    });
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageSize") {
    fetch(request.url, { method: 'HEAD' })
      .then(response => {
        const contentLength = response.headers.get('content-length');
        sendResponse({ size: contentLength ? parseInt(contentLength) : 2 * 1024 * 1024 });
      })
      .catch(error => {
        console.error(`Error fetching page size for ${request.url}:`, error);
        sendResponse({ size: 2 * 1024 * 1024 });
      });
    return true; // Indicates that the response is sent asynchronously
  }

  if (request.action === "updateDarkMode") {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: applyDarkMode,
          args: [tab.id, request.enabled]
        });
      });
    });
    sendResponse({ success: true });
    return true;
  }
});

// Listen for tab updates to apply dark mode if enabled
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.sync.get(['darkModeEnabled'], (data) => {
      if (data.darkModeEnabled) {
        applyDarkMode(tabId, true);
      }
    });
  }
});