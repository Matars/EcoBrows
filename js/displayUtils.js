// displayUtils.js
var CarbonCalculator = CarbonCalculator || {};

CarbonCalculator.DisplayUtils = {
  updateDisplay: function (elements, footprint, savings) {
    this.animateValue(
      elements.footprint,
      parseFloat(elements.footprint.textContent),
      footprint,
      1000
    );
    this.animateValue(
      elements.savings,
      parseFloat(elements.savings.textContent),
      savings,
      1000
    );
    this.animateValue(
      elements.totalSavings,
      parseFloat(elements.totalSavings.textContent),
      savings,
      1000
    );
  },

  animateValue: function (element, start, end, duration) {
    if (!element) {
      console.error("Element not found for animation");
      return;
    }

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = this.easeOutCubic(progress);
      const current = start + (end - start) * easedProgress;
      element.textContent = current.toFixed(2) + " g";
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        this.adjustFontSize();
      }
    };
    window.requestAnimationFrame(step);
  },

  easeOutCubic: function (t) {
    return 1 - Math.pow(1 - t, 3);
  },

  adjustFontSize: function () {
    const elements = [
      "carbonFootprint",
      "carbonSavings",
      "totalCarbonSavings",
    ].map((id) => document.getElementById(id));
    elements.forEach((element) => {
      if (!element) {
        console.warn(
          `Element with id '${element}' not found for font size adjustment`
        );
        return;
      }

      let fontSize = 24;
      element.style.fontSize = `${fontSize}px`;

      while (element.scrollWidth > element.offsetWidth && fontSize > 10) {
        fontSize--;
        element.style.fontSize = `${fontSize}px`;
      }
    });
  },

  displayError: function (message) {
    const errorElement = document.getElementById("errorMessage");
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    } else {
      console.error(message);
    }
  },
};
