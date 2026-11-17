/**
 * ██╗  ██╗██████╗  █████╗ ███╗   ██╗██╗██╗   ██╗███╗   ███╗
 * ██║ ██╔╝██╔══██╗██╔══██╗████╗  ██║██║██║   ██║████╗ ████║
 * █████╔╝ ██████╔╝███████║██╔██╗ ██║██║██║   ██║██╔████╔██║
 * ██╔═██╗ ██╔══██╗██╔══██║██║╚██╗██║██║██║   ██║██║╚██╔╝██║
 * ██║  ██╗██║  ██║██║  ██║██║ ╚████║██║╚██████╔╝██║ ╚═╝ ██║
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝ ╚═════╝ ╚═╝ ╚═════╝ ╚═╝     ╚═╝
 *
 * kranium.js — the behavior layer for kranium.css
 * Version 1.3.0 · zero dependencies · no build step · GNU GPL v3.0
 *
 * Pair with kranium.css v2.2+. Everything is data-attribute driven:
 *
 *   modal      <button data-k-modal="#my-modal">Open</button>
 *              <div class="k-modal" id="my-modal"> <div class="k-modal-box">…</div> </div>
 *              (anything with [data-k-close] inside closes it; ESC and backdrop too)
 *
 *   tabs       <div data-k-tabs>
 *                <button data-k-tab="a">One</button> <button data-k-tab="b">Two</button>
 *                <div data-k-panel="a">…</div> <div data-k-panel="b" hidden>…</div>
 *              </div>
 *
 *   dropdown   <div data-k-dropdown>
 *                <button class="k-btn">Menu ▾</button>
 *                <div class="k-dropdown k-hidden">…</div>
 *              </div>
 *
 *   accordion  <div data-k-accordion>
 *                <div class="k-accordion-item"> <button class="k-accordion-head">…</button>
 *                  <div class="k-accordion-body">…</div> </div>
 *              </div>
 *
 *   copy       <button data-k-copy="#email">Copy email</button>
 *
 *   toast      k.toast('Saved ✓')            // optional: k.toast('msg', 'success'|'danger'|'info')
 *              <button data-k-toast="Hello!" data-k-toast-type="success">Say it</button>
 *
 *   theme      k.theme('light' | 'dark' | null)   // null = follow attribute removal (dark)
 *              <button data-k-theme-toggle>Toggles light/dark</button>
 *
 *   tag input  <div data-k-taginput="add tag…"></div>     // type + Enter makes chips
 *              k.tags(el) reads the current tags
 *
 *   elements   carousel(dots) · popover · context-menu · sortable · rating ·
 *              stepper · dropzone · otp · strength-meter · to-top · marquee
 *   chart      k.sparkline(el, [data], {color,fill,height}) · k.countUp(el, n)
 *   css        no <link> needed — kranium.js injects kranium.css from its own folder
 *              automatically if the page didn't already load it
 *
 *   config     k.config({ accent:'#ff5c8a', bg:'#0e0e12', text:'#f0f0f0',
 *                         fontDisplay:'Space Grotesk', fontSans:'Inter',
 *                         fontMono:'JetBrains Mono', radius:6 })
 *              one accent color derives every shade, dim and glow.
 *              set window.KRANIUM_CONFIG before the script loads to configure
 *              declaratively — no JS calls needed.
 *
 * Programmatic: k.init(document) re-scans (call after injecting dynamic HTML).
 * Every component is keyboard operable and adds ARIA where it matters.
 */
(function () {
  "use strict";

  var K = {};

  /* ---------------- css auto-install (v1.1) ----------------
     one <script> tag is enough: kranium.js injects kranium.css
     from its own directory if the page didn't load it already. */
  function installCss() {
    if (document.querySelector('link[href*="kranium.css"], style[data-kranium-css]')) return;
    // token probe: if the CSS is bundled/inlined some other way, tokens exist
    if (getComputedStyle(document.documentElement).getPropertyValue("--k-accent").trim()) return;
    var src = (document.currentScript && document.currentScript.src) || "";
    var dir = src.substring(0, src.lastIndexOf("/")) || ".";
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = dir + "/kranium.css";
    document.head.appendChild(link);
  }

  var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

  /* ---------------- modal ---------------- */
  var lastFocused = null;

  K.openModal = function (sel) {
    var m = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (!m || !m.hidden) return;
    lastFocused = document.activeElement;
    m.hidden = false;
    m.setAttribute("aria-modal", "true");
    m.setAttribute("role", "dialog");
    var box = m.querySelector(".k-modal") || m;
    var first = box.querySelector(FOCUSABLE);
    if (first) first.focus();
    document.addEventListener("keydown", escClose);
    function escClose(e) {
      if (e.key === "Escape") { K.closeModal(m); document.removeEventListener("keydown", escClose); }
    }
    m._escClose = escClose;
  };

  K.closeModal = function (m) {
    if (typeof m === "string") m = document.querySelector(m);
    if (!m) return;
    m.hidden = true;
    if (m._escClose) document.removeEventListener("keydown", m._escClose);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  };

  /* ---------------- tabs ---------------- */
  function initTabs(root) {
    root.querySelectorAll("[data-k-tabs]").forEach(function (tabs) {
      if (tabs._kTabs) return;
      tabs._kTabs = true;
      var btns = tabs.querySelectorAll("[data-k-tab]");
      var panels = tabs.querySelectorAll(":scope > [data-k-panel], :scope [data-k-panel]");
      btns.forEach(function (btn) {
        btn.setAttribute("role", "tab");
        btn.addEventListener("click", function () {
          var key = btn.getAttribute("data-k-tab");
          btns.forEach(function (b) {
            var on = b === btn;
            b.classList.toggle("active", on);
            b.setAttribute("aria-selected", on ? "true" : "false");
          });
          panels.forEach(function (p) {
            var on = p.getAttribute("data-k-panel") === key;
            p.hidden = !on;
            p.classList.toggle("active", on);
          });
          btn.dispatchEvent(new CustomEvent("k:tabchange", { bubbles: true, detail: { key: key } }));
        });
      });
      // activate first tab if none active
      var active = tabs.querySelector("[data-k-tab].active") || btns[0];
      if (active) active.click();
    });
  }

  /* ---------------- dropdown ---------------- */
  function initDropdowns(root) {
    root.querySelectorAll("[data-k-dropdown]").forEach(function (dd) {
      if (dd._kDrop) return;
      dd._kDrop = true;
      var btn = dd.querySelector("button, [role=button]"),
          menu = dd.querySelector(".k-dropdown, .k-menu");
      if (!btn || !menu) return;
      menu.classList.add("k-hidden");
      btn.setAttribute("aria-expanded", "false");
      function close() { menu.classList.add("k-hidden"); btn.setAttribute("aria-expanded", "false"); }
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var opening = menu.classList.contains("k-hidden");
        document.querySelectorAll("[data-k-dropdown]").forEach(function (o) {
          var om = o.querySelector(".k-dropdown, .k-menu");
          if (om && om !== menu) om.classList.add("k-hidden");
          var ob = o.querySelector("button"); if (ob) ob.setAttribute("aria-expanded", "false");
        });
        menu.classList.toggle("k-hidden", !opening);
        btn.setAttribute("aria-expanded", opening ? "true" : "false");
      });
      document.addEventListener("click", function (e) {
        if (!dd.contains(e.target)) close();
      });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    });
  }

  /* ---------------- accordion ---------------- */
  function initAccordions(root) {
    root.querySelectorAll("[data-k-accordion]").forEach(function (acc) {
      if (acc._kAcc) return;
      acc._kAcc = true;
      acc.querySelectorAll(".k-accordion-item").forEach(function (item) {
        var head = item.querySelector(".k-accordion-head, .k-accordion-header"),
            body = item.querySelector(".k-accordion-body");
        if (!head || !body) return;
        head.setAttribute("aria-expanded", body.hidden ? "false" : "true");
        head.addEventListener("click", function () {
          body.hidden = !body.hidden;
          item.classList.toggle("k-accordion-open", !body.hidden);
          head.setAttribute("aria-expanded", !body.hidden ? "true" : "false");
        });
      });
    });
  }

  /* ---------------- copy ---------------- */
  function initCopy(root) {
    root.querySelectorAll("[data-k-copy]").forEach(function (btn) {
      if (btn._kCopy) return;
      btn._kCopy = true;
      btn.addEventListener("click", function () {
        var sel = btn.getAttribute("data-k-copy"),
            el = sel && sel.startsWith("#") ? document.querySelector(sel) : null,
            text = el ? (el.value || el.textContent) : sel;
        navigator.clipboard.writeText(text || "").then(function () {
          K.toast("Copied to clipboard", "success");
        }, function () { K.toast("Copy failed", "danger"); });
      });
    });
  }

  /* ---------------- toast ---------------- */
  var toastWrap = null;
  K.toast = function (msg, type) {
    if (!toastWrap) {
      toastWrap = document.createElement("div");
      toastWrap.className = "k-toast-container";
      toastWrap.setAttribute("role", "status");
      document.body.appendChild(toastWrap);
    }
    var t = document.createElement("div");
    t.className = "k-toast k-toast-" + (type || "info");
    t.textContent = msg;
    toastWrap.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("k-toast-show"); });
    setTimeout(function () {
      t.classList.remove("k-toast-show");
      setTimeout(function () { t.remove(); }, 300);
    }, 3200);
  };

  function initToastButtons(root) {
    root.querySelectorAll("[data-k-toast]").forEach(function (btn) {
      if (btn._kToastB) return;
      btn._kToastB = true;
      btn.addEventListener("click", function () {
        K.toast(btn.getAttribute("data-k-toast"), btn.getAttribute("data-k-toast-type") || "info");
      });
    });
  }


  /* ---------------- tag input (v1.1) ---------------- */
  function initTagInputs(root) {
    root.querySelectorAll("[data-k-taginput]").forEach(function (ti) {
      if (ti._kTag) return;
      ti._kTag = true;
      if (ti.querySelector("input")) return;
      ti.addEventListener("click", function () { ti.querySelector("input").focus(); });
      var input = document.createElement("input");
      input.type = "text";
      var placeholder = ti.getAttribute("data-k-taginput") || "add tag…";
      input.placeholder = placeholder;
      ti.appendChild(input);
      function addTag(text) {
        text = text.trim();
        if (!text) return;
        var chip = document.createElement("span");
        chip.className = "k-chip";
        chip.appendChild(document.createTextNode(text));
        var x = document.createElement("button");
        x.type = "button"; x.textContent = "✕"; x.setAttribute("aria-label", "remove " + text);
        x.addEventListener("click", function () { chip.remove(); });
        chip.appendChild(x);
        ti.insertBefore(chip, input);
        ti.dispatchEvent(new CustomEvent("k:tagschange", { bubbles: true, detail: { tags: K.tags(ti) } }));
      }
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(input.value); input.value = ""; }
        else if (e.key === "Backspace" && !input.value) {
          var chips = ti.querySelectorAll(".k-chip");
          if (chips.length) chips[chips.length - 1].remove();
        }
      });
      input.addEventListener("blur", function () { addTag(input.value); input.value = ""; });
    });
  }
  K.tags = function (ti) {
    if (typeof ti === "string") ti = document.querySelector(ti);
    if (!ti) return [];
    return [...ti.querySelectorAll(".k-chip")].map(function (c) {
      return c.childNodes[0].textContent.trim();
    });
  };

  /* ---------------- busy button (v1.1) ---------------- */
  K.busy = function (btn, on) {
    if (typeof btn === "string") btn = document.querySelector(btn);
    if (!btn) return;
    btn.classList.toggle("k-btn-busy", !!on);
    btn.disabled = !!on;
  };


  /* ---------------- runtime config (v1.2) ----------------
     k.config({ accent:'#ff5c8a', bg:'#0e0e12', text:'#f0f0f0',
                fontDisplay:'Space Grotesk', fontSans:'Inter', fontMono:'JetBrains Mono',
                fontGoogle:true, radius:6 })
     Every accent shade, glow and dim is derived from the one accent color.
     Saved to localStorage; also readable from window.KRANIUM_CONFIG before load. */
  var CFG_KEY = "kranium-config";
  var derived = {};

  function hexToRgb(hex) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function shade(hex, f) {           // f>0 lighten toward white, f<0 darken
    var c = hexToRgb(hex);
    var out = c.map(function (v) {
      return Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f));
    });
    return "rgb(" + out.join(",") + ")";
  }
  function rgba(hex, a) { var c = hexToRgb(hex); return "rgba(" + c.join(",") + "," + a + ")"; }

  K.config = function (opts) {
    opts = opts || {};
    var r = document.documentElement.style, set = {};
    function put(name, val) { if (val !== undefined && val !== null && val !== "") { r.setProperty(name, val); set[name] = val; } }

    if (opts.accent) {
      var a = opts.accent;
      put("--k-accent",        shade(a, -0.05));
      put("--k-accent-mid",    a);
      put("--k-accent-light",  shade(a, 0.12));
      put("--k-accent-bright", shade(a, 0.28));
      put("--k-accent-dim",    rgba(a, 0.16));
      put("--k-accent-glow",   "0 0 18px " + rgba(a, 0.45));
      set.__accentHex = a;
    }
    if (opts.bg) {
      put("--k-bg-deep",    shade(opts.bg, -0.35));
      put("--k-bg-surface", opts.bg);
      put("--k-bg-card",    shade(opts.bg, 0.05));
      put("--k-bg-card-hover", shade(opts.bg, 0.10));
      put("--k-bg-elevated", shade(opts.bg, 0.14));
      set.__bgHex = opts.bg;
    }
    if (opts.text) {
      put("--k-text-primary",   opts.text);
      put("--k-text-secondary", shade(opts.text, -0.25));
      put("--k-text-muted",     shade(opts.text, -0.45));
      set.__textHex = opts.text;
    }
    if (opts.border) put("--k-border", opts.border);

    if (opts.fontDisplay || opts.fontSans || opts.fontMono) {
      if (opts.fontDisplay) put("--k-font-display", '"' + opts.fontDisplay + '", sans-serif');
      if (opts.fontSans)    put("--k-font-sans",    '"' + opts.fontSans + '", sans-serif');
      if (opts.fontMono)    put("--k-font-mono",    '"' + opts.fontMono + '", monospace');
      if (opts.fontGoogle !== false) {
        var fams = [opts.fontDisplay, opts.fontSans, opts.fontMono].filter(Boolean)
          .map(function (f) { return "family=" + f.replace(/ /g, "+"); }).join("&");
        var l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = "https://fonts.googleapis.com/css2?" + fams + "&display=swap";
        document.head.appendChild(l);
      }
      set.__fonts = [opts.fontDisplay, opts.fontSans, opts.fontMono].filter(Boolean);
    }
    if (opts.radius !== undefined) {
      put("--k-radius-xs", Math.max(0, opts.radius - 2) + "px");
      put("--k-radius-sm", Math.max(1, opts.radius - 1) + "px");
      put("--k-radius",    opts.radius + "px");
      put("--k-radius-lg", (opts.radius + 4) + "px");
      put("--k-radius-xl", (opts.radius + 8) + "px");
      set.__radius = opts.radius;
    }
    if (opts.save !== false) {
      var stored = {};
      try { stored = JSON.parse(localStorage.getItem(CFG_KEY) || "{}"); } catch (e) {}
      if (set.__accentHex !== undefined) stored.accent = set.__accentHex; else if (opts.accent !== undefined) stored.accent = null;
      if (set.__bgHex !== undefined) stored.bg = set.__bgHex;
      if (set.__textHex !== undefined) stored.text = set.__textHex;
      if (set.__fonts) stored.fonts = set.__fonts;
      if (set.__radius !== undefined) stored.radius = set.__radius;
      if (opts.reset) localStorage.removeItem(CFG_KEY);
      else localStorage.setItem(CFG_KEY, JSON.stringify(stored));
    }
    document.dispatchEvent(new CustomEvent("k:config", { detail: set }));
    return set;
  };

  K.resetConfig = function () { localStorage.removeItem(CFG_KEY); K.config({ reset: true, accent: "#63e2b7" }); };

  (function restoreConfig() {
    var pre = window.KRANIUM_CONFIG, stored = null;
    try { stored = JSON.parse(localStorage.getItem(CFG_KEY) || "null"); } catch (e) {}
    var cfg = stored || pre;
    if (!cfg) return;
    var opts = {};
    if (cfg.accent) opts.accent = cfg.accent;
    if (cfg.bg) opts.bg = cfg.bg;
    if (cfg.text) opts.text = cfg.text;
    if (cfg.fonts) { opts.fontDisplay = cfg.fonts[0]; opts.fontSans = cfg.fonts[1]; opts.fontMono = cfg.fonts[2]; opts.fontGoogle = true; }
    if (cfg.radius !== undefined) opts.radius = cfg.radius;
    if (Object.keys(opts).length) document.addEventListener("DOMContentLoaded", function () { K.config(opts); });
  })();


  /* ---------------- v1.3: the everything batch ---------------- */

  /* carousel: <div data-k-carousel> <div class="k-carousel-track"> slides </div> </div> */
  function initCarousels(root) {
    root.querySelectorAll("[data-k-carousel]").forEach(function (c) {
      if (c._kCar) return;
      c._kCar = true;
      var track = c.querySelector(".k-carousel-track");
      if (!track) return;
      var slides = [...track.children];
      function goTo(i) {
        i = Math.max(0, Math.min(slides.length - 1, i));
        track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: "smooth" });
        c.querySelectorAll(".k-carousel-dot").forEach(function (d, di) { d.classList.toggle("active", di === i); });
      }
      function perView() { return Math.max(1, Math.round(track.clientWidth / (slides[0] ? slides[0].offsetWidth + 16 : 1))); }
      function page(i) {
        var w = slides[0] ? slides[0].offsetWidth + 16 : 1;
        track.scrollBy({ left: i * w * perView(), behavior: "smooth" });
      }
      var prev = document.createElement("button");
      prev.className = "k-carousel-nav k-carousel-prev"; prev.innerHTML = "‹"; prev.setAttribute("aria-label", "previous");
      var next = document.createElement("button");
      next.className = "k-carousel-nav k-carousel-next"; next.innerHTML = "›"; next.setAttribute("aria-label", "next");
      prev.addEventListener("click", function () { page(-1); });
      next.addEventListener("click", function () { page(1); });
      c.appendChild(prev); c.appendChild(next);
      if (c.hasAttribute("data-k-dots")) {
        var dots = document.createElement("div");
        dots.className = "k-carousel-dots";
        slides.forEach(function (_, i) {
          var d = document.createElement("button");
          d.className = "k-carousel-dot" + (i === 0 ? " active" : "");
          d.setAttribute("aria-label", "slide " + (i + 1));
          d.addEventListener("click", function () { goTo(i); });
          dots.appendChild(d);
        });
        c.appendChild(dots);
      }
    });
  }

  /* popover: <div data-k-popover> <button>?</button> <div class="k-popover">…</div> </div> */
  function initPopovers(root) {
    root.querySelectorAll("[data-k-popover]").forEach(function (pp) {
      if (pp._kPop) return;
      pp._kPop = true;
      pp.style.position = pp.style.position || "relative";
      var pop = pp.querySelector(".k-popover");
      if (!pop) return;
      pop.hidden = true;
      var btn = pp.querySelector("button, [role=button]");
      if (btn) btn.setAttribute("aria-expanded", "false");
      function toggle() {
        pop.hidden = !pop.hidden;
        if (btn) btn.setAttribute("aria-expanded", pop.hidden ? "false" : "true");
      }
      if (btn) btn.addEventListener("click", function (e) { e.stopPropagation(); toggle(); });
      document.addEventListener("click", function (e) {
        if (!pop.hidden && !pp.contains(e.target)) { pop.hidden = true; if (btn) btn.setAttribute("aria-expanded", "false"); }
      });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") pop.hidden = true; });
    });
  }

  /* context menu: <div data-k-contextmenu="#my-menu"> right-click target </div> */
  function initContextMenus(root) {
    root.querySelectorAll("[data-k-contextmenu]").forEach(function (target) {
      if (target._kCtx) return;
      target._kCtx = true;
      var menu = document.querySelector(target.getAttribute("data-k-contextmenu"));
      if (!menu) return;
      menu.classList.add("k-hidden");
      menu.style.position = "fixed"; menu.style.zIndex = "1100";
      menu.style.left = "0"; menu.style.top = "0";
      target.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        document.querySelectorAll(".k-context-open").forEach(function (m) { m.classList.add("k-hidden"); });
        menu.classList.remove("k-hidden");
        menu.classList.add("k-context-open");
        var x = Math.min(e.clientX, innerWidth - menu.offsetWidth - 8);
        var y = Math.min(e.clientY, innerHeight - menu.offsetHeight - 8);
        menu.style.left = x + "px"; menu.style.top = y + "px";
      });
      document.addEventListener("click", function () { menu.classList.add("k-hidden"); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") menu.classList.add("k-hidden"); });
    });
  }

  /* sortable list: <div class="k-sortable" data-k-sortable> items </div> */
  function initSortables(root) {
    root.querySelectorAll("[data-k-sortable]").forEach(function (list) {
      if (list._kSort) return;
      list._kSort = true;
      var dragEl = null;
      [...list.children].forEach(function (item) {
        item.draggable = true;
        item.addEventListener("dragstart", function () {
          dragEl = item; item.classList.add("k-dragging");
        });
        item.addEventListener("dragend", function () {
          item.classList.remove("k-dragging");
          list.querySelectorAll(".k-drop-target").forEach(function (x) { x.classList.remove("k-drop-target"); });
          list.dispatchEvent(new CustomEvent("k:sort", { bubbles: true, detail: { order: [...list.children].map(function (c) { return c.dataset.kSortKey || c.textContent.trim().slice(0, 24); }) } }));
        });
        item.addEventListener("dragover", function (e) {
          e.preventDefault();
          if (item === dragEl) return;
          item.classList.add("k-drop-target");
          var r = item.getBoundingClientRect();
          list.insertBefore(dragEl, e.clientY < r.top + r.height / 2 ? item : item.nextSibling);
        });
        item.addEventListener("dragleave", function () { item.classList.remove("k-drop-target"); });
      });
    });
  }

  /* rating: <div data-k-rating="5"> five ☆ buttons + value </div> */
  function initRatings(root) {
    root.querySelectorAll("[data-k-rating]").forEach(function (r) {
      if (r._kRate) return;
      r._kRate = true;
      var max = parseInt(r.getAttribute("data-k-rating"), 10) || 5;
      var value = parseInt(r.getAttribute("data-k-value") || "0", 10);
      r.classList.add("k-rating");
      var btns = [];
      for (var i = 1; i <= max; i++) {
        var b = document.createElement("button");
        b.type = "button"; b.textContent = "★"; b.setAttribute("aria-label", i + " of " + max);
        (function (i) {
          b.addEventListener("click", function () {
            value = i;
            paint();
            r.dispatchEvent(new CustomEvent("k:rate", { bubbles: true, detail: { value: value } }));
          });
        })(i);
        btns.push(b); r.appendChild(b);
      }
      var out = document.createElement("span");
      out.className = "k-rating-value";
      r.appendChild(out);
      function paint() {
        btns.forEach(function (b, i) { b.classList.toggle("active", i < value); });
        out.textContent = value ? value + "/" + max : "";
      }
      paint();
    });
  }

  /* stepper: <div data-k-stepper> <div class="k-step" data-k-step="Name">… */
  function initSteppers(root) {
    root.querySelectorAll("[data-k-stepper]").forEach(function (st) {
      if (st._kStep) return;
      st._kStep = true;
      var steps = [...st.querySelectorAll(".k-step")];
      steps.forEach(function (s, i) {
        var n = s.querySelector(".k-step-n");
        if (n && !n.firstChild) n.textContent = i + 1;
        if (i < steps.length - 1) {
          var line = document.createElement("span");
          line.className = "k-step-line";
          s.appendChild(line);
        }
      });
      var current = 0;
      function paint() {
        steps.forEach(function (s, i) {
          s.classList.toggle("active", i === current);
          s.classList.toggle("done", i < current);
          var line = s.querySelector(".k-step-line");
          if (line) line.classList.toggle("done", i < current);
        });
      }
      paint();
      st._kGo = function (i) { current = Math.max(0, Math.min(steps.length - 1, i)); paint(); };
      st.addEventListener("k:step", function (e) { st._kGo(e.detail && e.detail.to !== undefined ? e.detail.to : current + 1); });
    });
  }
  K.stepTo = function (stepper, i) {
    if (typeof stepper === "string") stepper = document.querySelector(stepper);
    if (stepper && stepper._kGo) stepper._kGo(i);
  };

  /* dropzone: <div class="k-dropzone" data-k-dropzone> … <input type=file> */
  function initDropzones(root) {
    root.querySelectorAll("[data-k-dropzone]").forEach(function (dz) {
      if (dz._kDrop) return;
      dz._kDrop = true;
      var input = dz.querySelector('input[type="file"]');
      if (!input) {
        input = document.createElement("input");
        input.type = "file";
        if (dz.hasAttribute("data-k-multiple")) input.multiple = true;
        dz.appendChild(input);
      }
      dz.addEventListener("click", function () { input.click(); });
      ["dragover", "dragenter"].forEach(function (ev) {
        dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("k-dragover"); });
      });
      dz.addEventListener("dragleave", function () { dz.classList.remove("k-dragover"); });
      dz.addEventListener("drop", function (e) {
        e.preventDefault(); dz.classList.remove("k-dragover");
        if (e.dataTransfer.files.length) {
          input.files = e.dataTransfer.files;
          dz.dispatchEvent(new CustomEvent("k:files", { bubbles: true, detail: { files: [...e.dataTransfer.files] } }));
        }
      });
      input.addEventListener("change", function () {
        if (input.files.length) dz.dispatchEvent(new CustomEvent("k:files", { bubbles: true, detail: { files: [...input.files] } }));
      });
    });
  }

  /* otp: <div class="k-otp" data-k-otp="6"></div> */
  function initOtps(root) {
    root.querySelectorAll("[data-k-otp]").forEach(function (o) {
      if (o._kOtp) return;
      o._kOtp = true;
      var n = parseInt(o.getAttribute("data-k-otp"), 10) || 6;
      var inputs = [];
      for (var i = 0; i < n; i++) {
        var inp = document.createElement("input");
        inp.type = "text"; inp.maxLength = 1; inp.inputMode = "numeric";
        inp.setAttribute("aria-label", "digit " + (i + 1));
        (function (i) {
          inp.addEventListener("input", function () {
            inp.value = inp.value.replace(/\D/g, "");
            if (inp.value && i < n - 1) inputs[i + 1].focus();
            if (inputs.every(function (x) { return x.value; }))
              o.dispatchEvent(new CustomEvent("k:otp", { bubbles: true, detail: { code: inputs.map(function (x) { return x.value; }).join("") } }));
          });
          inp.addEventListener("keydown", function (e) {
            if (e.key === "Backspace" && !inp.value && i > 0) inputs[i - 1].focus();
          });
          inp.addEventListener("paste", function (e) {
            var t = (e.clipboardData.getData("text") || "").replace(/\D/g, "");
            if (t.length > 1) {
              e.preventDefault();
              t.split("").slice(0, n).forEach(function (ch, j) { inputs[j].value = ch; });
              inputs[Math.min(t.length, n) - 1].focus();
            }
          });
        })(i);
        inputs.push(inp); o.appendChild(inp);
      }
      K.otpValue = function () { return inputs.map(function (x) { return x.value; }).join(""); };
    });
  }

  /* password strength: <input data-k-strength> — meter inserted after */
  function initStrength(root) {
    root.querySelectorAll("[data-k-strength]").forEach(function (inp) {
      if (inp._kStr) return;
      inp._kStr = true;
      if (!inp.parentNode) return;
      var wrap = document.createElement("div");
      wrap.className = "k-strength";
      wrap.innerHTML = '<div class="k-strength-bar"><div class="k-strength-fill"></div></div><div class="k-strength-label"></div>';
      if (!inp.parentNode) return;
      var fill = wrap.querySelector(".k-strength-fill"), label = wrap.querySelector(".k-strength-label");
      var labels = ["too weak", "weak", "okay", "strong", "excellent"];
      var colors = ["var(--k-danger)", "var(--k-danger)", "var(--k-warning)", "var(--k-success)", "var(--k-accent-mid)"];
      inp.addEventListener("input", function () {
        var v = inp.value, score = 0;
        if (v.length >= 8) score++;
        if (v.length >= 12) score++;
        if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
        if (/\d/.test(v)) score++;
        if (/[^A-Za-z0-9]/.test(v)) score++;
        score = Math.min(4, score);
        fill.style.width = (v ? (score + 1) * 20 : 0) + "%";
        fill.style.background = colors[score];
        label.textContent = v ? labels[score] : "";
      });
    });
  }

  /* sparkline: k.sparkline(canvasOrSelector, [1,4,2,7,...], opts) */
  K.sparkline = function (sel, data, opts) {
    opts = opts || {};
    var el = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (!el || !data || !data.length) return;
    var canvas = el.tagName === "CANVAS" ? el : el.querySelector("canvas");
    if (!canvas) { canvas = document.createElement("canvas"); el.appendChild(canvas); }
    var w = el.clientWidth || 120, h = opts.height || 36;
    canvas.width = w * 2; canvas.height = h * 2;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    var ctx = canvas.getContext("2d");
    ctx.scale(2, 2);
    var min = Math.min.apply(null, data), max = Math.max.apply(null, data), range = max - min || 1;
    var step = w / (data.length - 1 || 1);
    var color = opts.color || "var(--k-accent-mid)";
    var probe = el;
    while (color.indexOf("var(") === 0 && probe) { color = getComputedStyle(probe).getPropertyValue(color.slice(4, -1).trim()) || color; probe = probe.parentNode; }
    ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.lineJoin = "round"; ctx.beginPath();
    data.forEach(function (v, i) {
      var x = i * step, y = h - 3 - ((v - min) / range) * (h - 6);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    if (opts.fill) {
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
      ctx.globalAlpha = 0.12; ctx.fillStyle = color; ctx.fill(); ctx.globalAlpha = 1;
    }
  };

  /* count-up: k.countUp(el, 1234, {suffix:'%'}) */
  K.countUp = function (sel, to, opts) {
    opts = opts || {};
    var el = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (!el) return;
    var dur = opts.duration || 1200, dec = opts.decimals || 0;
    var t0 = performance.now();
    (function tick(t) {
      var k = Math.min(1, (t - t0) / dur);
      var v = to * (1 - Math.pow(1 - k, 3));
      el.textContent = (opts.prefix || "") + v.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (opts.suffix || "");
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  };

  /* back to top: k.toTop() — or auto via data-k-totop on any element */
  K.toTop = function () { scrollTo({ top: 0, behavior: "smooth" }); };
  function initToTop(root) {
    root.querySelectorAll("[data-k-totop]").forEach(function (b) {
      if (b._kTop) return;
      b._kTop = true;
      b.classList.add("k-totop");
      b.textContent = b.textContent || "↑";
      b.addEventListener("click", K.toTop);
    });
    if (!root._kTopScroll) {
      root._kTopScroll = true;
      var btn = root.querySelector ? root.querySelector("[data-k-totop]") : null;
      if (btn) addEventListener("scroll", function () {
        btn.classList.toggle("k-totop-show", scrollY > 400);
      }, { passive: true });
    }
  }

  /* marquee: pure CSS (.k-marquee > .k-marquee-inner, duplicate content once) */
  function initMarquees(root) {
    root.querySelectorAll(".k-marquee").forEach(function (m) {
      if (m._kMarq) return;
      m._kMarq = true;
      var inner = m.querySelector(".k-marquee-inner");
      if (inner && !inner.dataset.kCloned) {
        inner.innerHTML += inner.innerHTML;
        inner.dataset.kCloned = "1";
      }
    });
  }

  /* ---------------- theme ---------------- */
  K.theme = function (name) {
    if (name === null || name === undefined) document.documentElement.removeAttribute("data-k-theme");
    else document.documentElement.setAttribute("data-k-theme", name);
    return document.documentElement.getAttribute("data-k-theme") || "dark";
  };
  K.currentTheme = function () {
    return document.documentElement.getAttribute("data-k-theme") || "dark";
  };

  /* ---------------- init ---------------- */
  K.init = function (root) {
    root = root || document;
    initTabs(root); initDropdowns(root); initAccordions(root);
    initCopy(root); initToastButtons(root); initTagInputs(root);
    initCarousels(root); initPopovers(root); initContextMenus(root);
    initSortables(root); initRatings(root); initSteppers(root);
    initDropzones(root); initOtps(root); initStrength(root); initToTop(root); initMarquees(root);

    // modal openers / closers / backdrop
    root.querySelectorAll("[data-k-modal]").forEach(function (btn) {
      if (btn._kModalB) return;
      btn._kModalB = true;
      btn.addEventListener("click", function () { K.openModal(btn.getAttribute("data-k-modal")); });
    });
    root.querySelectorAll(".k-modal").forEach(function (m) {
      if (m._kModalW) return;
      m._kModalW = true;
      m.querySelectorAll("[data-k-close]").forEach(function (c) {
        c.addEventListener("click", function () { K.closeModal(m); });
      });
      m.addEventListener("click", function (e) { if (e.target === m) K.closeModal(m); });
    });

    // theme toggles
    root.querySelectorAll("[data-k-theme-toggle]").forEach(function (btn) {
      if (btn._kThemeB) return;
      btn._kThemeB = true;
      btn.addEventListener("click", function () {
        K.theme(K.currentTheme() === "dark" ? "light" : "dark");
      });
    });
  };

  installCss();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { K.init(); });
  } else {
    K.init();
  }

  window.k = K;
})();
