/* Fade & Blade — admin application.
   Schema-driven editor for content.json. Loads, edits in memory, saves via API. */

(function () {
  "use strict";

  var API = "/api";
  var CSRF = null;
  var CONTENT = null;
  var DIRTY = false;

  var el = {
    loginView: document.getElementById("loginView"),
    appView: document.getElementById("appView"),
    loginForm: document.getElementById("loginForm"),
    loginBtn: document.getElementById("loginBtn"),
    loginError: document.getElementById("loginError"),
    editor: document.getElementById("editor"),
    sectionNav: document.getElementById("sectionNav"),
    saveBtn: document.getElementById("saveBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    status: document.getElementById("status"),
    toast: document.getElementById("toast"),
    filePicker: document.getElementById("filePicker")
  };

  /* ---------------------------------------------------------- utilities */

  function h(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k.slice(0, 2) === "on") node.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function icon(path) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    s.innerHTML = path;
    return s;
  }

  function toast(msg, isErr) {
    el.toast.textContent = msg;
    el.toast.className = "toast show" + (isErr ? " err" : "");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.toast.className = "toast"; }, 2600);
  }

  function setStatus(msg, cls) {
    el.status.textContent = msg || "";
    el.status.className = "app__status" + (cls ? " " + cls : "");
  }

  function markDirty() {
    DIRTY = true;
    setStatus("Unsaved changes");
  }

  function propBinding(obj, key) {
    return {
      get: function () { return obj[key]; },
      set: function (v) { obj[key] = v; }
    };
  }

  /* -------------------------------------------------------------- API */

  function apiFetch(path, options) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers["Accept"] = "application/json";
    if (options.body && typeof options.body !== "string" && !(options.body instanceof FormData)) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }
    if (options.method && options.method !== "GET" && CSRF) {
      options.headers["x-csrf-token"] = CSRF;
    }
    options.credentials = "same-origin";
    return fetch(API + path, options).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var err = new Error(data.error || ("HTTP " + res.status));
          err.status = res.status;
          throw err;
        }
        return data;
      });
    });
  }

  /* ------------------------------------------------------------ login */

  function showLogin() {
    el.appView.hidden = true;
    el.loginView.hidden = false;
    var u = document.getElementById("username");
    if (u) u.focus();
  }

  function showApp() {
    el.loginView.hidden = true;
    el.appView.hidden = false;
    loadContent();
  }

  el.loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    el.loginError.textContent = "";
    var username = document.getElementById("username").value.trim();
    var password = document.getElementById("password").value;
    el.loginBtn.classList.add("loading");
    el.loginBtn.disabled = true;

    apiFetch("/auth/login", { method: "POST", body: { username: username, password: password } })
      .then(function (data) {
        CSRF = data.csrfToken;
        el.loginForm.reset();
        showApp();
      })
      .catch(function (err) {
        el.loginError.textContent = err.message || "Sign in failed";
      })
      .finally(function () {
        el.loginBtn.classList.remove("loading");
        el.loginBtn.disabled = false;
      });
  });

  el.logoutBtn.addEventListener("click", function () {
    if (DIRTY && !window.confirm("You have unsaved changes. Sign out anyway?")) return;
    apiFetch("/auth/logout", { method: "POST" })
      .then(function () { CSRF = null; location.reload(); })
      .catch(function () { location.reload(); });
  });

  /* ---------------------------------------------------------- content */

  function loadContent() {
    setStatus("Loading…");
    apiFetch("/content")
      .then(function (content) {
        CONTENT = content;
        DIRTY = false;
        initRouter();
        setStatus("All changes saved", "ok");
      })
      .catch(function (err) {
        setStatus("Failed to load content", "err");
        toast(err.message, true);
      });
  }

  function save() {
    if (!CONTENT) return;
    el.saveBtn.classList.add("loading");
    el.saveBtn.disabled = true;
    setStatus("Saving…");
    apiFetch("/content", { method: "PUT", body: CONTENT })
      .then(function (res) {
        DIRTY = false;
        setStatus("All changes saved · " + new Date(res.savedAt).toLocaleTimeString(), "ok");
        toast("Changes saved");
      })
      .catch(function (err) {
        if (err.status === 401) { toast("Session expired — please sign in", true); showLogin(); return; }
        setStatus("Save failed", "err");
        toast(err.message, true);
      })
      .finally(function () {
        el.saveBtn.classList.remove("loading");
        el.saveBtn.disabled = false;
      });
  }

  el.saveBtn.addEventListener("click", save);
  window.addEventListener("beforeunload", function (e) {
    if (DIRTY) { e.preventDefault(); e.returnValue = ""; }
  });
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      if (!el.appView.hidden) save();
    }
  });

  /* -------------------------------------------------------- rendering */

  var NAV_BUTTONS = {};

  function pageKeys() {
    var schema = window.FB_SCHEMA;
    return Object.keys(schema.fields).map(function (k) {
      return { key: k, label: schema.fields[k].label || k };
    });
  }

  function buildNav() {
    el.sectionNav.innerHTML = "";
    NAV_BUTTONS = {};

    var home = h("a", {
      class: "app__nav-link",
      href: "#/",
      text: "Overview"
    });
    home.dataset.page = "__overview";
    el.sectionNav.appendChild(home);
    NAV_BUTTONS.__overview = home;

    pageKeys().forEach(function (page) {
      var link = h("a", {
        class: "app__nav-link",
        href: "#/" + page.key
      });
      link.dataset.page = page.key;
      link.textContent = page.label;
      el.sectionNav.appendChild(link);
      NAV_BUTTONS[page.key] = link;
    });
  }

  function setActiveNav(key) {
    Object.keys(NAV_BUTTONS).forEach(function (k) {
      NAV_BUTTONS[k].classList.toggle("active", k === key);
      if (k === key) NAV_BUTTONS[k].setAttribute("aria-current", "page");
      else NAV_BUTTONS[k].removeAttribute("aria-current");
    });
  }

  function currentPageKey() {
    var raw = String(location.hash || "").replace(/^#\/?/, "");
    var schema = window.FB_SCHEMA;
    if (!raw) return "__overview";
    return schema.fields[raw] ? raw : "__overview";
  }

  function renderPage(key) {
    el.editor.innerHTML = "";
    el.editor.scrollTop = 0;

    if (key === "__overview") {
      renderOverview();
      return;
    }

    var node = window.FB_SCHEMA.fields[key];
    var page = h("article", { class: "page" });

    var header = h("header", { class: "page__head" });
    header.appendChild(h("p", { class: "page__crumb", text: "Content" }));
    header.appendChild(h("h1", { class: "page__title", text: node.label || key }));
    page.appendChild(header);

    var card = h("section", { class: "section" });
    var body = h("div");
    renderNode(body, node, propBinding(CONTENT, key));
    card.appendChild(body);
    page.appendChild(card);

    el.editor.appendChild(page);
  }

  function renderOverview() {
    var page = h("article", { class: "page" });

    var header = h("header", { class: "page__head" });
    header.appendChild(h("p", { class: "page__crumb", text: "Dashboard" }));
    header.appendChild(h("h1", { class: "page__title", text: "Content overview" }));
    header.appendChild(h("p", {
      class: "page__sub",
      text: "Choose a section to edit. Every change is saved from the top bar, or with Ctrl/Cmd + S."
    }));
    page.appendChild(header);

    var grid = h("div", { class: "overview" });
    pageKeys().forEach(function (p) {
      var node = window.FB_SCHEMA.fields[p.key];
      var count = "";
      if (node.type === "list") {
        var arr = CONTENT[p.key];
        count = Array.isArray(arr) ? arr.length + " items" : "";
      } else if (node.type === "group") {
        var sub = node.fields || {};
        var listKeys = Object.keys(sub).filter(function (k) { return sub[k].type === "list"; });
        if (listKeys.length) {
          var total = listKeys.reduce(function (acc, k) {
            var a = CONTENT[p.key] && CONTENT[p.key][k];
            return acc + (Array.isArray(a) ? a.length : 0);
          }, 0);
          count = total + " items";
        } else {
          count = Object.keys(sub).length + " fields";
        }
      }

      var card = h("a", { class: "overview__card", href: "#/" + p.key });
      card.appendChild(h("span", { class: "overview__label", text: p.label }));
      if (count) card.appendChild(h("span", { class: "overview__meta", text: count }));
      var arrow = icon('<path d="M5 12h14M13 6l6 6-6 6"/>');
      arrow.classList.add("overview__arrow");
      card.appendChild(arrow);
      grid.appendChild(card);
    });
    page.appendChild(grid);

    el.editor.appendChild(page);
  }

  function router() {
    var key = currentPageKey();
    setActiveNav(key);
    renderPage(key);
  }

  function initRouter() {
    buildNav();
    if (!location.hash) {
      try { history.replaceState(null, "", "#/"); } catch (e) { location.hash = "#/"; }
    }
    router();
  }

  window.addEventListener("hashchange", function () {
    if (el.appView.hidden || !CONTENT) return;
    router();
  });

  function renderNode(parent, node, binding) {
    if (node.type === "group") return renderGroup(parent, node, binding);
    if (node.type === "list") return renderList(parent, node, binding);
    return renderScalar(parent, node, binding);
  }

  function renderGroup(parent, node, binding) {
    var wrap = h("div", { class: "group" });
    if (node.label) wrap.appendChild(h("h3", { text: node.label }));

    var inner = h("div", { class: "grid2" });
    Object.keys(node.fields).forEach(function (key) {
      var childNode = node.fields[key];
      var holder = h("div", { class: "field-host" + (childNode.type === "group" || childNode.type === "list" ? " field--full" : "") });
      renderNode(holder, childNode, propBinding(binding.get(), key));
      inner.appendChild(holder);
    });
    wrap.appendChild(inner);
    parent.appendChild(wrap);
  }

  function renderScalar(parent, node, binding) {
    var id = "f_" + Math.random().toString(36).slice(2, 9);

    if (node.type === "checkbox") {
      var wrap = h("label", { class: "field field--check field--full" });
      var box = h("input", { type: "checkbox", id: id });
      box.checked = Boolean(binding.get());
      box.addEventListener("change", function () { binding.set(box.checked); markDirty(); });
      wrap.appendChild(box);
      wrap.appendChild(h("span", { text: node.label }));
      parent.appendChild(wrap);
      return;
    }

    var field = h("div", { class: "field" });
    if (node.label && node.type !== "color") {
      field.appendChild(h("label", { for: id, text: node.label }));
    }

    var value = binding.get();
    if (value === undefined || value === null) value = "";

    if (node.type === "textarea") {
      var ta = h("textarea", { id: id });
      ta.value = String(value);
      ta.addEventListener("input", function () { binding.set(ta.value); markDirty(); });
      field.appendChild(ta);
    } else if (node.type === "select") {
      var sel = h("select", { id: id });
      (node.options || []).forEach(function (opt) {
        var o = h("option", { value: opt, text: opt });
        sel.appendChild(o);
      });
      sel.value = String(value);
      sel.addEventListener("change", function () { binding.set(sel.value); markDirty(); });
      field.appendChild(sel);
    } else if (node.type === "color") {
      field.appendChild(h("label", { for: id + "_t", text: node.label }));
      var row = h("div", { class: "color-field" });
      var color = h("input", { type: "color", value: /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000" });
      var hex = h("input", { type: "text", id: id + "_t", value: String(value), placeholder: "#000000" });
      color.addEventListener("input", function () { hex.value = color.value.toUpperCase(); binding.set(color.value.toUpperCase()); markDirty(); });
      hex.addEventListener("input", function () {
        binding.set(hex.value); markDirty();
        if (/^#[0-9a-f]{6}$/i.test(hex.value)) color.value = hex.value;
      });
      row.appendChild(color);
      row.appendChild(hex);
      field.appendChild(row);
    } else if (node.type === "image") {
      field.appendChild(buildImageField(id, node, binding));
    } else {
      var inputType = node.type === "number" ? "number" : node.type === "url" ? "url" : "text";
      var input = h("input", { type: inputType, id: id, value: String(value) });
      input.addEventListener("input", function () {
        binding.set(node.type === "number" ? Number(input.value) : input.value);
        markDirty();
      });
      field.appendChild(input);
    }

    if (node.help) field.appendChild(h("p", { class: "help", text: node.help }));
    parent.appendChild(field);
  }

  function buildImageField(id, node, binding) {
    var current = String(binding.get() || "");
    var wrap = h("div", { class: "image-field" });

    var thumb = h("div", { class: "image-field__thumb" });
    var img = document.createElement("img");
    img.alt = "";
    if (current) { img.src = current; thumb.appendChild(img); }
    else thumb.textContent = "No image";

    var body = h("div", { class: "image-field__body" });
    var row = h("div", { class: "image-field__row" });
    var urlInput = h("input", { type: "text", id: id, value: current, placeholder: "Image URL or upload" });
    var uploadBtn = h("button", {
      type: "button",
      class: "btn btn--ghost",
      text: "Upload",
      onclick: function () { pickFile(uploadBtn, function (url) { urlInput.value = url; binding.set(url); markDirty(); img.src = url; if (!thumb.contains(img)) { thumb.textContent = ""; thumb.appendChild(img); } }); }
    });
    row.appendChild(urlInput);
    row.appendChild(uploadBtn);

    urlInput.addEventListener("input", function () {
      binding.set(urlInput.value);
      markDirty();
      if (urlInput.value) {
        img.src = urlInput.value;
        if (!thumb.contains(img)) { thumb.textContent = ""; thumb.appendChild(img); }
      } else {
        thumb.textContent = "No image";
      }
    });

    body.appendChild(row);
    wrap.appendChild(thumb);
    wrap.appendChild(body);
    return wrap;
  }

  var activePicker = null;
  el.filePicker.addEventListener("change", function () {
    var file = el.filePicker.files && el.filePicker.files[0];
    if (!file || !activePicker) return;
    var fd = new FormData();
    fd.append("image", file);
    activePicker.btn.classList.add("loading");
    apiFetch("/upload", { method: "POST", body: fd })
      .then(function (data) { activePicker.cb(data.url); toast("Image uploaded"); })
      .catch(function (err) {
        if (err.status === 401) { toast("Session expired", true); showLogin(); return; }
        toast(err.message, true);
      })
      .finally(function () {
        activePicker.btn.classList.remove("loading");
        el.filePicker.value = "";
        activePicker = null;
      });
  });

  function pickFile(btn, cb) {
    activePicker = { btn: btn, cb: cb };
    el.filePicker.click();
  }

  /* --------------------------------------------------------- list editor */

  function itemTitle(node, item) {
    if (node.item.type === "group") {
      var key = node.itemLabel;
      var t = key && item ? item[key] : "";
      return t ? String(t) : node.item.label || "Item";
    }
    return String(item || node.item.label || "Item");
  }

  function renderList(parent, node, binding) {
    var wrap = h("div", { class: "group" });
    if (node.label) wrap.appendChild(h("h3", { text: node.label }));

    var list = h("div", { class: "list" });
    var arr = binding.get();
    if (!Array.isArray(arr)) { arr = []; binding.set(arr); }

    var head = h("div", { class: "list__head" });
    head.appendChild(h("h4", { text: node.label || "List" }));
    head.appendChild(h("button", {
      type: "button",
      class: "btn btn--ghost",
      text: "+ Add",
      onclick: function () {
        var fresh = JSON.parse(JSON.stringify(node.newItem));
        arr.push(fresh);
        markDirty();
        rerender();
      }
    }));
    list.appendChild(head);

    var itemsWrap = h("div", { class: "list__items" });

    function rerender() { renderList(parent, node, binding); }

    if (!arr.length) {
      itemsWrap.appendChild(h("p", { class: "list__empty", text: "No items yet." }));
    }

    arr.forEach(function (item, index) {
      var box = h("div", { class: "list__item" });

      var itemHead = h("div", { class: "list__item-head" });
      var drag = h("span", { class: "drag" });
      drag.appendChild(icon('<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>'));
      itemHead.appendChild(drag);
      itemHead.appendChild(h("span", { class: "list__item-title", text: itemTitle(node, item) }));
      itemHead.appendChild(h("button", {
        type: "button", class: "icon-btn", title: "Move up", disabled: index === 0,
        onclick: function () { swap(arr, index, index - 1); markDirty(); rerender(); }
      }, [icon('<path d="M12 19V5M6 11l6-6 6 6"/>')]));
      itemHead.appendChild(h("button", {
        type: "button", class: "icon-btn", title: "Move down", disabled: index === arr.length - 1,
        onclick: function () { swap(arr, index, index + 1); markDirty(); rerender(); }
      }, [icon('<path d="M12 5v14M6 13l6 6 6-6"/>')]));
      itemHead.appendChild(h("button", {
        type: "button", class: "icon-btn", title: "Duplicate",
        onclick: function () { arr.splice(index + 1, 0, JSON.parse(JSON.stringify(item))); markDirty(); rerender(); }
      }, [icon('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>')]));
      itemHead.appendChild(h("button", {
        type: "button", class: "icon-btn danger", title: "Delete",
        onclick: function () {
          if (!window.confirm("Delete this item?")) return;
          arr.splice(index, 1);
          markDirty();
          rerender();
        }
      }, [icon('<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>')]));
      box.appendChild(itemHead);

      var itemBody = h("div", { class: "list__item-body" });
      var itemBinding = {
        get: function () { return arr[index]; },
        set: function (v) { arr[index] = v; },
        parent: function () { return arr; }
      };
      renderNode(itemBody, node.item, itemBinding);
      box.appendChild(itemBody);
      itemsWrap.appendChild(box);
    });

    list.appendChild(itemsWrap);
    wrap.appendChild(list);
    parent.innerHTML = "";
    parent.appendChild(wrap);
  }

  function swap(arr, i, j) {
    if (j < 0 || j >= arr.length) return;
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }

  /* ------------------------------------------------------------- boot */

  function boot() {
    apiFetch("/auth/me")
      .then(function (data) {
        CSRF = data.csrfToken;
        if (data.authenticated) showApp();
        else showLogin();
      })
      .catch(function () { showLogin(); });
  }

  boot();
})();
