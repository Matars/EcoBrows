// Import the tabSuspension.js script
try {
  importScripts('tabSuspension.js');
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
    if (typeof TabSuspension !== 'undefined' && TabSuspension.toggleSuspension) {
      TabSuspension.toggleSuspension(request.enabled);
      sendResponse({ success: true });
    } else {
      console.error("TabSuspension is not defined or doesn't have toggleSuspension method");
      sendResponse({ success: false, error: "TabSuspension not available" });
    }
    return true; // Indicates that the response is sent asynchronously
  }
});

// Initialize TabSuspension
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed/updated");
  if (typeof TabSuspension !== 'undefined' && TabSuspension.init) {
    TabSuspension.init();
  } else {
    console.error("TabSuspension is not defined or doesn't have init method");
  }
});

console.log("Background script loaded and initialized");