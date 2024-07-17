chrome.storage.sync.get(
  ["ecoModeEnabled", "imageOptimizationEnabled"],
  function (data) {
    if (data.ecoModeEnabled && data.imageOptimizationEnabled) {
      // Place your existing code here. This code will only run if both settings are enabled.
      console.log(
        "Both Eco Mode and Image Optimization are enabled. Running script..."
      );

      function handleDOMLoaded() {
        console.log("DOM fully loaded and parsed");
        const images = document.querySelectorAll("img");
        images.forEach((img) => {
          img.setAttribute("loading", "lazy");
        });
      }

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", handleDOMLoaded);
      } else {
        // The DOMContentLoaded event has already fired
        handleDOMLoaded();
      }
    } else {
      console.log(
        "Either Eco Mode or Image Optimization is disabled. Script will not run."
      );
    }
  }
);
