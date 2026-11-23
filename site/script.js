/* =====================================================================
   KA BRAND — SCRIPT GERAL
   Entrada animada, topo, revelação ao rolar, contagem regressiva,
   cursor, lista VIP, pop-up, Pixel/GA e utilitários usados pela loja.
   (Os dados editáveis ficam em config.js.)
   ===================================================================== */
(function () {
  "use strict";
  var KA = window.KA || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- armazenamento seguro (pode falhar em aba anônima) ---------- */
  var store = {
    get: function (k, fb) { try { var v = localStorage.getItem(k); return v === null ? fb : JSON.parse(v); } catch (e) { return fb; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };

  /* ---------- utilidades ---------- */
  function onlyDigits(s) { return String(s || "").replace(/\D/g, ""); }
  function money(n) { return "R$ " + Number(n).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function whatsappLink(msg) {
    return "https://wa.me/" + onlyDigits(KA.whatsapp) + "?text=" + encodeURIComponent(msg || "");
  }
  function maskPhone(input) {
    input.addEventListener("input", function () {
      var d = onlyDigits(input.value).slice(0, 11);
      var out = d;
      if (d.length > 2) out = "(" + d.slice(0, 2) + ") " + d.slice(2);
      if (d.length > 7) out = "(" + d.slice(0, 2) + ") " + d.slice(2, d.length - 4) + "-" + d.slice(d.length - 4);
      input.value = out;
    });
  }
  var valid = {
    nome: function (v) { return v.trim().length >= 2; },
    whatsapp: function (v) { var d = onlyDigits(v); return d.length === 10 || d.length === 11; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }
  };
  function setError(input, msg) {
    var box = document.querySelector('[data-error-for="' + input.id + '"]');
    if (box) box.textContent = msg || "";
    input.classList.toggle("is-invalid", !!msg);
    if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
  }

  /* Envia para a planilha (Google Apps Script). Sem URL = modo demonstração. */
  function sendToEndpoint(data) {
    if (!KA.formEndpoint) return Promise.resolve({ demo: true });
    return fetch(KA.formEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data)
    }).then(function () { return { ok: true }; });
  }

  /* ---------- rastreamento (Pixel da Meta e Google Analytics) ---------- */
  function loadTracking() {
    if (KA.metaPixelId) {
      /* eslint-disable */
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      window.fbq("init", KA.metaPixelId);
      window.fbq("track", "PageView");
    }
    if (KA.googleAnalyticsId) {
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(KA.googleAnalyticsId);
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", KA.googleAnalyticsId);
    }
  }
  // Eventos: "Lead", "AddToCart", "Purchase". Nunca envia dados pessoais.
  function track(event, params) {
    params = params || {};
    try {
      if (window.fbq) window.fbq("track", event, params);
      if (window.gtag) {
        var map = { Lead: "generate_lead", AddToCart: "add_to_cart", Purchase: "purchase" };
        window.gtag("event", map[event] || event, params);
      }
    } catch (e) { /* silêncio */ }
  }

  /* ---------- camadas (menu, sacola, janelas) ---------- */
  var overlay = $("[data-overlay]");
  var stack = [];
  function focusables(el) {
    return $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', el)
      .filter(function (n) { return n.offsetParent !== null || n === document.activeElement; });
  }
  function openLayer(el, opts) {
    opts = opts || {};
    if (stack.some(function (l) { return l.el === el; })) return;
    var layer = { el: el, returnTo: document.activeElement, onClose: opts.onClose };
    stack.push(layer);
    el.hidden = false;
    if (el.classList.contains("drawer")) overlay.hidden = false;
    document.body.classList.add("locked");
    var f = opts.focus || focusables(el)[0];
    if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 30);
    if (opts.trigger) opts.trigger.setAttribute("aria-expanded", "true");
    layer.trigger = opts.trigger;
  }
  function closeLayer(el, keepFocus) {
    var i = -1;
    stack.forEach(function (l, idx) { if (!el || l.el === el) i = idx; });
    if (i < 0) return;
    var layer = stack.splice(i, 1)[0];
    layer.el.hidden = true;
    if (layer.trigger) layer.trigger.setAttribute("aria-expanded", "false");
    if (!stack.some(function (l) { return l.el.classList.contains("drawer"); })) overlay.hidden = true;
    if (!stack.length) document.body.classList.remove("locked");
    if (layer.onClose) layer.onClose();
    if (!keepFocus && layer.returnTo && layer.returnTo.focus) layer.returnTo.focus({ preventScroll: true });
  }
  function closeAll() { while (stack.length) closeLayer(stack[stack.length - 1].el, true); }

  document.addEventListener("keydown", function (e) {
    if (!stack.length) return;
    var top = stack[stack.length - 1].el;
    if (e.key === "Escape") { closeLayer(top); return; }
    if (e.key === "Tab") {
      var f = focusables(top);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  overlay.addEventListener("click", function () {
    for (var i = stack.length - 1; i >= 0; i--) if (stack[i].el.classList.contains("drawer")) { closeLayer(stack[i].el); return; }
  });
  document.addEventListener("click", function (e) {
    var closer = e.target.closest("[data-close]");
    if (closer) { var host = closer.closest(".drawer, .modal"); if (host) closeLayer(host); return; }
    if (e.target.classList && e.target.classList.contains("modal")) closeLayer(e.target);
  });

  /* ---------- toast ---------- */
  var toastEl = $("#toast"), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2600);
  }

  /* compartilhado com shop.js */
  window.KAUtil = {
    $: $, $$: $$, store: store, money: money, onlyDigits: onlyDigits, whatsappLink: whatsappLink,
    maskPhone: maskPhone, valid: valid, setError: setError, sendToEndpoint: sendToEndpoint,
    track: track, openLayer: openLayer, closeLayer: closeLayer, closeAll: closeAll, toast: toast,
    reduceMotion: reduceMotion
  };

  /* ---------- preencher dados do config ---------- */
  function fillConfig() {
    var at = "@" + (KA.instagram || "kabrandrr");
    var values = { cidade: KA.cidade, cnpj: KA.cnpj, email: KA.email, dona: KA.dona, instagramAt: at };
    $$("[data-ka]").forEach(function (el) { var v = values[el.getAttribute("data-ka")]; if (v) el.textContent = v; });
    $$("[data-whatsapp]").forEach(function (a) { a.href = whatsappLink(KA.mensagemWhatsapp); a.target = "_blank"; a.rel = "noopener"; });
    $$("[data-instagram]").forEach(function (a) {
      a.href = "https://instagram.com/" + encodeURIComponent(KA.instagram || "kabrandrr");
      if (!a.hasAttribute("data-ka")) a.textContent = a.textContent.replace(/@\w+/, at);
    });
    $$("[data-email]").forEach(function (a) { a.href = "mailto:" + KA.email; if (a.textContent.indexOf("@") > -1) a.textContent = KA.email; });
    var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- entrada animada ---------- */
  function intro() {
    var el = $("#intro");
    if (!el) return;
    var seen = false;
    try { seen = sessionStorage.getItem("kaIntro") === "1"; } catch (e) {}
    if (seen || reduceMotion) { el.remove(); return; }
    document.body.classList.add("locked");
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      el.classList.add("is-done");
      document.body.classList.remove("locked");
      try { sessionStorage.setItem("kaIntro", "1"); } catch (e) {}
      setTimeout(function () { el.remove(); }, 800);
    }
    $("#introSkip").addEventListener("click", finish);
    setTimeout(finish, 3000);
  }

  /* ---------- topo e menu ---------- */
  function nav() {
    var bar = $("#topbar");
    function onScroll() { bar.classList.toggle("is-solid", window.scrollY > 40); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var menu = $("#menu"), btn = $("#menuBtn");
    btn.addEventListener("click", function () { openLayer(menu, { trigger: btn }); });
    $$("a", menu).forEach(function (a) {
      a.addEventListener("click", function () { if (a.getAttribute("href").charAt(0) === "#") closeLayer(menu, true); });
    });
  }

  /* ---------- revelação ao rolar ---------- */
  function reveal() {
    var els = $$(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- contagem regressiva ---------- */
  function countdown() {
    var box = $("#countdown");
    if (!box || !KA.dataPreVenda) return;
    var target = new Date(KA.dataPreVenda).getTime();
    if (isNaN(target)) return;
    box.hidden = false;
    var parts = { d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]') };
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        box.innerHTML = '<p class="countdown__open">A pré-venda começou! ✦</p>';
        clearInterval(timer);
        return;
      }
      var s = Math.floor(diff / 1000);
      parts.d.textContent = pad(Math.floor(s / 86400));
      parts.h.textContent = pad(Math.floor(s % 86400 / 3600));
      parts.m.textContent = pad(Math.floor(s % 3600 / 60));
      parts.s.textContent = pad(s % 60);
    }
    var timer = setInterval(tick, 1000);
    tick();
  }

  /* ---------- cursor (só no computador) ---------- */
  function cursor() {
    if (reduceMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var c = $(".cursor"), dot = $(".cursor__dot"), ring = $(".cursor__ring");
    document.documentElement.classList.add("has-cursor");
    var x = -100, y = -100, rx = -100, ry = -100;
    window.addEventListener("mousemove", function (e) { x = e.clientX; y = e.clientY; dot.style.left = x + "px"; dot.style.top = y + "px"; }, { passive: true });
    (function loop() {
      rx += (x - rx) * .18; ry += (y - ry) * .18;
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    })();
    document.addEventListener("mouseover", function (e) { c.classList.toggle("is-hover", !!e.target.closest("a, button, label, summary, select")); });
  }

  /* ---------- lista VIP ---------- */
  function vip() {
    var form = $("#vipForm");
    if (!form) return;
    var nome = $("#vipNome"), whats = $("#vipWhats"), email = $("#vipEmail"), consent = $("#vipConsent");
    var status = $("#vipStatus"), done = $("#vipDone");
    maskPhone(whats);

    if (store.get("kaVip", false)) { form.hidden = true; done.hidden = false; }

    [nome, whats, email].forEach(function (i) { i.addEventListener("input", function () { setError(i, ""); }); });
    consent.addEventListener("change", function () { setError(consent, ""); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      if (!valid.nome(nome.value)) { setError(nome, "Conta pra gente o seu nome."); ok = false; }
      if (!valid.whatsapp(whats.value)) { setError(whats, "Digite o WhatsApp com DDD, ex.: (95) 99999-9999."); ok = false; }
      if (!valid.email(email.value)) { setError(email, "Confira o e-mail."); ok = false; }
      if (!consent.checked) { setError(consent, "Marque esta opção para entrar na lista."); ok = false; }
      if (!ok) { var bad = $(".is-invalid", form); if (bad) bad.focus(); return; }

      var data = {
        tipo: "vip",
        nome: nome.value.trim(),
        whatsapp: onlyDigits(whats.value),
        email: email.value.trim(),
        interesses: $$('input[name="interesses"]:checked', form).map(function (c) { return c.value; }).join(", "),
        tamanho: $("#vipTam").value,
        consentimento: "sim",
        data: new Date().toISOString(),
        origem: "site"
      };
      var btn = $('button[type="submit"]', form);
      btn.disabled = true;
      status.textContent = "Enviando…";

      sendToEndpoint(data).then(finish, function () {
        // Mesmo se a internet falhar, guardamos no navegador para não perder.
        var pend = store.get("kaVipPendentes", []); pend.push(data); store.set("kaVipPendentes", pend);
        finish();
      });
      function finish() {
        store.set("kaVip", true);
        track("Lead");
        btn.disabled = false;
        status.textContent = "";
        form.hidden = true;
        done.hidden = false;
        done.setAttribute("tabindex", "-1");
        done.focus();
      }
    });
  }

  /* ---------- pop-up (uma vez) ---------- */
  function popup() {
    var pop = $("#vipPopup");
    if (!pop || store.get("kaPopupVisto", false) || store.get("kaVip", false)) return;
    var shown = false;
    function show() {
      if (shown || store.get("kaVip", false)) return;
      if (document.body.classList.contains("locked")) { setTimeout(show, 4000); return; } // não atrapalhar
      shown = true;
      store.set("kaPopupVisto", true);
      openLayer(pop);
      cleanup();
    }
    var t = setTimeout(show, 25000);
    function onLeave(e) { if (e.clientY <= 0 && !e.relatedTarget) show(); }
    document.addEventListener("mouseout", onLeave);
    function cleanup() { clearTimeout(t); document.removeEventListener("mouseout", onLeave); }
    $("[data-popup-go]", pop).addEventListener("click", function () { closeLayer(pop, true); });
  }

  document.documentElement.classList.remove("no-js");
  fillConfig();
  intro();
  nav();
  reveal();
  countdown();
  cursor();
  vip();
  popup();
  loadTracking();
})();
