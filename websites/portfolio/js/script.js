(function () {
  "use strict";

  var toggle = document.getElementById("menu-toggle");
  var navLinks = document.getElementById("nav-links");
  var navCta = document.querySelector(".nav-cta");

  if (navCta) {
    navCta.remove();
  }

  if (toggle && navLinks) {
    toggle.addEventListener("click", function () {
      var isOpen = navLinks.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.addEventListener("click", function (event) {
      if (event.target.tagName === "A") {
        navLinks.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navLinks.classList.contains("open")) {
        navLinks.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  var heroVisual = document.querySelector(".hero-visual");
  if (heroVisual && !heroVisual.querySelector(".profile-photo")) {
    heroVisual.style.position = "relative";
    heroVisual.style.minHeight = "28rem";

    var profilePhoto = document.createElement("img");
    profilePhoto.className = "profile-photo";
    profilePhoto.src = "images/profile.jpg";
    profilePhoto.alt = "Diego Bogado Madelaire";
    profilePhoto.style.position = "absolute";
    profilePhoto.style.top = "0";
    profilePhoto.style.right = "0";
    profilePhoto.style.width = "min(100%, 21rem)";
    profilePhoto.style.height = "28rem";
    profilePhoto.style.objectFit = "cover";
    profilePhoto.style.objectPosition = "center top";
    profilePhoto.style.borderRadius = "1.25rem";
    profilePhoto.style.boxShadow = "0 24px 60px rgba(23, 20, 15, 0.10)";
    profilePhoto.style.zIndex = "1";
    heroVisual.prepend(profilePhoto);

    var heroMark = heroVisual.querySelector(".hero-mark");
    if (heroMark) {
      heroMark.remove();
    }
  }

  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  var revealEls = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  var flowPath = document.getElementById("flow-path");
  if (flowPath && !prefersReducedMotion) {
    var length = flowPath.getTotalLength();
    flowPath.style.strokeDasharray = String(length);
    flowPath.style.strokeDashoffset = String(length);
    flowPath.getBoundingClientRect();
    flowPath.style.transition = "stroke-dashoffset 1.4s ease";
    requestAnimationFrame(function () {
      flowPath.style.strokeDashoffset = "0";
    });
  }
})();
