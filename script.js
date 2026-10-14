(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Mobile menu ---------------- */
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");

  function closeMenu() {
    if (!navLinks) return;
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("menu-open");
  }

  function toggleMenu() {
    var open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-open", open);
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", toggleMenu);
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024) closeMenu();
    });
  }

  /* ---------------- Sticky nav shrink ---------------- */
  var nav = document.getElementById("nav");
  var toTop = document.getElementById("toTop");

  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle("nav--scrolled", y > 40);
    if (toTop) toTop.classList.toggle("show", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- Scroll reveal ---------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, i) {
          if (entry.isIntersecting) {
            var el = entry.target;
            var delay = Math.min(Array.prototype.indexOf.call(el.parentNode.children, el) % 6, 5) * 70;
            setTimeout(function () { el.classList.add("in"); }, delay);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------------- Animated counters ---------------- */
  var counters = document.querySelectorAll("[data-count]");
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    if (reduceMotion) {
      el.textContent = target.toFixed(decimals);
      return;
    }
    var duration = 1600;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { animateCounter(entry.target); co.unobserve(entry.target); }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------------- Testimonials slider ---------------- */
  var track = document.getElementById("sliderTrack");
  if (track) {
    var slides = Array.prototype.slice.call(track.children);
    var dotsWrap = document.getElementById("sliderDots");
    var prevBtn = document.getElementById("prevBtn");
    var nextBtn = document.getElementById("nextBtn");
    var index = 0;
    var timer = null;

    function perView() {
      return window.innerWidth >= 900 ? 3 : window.innerWidth >= 600 ? 2 : 1;
    }
    function maxIndex() {
      return Math.max(slides.length - perView(), 0);
    }
    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      for (var i = 0; i <= maxIndex(); i++) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "tab");
        b.setAttribute("aria-label", "Go to testimonial " + (i + 1));
        b.dataset.index = i;
        b.addEventListener("click", function () { goTo(parseInt(this.dataset.index, 10)); });
        dotsWrap.appendChild(b);
      }
    }
    function render() {
      var pv = perView();
      var offset = slides.length ? (index * (100 / pv)) : 0;
      track.style.transform = "translateX(-" + offset + "%)";
      if (dotsWrap) {
        Array.prototype.forEach.call(dotsWrap.children, function (dot, i) {
          dot.setAttribute("aria-selected", String(i === index));
        });
      }
    }
    function goTo(i) {
      var m = maxIndex();
      index = i < 0 ? m : i > m ? 0 : i;
      render();
    }
    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    function startAuto() {
      if (reduceMotion) return;
      stopAuto();
      timer = setInterval(next, 6000);
    }
    function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }

    if (nextBtn) nextBtn.addEventListener("click", function () { next(); startAuto(); });
    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); startAuto(); });

    var slider = document.getElementById("slider");
    slider.addEventListener("mouseenter", stopAuto);
    slider.addEventListener("mouseleave", startAuto);
    slider.addEventListener("focusin", stopAuto);
    slider.addEventListener("focusout", startAuto);

    /* touch swipe */
    var startX = 0, dragging = false;
    track.addEventListener("touchstart", function (e) {
      startX = e.touches[0].clientX; dragging = true; stopAuto();
    }, { passive: true });
    track.addEventListener("touchend", function (e) {
      if (!dragging) return;
      dragging = false;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) { dx < 0 ? next() : prev(); }
      startAuto();
    }, { passive: true });

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (index > maxIndex()) index = maxIndex();
        buildDots();
        render();
      }, 150);
    });

    buildDots();
    render();
    startAuto();
  }

  /* ---------------- FAQ accordion ---------------- */
  document.querySelectorAll(".acc__head").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      var body = btn.nextElementSibling;
      document.querySelectorAll(".acc__head").forEach(function (other) {
        if (other !== btn) {
          other.setAttribute("aria-expanded", "false");
          other.nextElementSibling.style.maxHeight = null;
        }
      });
      btn.setAttribute("aria-expanded", String(!expanded));
      body.style.maxHeight = expanded ? null : body.scrollHeight + "px";
    });
  });

  /* ---------------- Booking form ---------------- */
  var form = document.getElementById("bookingForm");
  if (form) {
    var successEl = document.getElementById("formSuccess");
    var submitBtn = document.getElementById("submitBtn");
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var phoneRe = /^[\d\s()+\-.]{7,}$/;

    // date min = today
    var dateInput = document.getElementById("date");
    if (dateInput) {
      var today = new Date().toISOString().split("T")[0];
      dateInput.setAttribute("min", today);
    }

    function setError(name, msg) {
      var field = form.querySelector('[name="' + name + '"]').closest(".field");
      var err = form.querySelector('[data-error-for="' + name + '"]');
      if (msg) {
        field.classList.add("invalid");
        if (err) err.textContent = msg;
      } else {
        field.classList.remove("invalid");
        if (err) err.textContent = "";
      }
    }

    function validateField(el) {
      var name = el.name;
      var val = (el.value || "").trim();
      var msg = "";
      if (el.hasAttribute("required") && !val) {
        msg = "This field is required.";
      } else if (name === "phone" && val && !phoneRe.test(val)) {
        msg = "Please enter a valid phone number.";
      } else if (name === "date" && val) {
        var selected = new Date(val + "T00:00:00");
        var now = new Date(); now.setHours(0, 0, 0, 0);
        if (selected < now) msg = "Please choose a future date.";
      }
      setError(name, msg);
      return !msg;
    }

    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      el.addEventListener("blur", function () { if (el.value) validateField(el); });
      el.addEventListener("input", function () {
        if (el.closest(".field").classList.contains("invalid")) validateField(el);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fields = Array.prototype.slice.call(form.querySelectorAll("input, select, textarea"));
      var valid = true;
      var firstInvalid = null;
      fields.forEach(function (el) {
        if (!validateField(el)) {
          valid = false;
          if (!firstInvalid) firstInvalid = el;
        }
      });

      if (!valid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      submitBtn.classList.add("loading");
      submitBtn.disabled = true;
      var label = submitBtn.querySelector(".btn__label");
      var original = label.textContent;
      label.textContent = "Sending...";

      setTimeout(function () {
        submitBtn.classList.remove("loading");
        submitBtn.disabled = false;
        label.textContent = original;
        successEl.classList.add("show");
        form.reset();
        form.querySelectorAll(".field").forEach(function (f) { f.classList.remove("invalid"); });
        successEl.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        setTimeout(function () { successEl.classList.remove("show"); }, 8000);
      }, 1200);
    });
  }

  /* ---------------- Newsletter ---------------- */
  var news = document.getElementById("newsletterForm");
  if (news) {
    var msg = document.getElementById("newsletterMsg");
    news.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("newsletterEmail");
      var val = (input.value || "").trim();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (!ok) {
        msg.textContent = "Please enter a valid email address.";
        msg.style.color = "#e0bb4e";
        input.focus();
        return;
      }
      msg.textContent = "You're on the list. Welcome to the club.";
      msg.style.color = "#e0bb4e";
      news.reset();
    });
  }

  /* ---------------- Footer year ---------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
