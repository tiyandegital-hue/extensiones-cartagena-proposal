/* Catalog filters — Extensiones Cartagena.
   Single-select per group (Largo / Color / Textura / Método).
   Cards carry data-* attributes; filtering is pure show/hide. */
(function () {
  const grid = document.getElementById("catalog-grid");
  const empty = document.getElementById("catalog-empty");
  const countEl = document.getElementById("catalog-count");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll("[data-length]"));
  const filters = { length: "all", colour: "all", texture: "all", method: "all" };

  function applyFilters() {
    let visible = 0;
    cards.forEach((card) => {
      const ok =
        (filters.length === "all" || card.dataset.length === filters.length) &&
        (filters.colour === "all" || card.dataset.colour === filters.colour) &&
        (filters.texture === "all" || card.dataset.texture === filters.texture) &&
        (filters.method === "all" || card.dataset.method === filters.method);
      card.hidden = !ok;
      if (ok) visible += 1;
    });
    if (empty) empty.classList.toggle("show", visible === 0);
    if (countEl) {
      countEl.textContent =
        visible === 0
          ? "Sin estilos con esa combinación"
          : visible + (visible === 1 ? " estilo" : " estilos");
    }
  }

  document.querySelectorAll(".filter-group").forEach((group) => {
    const key = group.dataset.filter;
    group.querySelectorAll(".pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        group
          .querySelectorAll(".pill")
          .forEach((p) => p.setAttribute("aria-pressed", "false"));
        pill.setAttribute("aria-pressed", "true");
        filters[key] = pill.dataset.value;
        applyFilters();
      });
    });
  });

  applyFilters();
})();
