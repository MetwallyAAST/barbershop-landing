/* Fade & Blade — content renderer.
   Fetches site content from the API and hydrates the DOM.
   Fails safe: if the API is unavailable the static HTML remains untouched. */

(function () {
  "use strict";

  document.documentElement.dataset.fbContentPending = "1";

  var ICONS = {
    scissors:
      '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
    razor: '<path d="M3 21V7l4-4 4 4M11 21V7l4-4 4 4v14"/><path d="M2 21h20"/>',
    towel:
      '<path d="M12 2a7 7 0 0 0-7 7c0 3 2 5 2 8h10c0-3 2-5 2-8a7 7 0 0 0-7-7Z"/><path d="M9 21h6"/>',
    beard:
      '<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M6 9a6 6 0 0 1 12 0c0 2-1.5 3-1.5 3S15 9 12 9s-4.5 3-4.5 3S6 11 6 9Z"/>',
    family: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
    sparkle:
      '<path d="M12 3c1 4-2 5-2 8a2 2 0 0 0 4 0c0-1-.5-2-.5-2"/><path d="M12 21a8 8 0 0 0 8-8c0-3-2-5-3-7"/>',
    check: '<path d="m20 6-11 11L4 12"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    phone:
      '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    Instagram:
      '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>',
    Facebook:
      '<path d="M15 3h-3a4 4 0 0 0-4 4v3H6v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h3Z"/>',
    X: '<path d="M4 4l16 16M20 4 4 20"/>',
    TikTok: '<path d="M14 3v11a4 4 0 1 1-4-4"/><path d="M14 6a5 5 0 0 0 4 3"/>'
  };

  function svg(markup) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + markup + "</svg>";
  }

  function get(obj, path) {
    if (!path) return undefined;
    if (path === "item") return obj.item;
    var parts = path.split(".");
    var node = parts[0] === "item" ? obj.item : obj.root;
    var start = parts[0] === "item" ? 1 : 0;
    for (var i = start; i < parts.length; i++) {
      if (node == null) return undefined;
      node = node[parts[i]];
    }
    return node;
  }

  function stars(n) {
    var count = Math.max(0, Math.min(5, parseInt(n, 10) || 0));
    return "\u2605".repeat(count) + "\u2606".repeat(5 - count);
  }

  function applyAttrList(el, ctx) {
    var spec = el.getAttribute("data-field-attrs");
    if (!spec) return;
    spec.split(",").forEach(function (pair) {
      var bits = pair.split(":");
      var name = (bits.shift() || "").trim();
      var path = bits.join(":").trim();
      if (!name || !path) return;
      var v = get(ctx, path);
      if (v !== undefined && v !== null) el.setAttribute(name, String(v));
    });
  }

  function applyClassMap(el, ctx) {
    var spec = el.getAttribute("data-classes");
    if (!spec) return;
    spec.split(",").forEach(function (pair) {
      var bits = pair.split(":");
      var value = (bits.shift() || "").trim();
      var cls = bits.join(":").trim();
      if (!cls) return;
      el.classList.toggle(cls, String(get(ctx, el.getAttribute("data-field"))) === value);
    });
  }

  function setField(el, ctx) {
    var path = el.getAttribute("data-field");
    var value = path ? get(ctx, path) : undefined;

    if (el.hasAttribute("data-if")) {
      var ifVal = get(ctx, el.getAttribute("data-if"));
      var truthy = ifVal !== undefined && ifVal !== null && ifVal !== false && ifVal !== "" && ifVal !== 0;
      var cls = el.getAttribute("data-if-class");
      if (cls) el.classList.toggle(cls, truthy);
    }
    applyAttrList(el, ctx);
    applyClassMap(el, ctx);
    if (value === undefined || value === null) return;

    if (el.hasAttribute("data-icon")) {
      el.innerHTML = svg(ICONS[value] || ICONS.sparkle);
      return;
    }
    if (el.hasAttribute("data-stars")) {
      el.textContent = stars(value);
      return;
    }
    if (el.hasAttribute("data-counter")) {
      var str = String(value);
      var decimals = (str.split(".")[1] || "").length;
      el.setAttribute("data-count", str);
      el.setAttribute("data-decimals", String(decimals));
      el.textContent = str;
      return;
    }
    var datasetKey = el.getAttribute("data-dataset");
    var attr = el.getAttribute("data-attr");
    if (datasetKey) el.dataset[datasetKey] = String(value);
    if (attr === "mailto") el.setAttribute("href", "mailto:" + String(value));
    else if (attr) el.setAttribute(attr, String(value));
    if (!attr && !datasetKey && !el.hasAttribute("data-icon") && !el.hasAttribute("data-classes")) {
      el.textContent = String(value);
    }
  }

  function renderList(container, ctx) {
    var path = container.getAttribute("data-list");
    var items = get(ctx, path);
    if (!Array.isArray(items)) return;
    var tpl = container.querySelector("template[data-item]");
    if (!tpl) return;

    var sep = container.getAttribute("data-item-sep");
    var repeat = parseInt(container.getAttribute("data-repeat") || "1", 10) || 1;

    // clear any previously rendered output or static fallback
    Array.prototype.slice
      .call(container.querySelectorAll("[data-rendered], [data-default]"))
      .forEach(function (n) { n.remove(); });
    Array.prototype.slice
      .call(container.querySelectorAll("template[data-item]"))
      .forEach(function (n) { n.remove(); });

    var sequence = [];
    for (var r = 0; r < repeat; r++) sequence = sequence.concat(items);

    var frag = document.createDocumentFragment();
    sequence.forEach(function (item, index) {
      if (index > 0 && sep) {
        var s = document.createElement("span");
        s.innerHTML = sep;
        while (s.firstChild) frag.appendChild(s.firstChild);
      }
      var clone = tpl.content.cloneNode(true);
      var itemCtx = { root: ctx.root, item: item };
      clone.querySelectorAll("[data-field], [data-if], [data-field-attrs], [data-classes]").forEach(function (el) {
        setField(el, itemCtx);
      });
      clone.querySelectorAll("[data-list]").forEach(function (el) {
        renderList(el, itemCtx);
      });
      frag.appendChild(clone);
    });

    container.appendChild(frag);
  }

  function applyTheme(theme) {
    if (!theme || typeof theme !== "object") return;
    var map = {
      primary: "--primary",
      panel: "--panel",
      panel2: "--panel-2",
      gold: "--gold",
      goldBright: "--gold-bright",
      goldDeep: "--gold-deep",
      background: "--bg",
      foreground: "--fg",
      cream: "--cream"
    };
    Object.keys(map).forEach(function (key) {
      if (theme[key]) {
        document.documentElement.style.setProperty(map[key], theme[key]);
      }
    });
  }

  function applySeo(site) {
    if (!site) return;
    if (site.seoTitle) document.title = site.seoTitle;
    if (site.seoDescription) {
      var meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", site.seoDescription);
    }
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta && site.theme && site.theme.primary) {
      themeMeta.setAttribute("content", site.theme.primary);
    }
  }

  function hydrate(content) {
    applySeo(content.site);
    applyTheme(content.site && content.site.theme);

    var ctx = { root: content };
    document.querySelectorAll("[data-field], [data-if], [data-field-attrs], [data-classes]").forEach(function (el) {
      if (!el.closest("template")) setField(el, ctx);
    });
    document.querySelectorAll("[data-list]").forEach(function (el) {
      if (!el.closest("template")) renderList(el, ctx);
    });

    // document-level bindings (e.g. <html> lang not needed here)
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  function done() {
    document.documentElement.dataset.fbContentPending = "0";
    window.dispatchEvent(new Event("fb:content-ready"));
  }

  fetch("/api/content", { headers: { Accept: "application/json" } })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (content) {
      hydrate(content);
      done();
    })
    .catch(function () {
      // keep static fallback markup
      done();
    });
})();
