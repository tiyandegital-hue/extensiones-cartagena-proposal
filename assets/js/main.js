/* Extensiones Cartagena Peluquería — shared site JS.
   BUSINESS_NAME is the ONE swappable constant for the business name:
   every visible instance is rendered from it on load. */
const BUSINESS_NAME = "Extensiones Cartagena Peluquería";
const WHATSAPP_NUMBER = "573242954655"; // +57 324 295 4655 (verified)
const WA_LINK = "https://wa.me/" + WHATSAPP_NUMBER;

document.addEventListener("DOMContentLoaded", () => {
  // Business name as one constant
  document.querySelectorAll("[data-business-name]").forEach((el) => {
    el.textContent = BUSINESS_NAME;
  });
  // Footer year
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = "2026";
  });

  // Contact form → opens WhatsApp with the visitor's own message
  // (no data is stored on this site).
  const waForm = document.getElementById("wa-form");
  if (waForm) {
    waForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("wa-name").value.trim();
      const msg = document.getElementById("wa-message").value.trim();
      const text =
        "Hola, soy " + (name || "una clienta") + ". " + msg;
      window.open(WA_LINK + "?text=" + encodeURIComponent(text), "_blank", "noopener");
    });
  }

  // Mobile nav
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Slow, fluid reveal on scroll (.reveal is only hidden when html.js
  // is present, so content stays visible if this script fails)
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }
});
