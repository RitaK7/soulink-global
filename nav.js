// nav.js
(function () {
  if (typeof document === "undefined") return;

  const MOBILE_BREAKPOINT = 960;

  function initNavbar(header) {
    if (!header) return;

    const toggle = header.querySelector(".nav-toggle");
    const linksContainer = header.querySelector(".nav-links");
    if (!linksContainer) return;

    // Highlight active link based on data-active
    const activeName = header.getAttribute("data-active");
    if (activeName) {
      const linkEls = linksContainer.querySelectorAll("a[data-page]");
      linkEls.forEach((a) => {
        if (a.getAttribute("data-page") === activeName) {
          a.classList.add("active");
          a.setAttribute("aria-current", "page");
        } else {
          a.classList.remove("active");
          a.removeAttribute("aria-current");
        }
      });
    }

    function setOpen(isOpen) {
      if (!toggle) return;
      toggle.setAttribute("aria-expanded", String(isOpen));
      header.classList.toggle("is-open", isOpen);
      linksContainer.classList.toggle("is-open", isOpen);
    }

    // Initial state
    setOpen(false);

    if (toggle) {
      toggle.addEventListener("click", function () {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        setOpen(!expanded);
      });
    }

    // Close menu when a link is clicked on mobile
    linksContainer.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", function () {
        if (window.innerWidth < MOBILE_BREAKPOINT) {
          setOpen(false);
        }
      });
    });

    // Handle resize to reset menu on desktop
    window.addEventListener("resize", function () {
      if (window.innerWidth >= MOBILE_BREAKPOINT) {
        setOpen(false);
      }
    });
  }

  function initAllNavbars() {
    const navbars = document.querySelectorAll("header.navbar.soulink-nav");
    navbars.forEach(initNavbar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAllNavbars);
  } else {
    initAllNavbars();
  }
})();
