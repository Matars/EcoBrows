chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
  }
});
