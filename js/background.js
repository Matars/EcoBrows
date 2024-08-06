// Import the tabSuspension.js script
try {
  importScripts("tabSuspension.js");
  console.log("tabSuspension.js imported successfully");
} catch (error) {
  console.error("Error importing tabSuspension.js:", error);
}

// Listener for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in background:", request.action);

  if (request.action === "getPageSize") {
    fetch(request.url, { method: "HEAD" })
      .then((response) => {
        const contentLength = response.headers.get("content-length");
        sendResponse({
          size: contentLength ? parseInt(contentLength) : 2 * 1024 * 1024,
        });
      })
      .catch((error) => {
        console.error(`Error fetching page size for ${request.url}:`, error);
        sendResponse({ size: 2 * 1024 * 1024 });
      });
    return true; // Indicates that the response is sent asynchronously
  } else if (request.action === "updateTabSuspension") {
    console.log("Updating tab suspension:", request.enabled);
    if (
      typeof TabSuspension !== "undefined" &&
      TabSuspension.toggleSuspension
    ) {
      TabSuspension.toggleSuspension(request.enabled);
      sendResponse({ success: true });
    } else {
      console.error(
        "TabSuspension is not defined or doesn't have toggleSuspension method"
      );
      sendResponse({ success: false, error: "TabSuspension not available" });
    }
    return true; // Indicates that the response is sent asynchronously
  } else if (request.action === "toggleDarkMode") {
    chrome.storage.sync.set({ darkModeEnabled: request.enabled }, () => {
      sendResponse({ success: true });
      updateAllTabs();
    });
    return true; // Indicates that the response is sent asynchronously
  } else if (request.action === "toggleSiteException") {
    chrome.storage.sync.get(["siteExceptions"], (result) => {
      const siteExceptions = result.siteExceptions || {};
      siteExceptions[request.url] = request.isExcepted;
      chrome.storage.sync.set({ siteExceptions: siteExceptions }, () => {
        sendResponse({ success: true });
        updateCurrentTab();
      });
    });
    return true; // Indicates that the response is sent asynchronously
  } else if (request.action === "getDarkModeStatus") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].url) {
        const currentUrl = new URL(tabs[0].url).hostname;
        chrome.storage.sync.get(["darkModeEnabled", "siteExceptions"], (result) => {
          const darkModeEnabled = result.darkModeEnabled || false;
          const siteExceptions = result.siteExceptions || {};
          const isSiteExcepted = siteExceptions[currentUrl] || false;
          sendResponse({
            isDarkModeEnabled: darkModeEnabled,
            isSiteExcepted: isSiteExcepted,
          });
        });
      } else {
        sendResponse({ success: false, error: "No active tab found" });
      }
    });
    return true; // Indicates that the response is sent asynchronously
  } else if (request.action === "getCurrentUrl") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ url: tabs[0].url });
    });
    return true; // Indicates that the response is sent asynchronously
  }
});

// Initialize TabSuspension
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed/updated");
  if (typeof TabSuspension !== "undefined" && TabSuspension.init) {
    TabSuspension.init();
  } else {
    console.error("TabSuspension is not defined or doesn't have init method");
  }
});

function updateAllTabs() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      updateTabDarkMode(tab);
    });
  });
}

function updateCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      updateTabDarkMode(tabs[0]);
    }
  });
}

function updateTabDarkMode(tab) {
  const url = new URL(tab.url).hostname;
  chrome.storage.sync.get(["darkModeEnabled", "siteExceptions"], (result) => {
    const darkModeEnabled = result.darkModeEnabled || false;
    const siteExceptions = result.siteExceptions || {};
    const isSiteExcepted = siteExceptions[url] || false;
    const shouldApplyDarkMode = darkModeEnabled && !isSiteExcepted;

    chrome.tabs.sendMessage(
      tab.id,
      { action: "updateDarkMode", enabled: shouldApplyDarkMode },
      (response) => {
        if (chrome.runtime.lastError) {
          console.log(
            `Could not send message to tab ${tab.id}: ${chrome.runtime.lastError.message}`
          );
        }
      }
    );
  });
}

console.log("Background script loaded and initialized");