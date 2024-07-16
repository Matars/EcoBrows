// This file can be used for any content script functionality
// For now, it's empty as we don't need any specific content script actions
console.log("EcoBrowse content script loaded");

document.addEventListener("DOMContentLoaded", function () {
  const lazyImages = document.querySelectorAll("img[data-src]");
  const lazyLoad = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        observer.unobserve(img);
      }
    });
  };

  const observer = new IntersectionObserver(lazyLoad, {
    rootMargin: "0px 0px 200px 0px",
  });
  lazyImages.forEach((image) => {
    observer.observe(image);
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const unusedElements = document.querySelectorAll(".ads, .trackers");
  unusedElements.forEach((element) => element.remove());
});

const scripts = document.querySelectorAll("script");
scripts.forEach((script) => {
  if (!script.defer && !script.async) {
    script.defer = true;
  }
});
