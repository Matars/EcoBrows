const INACTIVITY_THRESHOLD =  20 * 1000; // 5 minutes
const suspendedTabs = new Set();
const tabTimers = {};

function onTabActivated(activeInfo) {
  clearTimeout(tabTimers[activeInfo.tabId]);
  delete tabTimers[activeInfo.tabId];
}

function onTabUpdated(tabId, changeInfo, tab) {
  if (changeInfo.status === "complete") {
    if (suspendedTabs.has(tabId)) {
      suspendedTabs.delete(tabId);
      chrome.tabs.reload(tabId);
    } else {
      clearTimeout(tabTimers[tabId]);
      tabTimers[tabId] = setTimeout(() => suspendTab(tabId), INACTIVITY_THRESHOLD);
    }
  }
}

function onTabRemoved(tabId) {
  clearTimeout(tabTimers[tabId]);
  delete tabTimers[tabId];
  suspendedTabs.delete(tabId);
}

function suspendTab(tabId) {
  suspendedTabs.add(tabId);
  chrome.tabs.discard(tabId);
}

function setupTabSuspension(enabled) {
  if (enabled) {
    chrome.tabs.onActivated.addListener(onTabActivated);
    chrome.tabs.onUpdated.addListener(onTabUpdated);
    chrome.tabs.onRemoved.addListener(onTabRemoved);
  } else {
    chrome.tabs.onActivated.removeListener(onTabActivated);
    chrome.tabs.onUpdated.removeListener(onTabUpdated);
    chrome.tabs.onRemoved.removeListener(onTabRemoved);
  }
}

chrome.storage.sync.get(["tabSuspensionEnabled"], (data) => {
  setupTabSuspension(data.tabSuspensionEnabled);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateTabSuspension") {
    setupTabSuspension(request.enabled);
  } else if (request.action === "getPageSize") {
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
  }
});