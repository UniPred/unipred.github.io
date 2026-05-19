document.addEventListener("DOMContentLoaded", function () {
  var carousels = document.querySelectorAll("[data-demo-carousel]");

  carousels.forEach(function (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".demo-video-slide"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-demo-dot]"));
    var status = carousel.querySelector("[data-demo-status]");
    var prevButton = carousel.querySelector("[data-demo-prev]");
    var nextButton = carousel.querySelector("[data-demo-next]");
    var activeIndex = slides.findIndex(function (slide) {
      return slide.classList.contains("is-active");
    });

    if (!slides.length) {
      return;
    }

    if (activeIndex < 0) {
      activeIndex = 0;
    }

    function activateSlide(index, shouldPlay) {
      activeIndex = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        var isActive = slideIndex === activeIndex;
        var video = slide.querySelector("video");

        slide.classList.toggle("is-active", isActive);

        if (!video) {
          return;
        }

        if (!isActive) {
          video.pause();
          return;
        }

        if (shouldPlay) {
          var playRequest = video.play();

          if (playRequest && typeof playRequest.catch === "function") {
            playRequest.catch(function () {});
          }
        }
      });

      dots.forEach(function (dot, dotIndex) {
        var isActive = dotIndex === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-current", isActive ? "true" : "false");
      });

      if (status) {
        status.textContent = slides[activeIndex].getAttribute("data-demo-label") || "Video " + (activeIndex + 1);
      }
    }

    if (prevButton) {
      prevButton.addEventListener("click", function () {
        activateSlide(activeIndex - 1, true);
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", function () {
        activateSlide(activeIndex + 1, true);
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        activateSlide(dotIndex, true);
      });
    });

    activateSlide(activeIndex, false);
  });
});
