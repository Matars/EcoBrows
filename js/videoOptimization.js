// videoOptimization.js

chrome.storage.sync.get(["ecoModeEnabled"], function (data) {
  if (data.ecoModeEnabled) {
    function optimizeVideoQuality() {
      const videos = document.querySelectorAll("video");
      videos.forEach((video) => {
        video.setAttribute("preload", "none");
        video.setAttribute("playsinline", "");
        video.setAttribute("controlsList", "nodownload");

        video.addEventListener("play", () => {
          video.setAttribute("data-played", "true");
          video.setAttribute("controls", "");
        });

        if (!video.hasAttribute("data-quality-optimized")) {
          video.addEventListener("loadedmetadata", () => {
            const sources = video.querySelectorAll("source");
            sources.forEach((source) => {
              if (source.getAttribute("src")) {
                const url = new URL(source.getAttribute("src"));
                if (url.searchParams.has("quality")) {
                  url.searchParams.set("quality", "low");
                  source.setAttribute("src", url.toString());
                }
              }
            });
            video.setAttribute("data-quality-optimized", "true");
          });
        }
      });
    }

    function handleDOMLoaded() {
      optimizeVideoQuality();
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => optimizeVideoQuality());
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", handleDOMLoaded);
    } else {
      handleDOMLoaded();
    }
  }
});
