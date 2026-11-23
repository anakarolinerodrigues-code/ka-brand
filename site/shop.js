/* =====================================================================
   KA BRAND — LOJA (catálogo, peça, sacola, entrega e pedido)
   As peças, preços e opções de entrega vêm de config.js.
   ===================================================================== */
(function () {
  "use strict";
  var KA = window.KA || {};
  var U = window.KAUtil;
  var $ = U.$, $$ = U.$$;

  var CATS = {
    todos: "Todos",
    vestidos: "Vestidos",
    conjuntos: "Conjuntos",
    shorts: "Shorts",
    blusas: "Blusas",
    acessorios: "Acessórios"
  };
  var catalog = (KA.catalogo || []).filter(function (p) { return p && p.id && p.nome; });
  var byId = {};
  catalog.forEach(function (p, i) { p._ordem = i; byId[p.id] = p; });
  var entregas = KA.entregas || [];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function priceText(p) { return typeof p === "number" ? U.money(p) : "Preço a definir"; }
  function freteText(f) { return f === 0 ? "Grátis" : typeof f === "number" ? U.money(f) : "Informado pela loja"; }

  /* desenho provisório enquanto não há foto */
  var ART = {
    vestidos: '<path d="M38 8h24l-4 18 18 66H24L42 26Z"/><path d="M42 26h16"/>',
    conjuntos: '<path d="M32 8h36l4 26H28Z"/><path d="M30 42h40l8 50H22Z"/>',
    shorts: '<path d="M22 20h56l6 60H56l-6-34-6 34H16Z"/><path d="M22 30h56"/>',
    blusas: '<path d="M36 10 50 18 64 10 88 26 80 40 70 34V90H30V34L20 40 12 26Z"/>',
    acessorios: '<circle cx="50" cy="56" r="26"/><path d="M50 30V14M42 14h16"/>'
  };
  function media(p, eager) {
    if (p.foto) {
      return '<img src="' + esc(p.foto) + '" alt="' + esc(p.nome) + '"' + (eager ? "" : ' loading="lazy"') + ' decoding="async">';
    }
    return '<span class="ph ph--' + esc(p.cat) + '" role="img" aria-label="' + esc(p.nome) + ', foto em breve">' +
      '<svg viewBox="0 0 100 100" aria-hidden="true">' + (ART[p.cat] || ART.vestidos) + "</svg>" +
      '<span class="ph__txt">Foto em breve</span><span class="ph__ka">KA</span></span>';
  }

  /* ================= CATÁLOGO ================= */
  var state = { cat: "todos", sizes: [], sort: "relevancia" };
  var grid = $("#productGrid"), tabsEl = $("#catTabs");

  function buildTabs() {
    var present = { todos: true };
    catalog.forEach(function (p) { present[p.cat] = true; });
    tabsEl.innerHTML = Object.keys(CATS).filter(function (k) { return present[k]; }).map(function (k) {
      return '<button type="button" class="tab" role="tab" data-cat="' + k + '" aria-selected="' + (k === state.cat) + '">' + CATS[k] + "</button>";
    }).join("");
    tabsEl.addEventListener("click", function (e) {
      var b = e.target.closest(".tab"); if (b) setCat(b.getAttribute("data-cat"));
    });
  }
  function setCat(cat) {
    if (!CATS[cat]) cat = "todos";
    state.cat = cat;
    $$(".tab", tabsEl).forEach(function (t) {
      var on = t.getAttribute("data-cat") === cat;
      t.setAttribute("aria-selected", on);
      if (on && t.scrollIntoView) t.scrollIntoView({ block: "nearest", inline: "center", behavior: U.reduceMotion ? "auto" : "smooth" });
    });
    render();
  }

  function buildSizeFilter() {
    var all = [];
    catalog.forEach(function (p) { (p.tamanhos || []).forEach(function (t) { if (all.indexOf(t) < 0) all.push(t); }); });
    var order = ["PP", "P", "M", "G", "GG", "XG"];
    all.sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia > -1 && ib > -1) return ia - ib;
      if (ia > -1) return -1; if (ib > -1) return 1;
      return parseFloat(a) - parseFloat(b);
    });
    $("#sizeChips").innerHTML = all.map(function (t) {
      return '<button type="button" class="chip" data-size="' + esc(t) + '" aria-pressed="false">' + esc(t) + "</button>";
    }).join("");
    $("#sizeChips").addEventListener("click", function (e) {
      var c = e.target.closest(".chip"); if (!c) return;
      var s = c.getAttribute("data-size"), i = state.sizes.indexOf(s);
      if (i > -1) state.sizes.splice(i, 1); else state.sizes.push(s);
      c.setAttribute("aria-pressed", i < 0);
      render();
    });
    $("#clearFilter").addEventListener("click", function () {
      state.sizes = [];
      $$(".chip", $("#sizeChips")).forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
      render();
    });
    var fb = $("#filterBtn"), box = $("#filterBox");
    fb.addEventListener("click", function () {
      box.hidden = !box.hidden;
      fb.setAttribute("aria-expanded", String(!box.hidden));
    });
    $("#sortSelect").addEventListener("change", function (e) { state.sort = e.target.value; render(); });
  }

  function render() {
    var list = catalog.filter(function (p) {
      if (state.cat !== "todos" && p.cat !== state.cat) return false;
      if (state.sizes.length && !(p.tamanhos || []).some(function (t) { return state.sizes.indexOf(t) > -1; })) return false;
      return true;
    });
    var priceOf = function (p, dir) { return typeof p.preco === "number" ? p.preco : (dir > 0 ? Infinity : -Infinity); };
    list.sort(function (a, b) {
      if (state.sort === "menor") return priceOf(a, 1) - priceOf(b, 1) || a._ordem - b._ordem;
      if (state.sort === "maior") return priceOf(b, -1) - priceOf(a, -1) || a._ordem - b._ordem;
      if (state.sort === "az") return a.nome.localeCompare(b.nome, "pt-BR");
      return a._ordem - b._ordem;
    });

    grid.innerHTML = list.map(function (p) {
      var tbd = typeof p.preco !== "number";
      return '<article class="card">' +
        '<button type="button" class="card__media" data-open="' + esc(p.id) + '" aria-label="Ver ' + esc(p.nome) + '">' +
        '<span class="badge">Pré-venda</span>' + media(p) + "</button>" +
        '<h3 class="card__name">' + esc(p.nome) + "</h3>" +
        '<p class="card__price' + (tbd ? " card__price--tbd" : "") + '">' + priceText(p.preco) + "</p>" +
        '<button type="button" class="btn btn--block" data-open="' + esc(p.id) + '">Comprar</button>' +
        "</article>";
    }).join("");

    var n = list.length;
    $("#catalogCount").textContent = n + (n === 1 ? " peça" : " peças");
    $("#catalogEmpty").hidden = n > 0;
    $("#filterCount").textContent = state.sizes.length ? "(" + state.sizes.length + ")" : "";
  }

  grid.addEventListener("click", function (e) {
    var b = e.target.closest("[data-open]"); if (b) openProduct(b.getAttribute("data-open"), b);
  });

  // links do menu e dos cartões "O que vem por aí"
  $$("[data-cat-link]").forEach(function (a) {
    a.addEventListener("click", function () { setCat(a.getAttribute("data-cat-link")); });
  });

  /* ================= JANELA DA PEÇA ================= */
  var modal = $("#productModal"), current = null, chosenSize = null;

  function openProduct(id, trigger) {
    var p = byId[id]; if (!p) return;
    current = p; chosenSize = null;
    $("#pmMedia").innerHTML = media(p, true);
    $("#pmName").textContent = p.nome;
    $("#pmPrice").textContent = priceText(p.preco);
    $("#pmDesc").textContent = p.desc || "";
    $("#pmSizeError").textContent = "";
    var sizes = p.tamanhos || [];
    if (sizes.length === 1) chosenSize = sizes[0];
    $("#pmSizes").innerHTML = sizes.map(function (t) {
      return '<button type="button" class="chip" role="radio" aria-checked="' + (t === chosenSize) + '" data-size="' + esc(t) + '">' + esc(t) + "</button>";
    }).join("");
    $("#pmSizes").previousElementSibling.hidden = !sizes.length;
    $("#pmAsk").href = U.whatsappLink("Oi, KA Brand! Tenho uma dúvida de tamanho sobre a peça: " + p.nome);
    $("#pmAsk").target = "_blank";
    U.openLayer(modal, { trigger: trigger });
  }
  $("#pmSizes").addEventListener("click", function (e) {
    var c = e.target.closest(".chip"); if (!c) return;
    chosenSize = c.getAttribute("data-size");
    $$(".chip", $("#pmSizes")).forEach(function (x) { x.setAttribute("aria-checked", x === c); });
    $("#pmSizeError").textContent = "";
  });
  $("#pmAdd").addEventListener("click", function () {
    if (!current) return;
    if ((current.tamanhos || []).length && !chosenSize) {
      $("#pmSizeError").textContent = "Escolha o seu tamanho.";
      var first = $(".chip", $("#pmSizes")); if (first) first.focus();
      return;
    }
    addToCart(current.id, chosenSize || "Único");
    U.closeLayer(modal);
    U.toast("Peça adicionada à sua sacola ✦");
  });

  /* ================= SACOLA ================= */
  var cart = U.store.get("kaCart", []).filter(function (i) { return i && byId[i.id] && i.qtd > 0; });
  var cartPanel = $("#cart");

  function saveCart() { U.store.set("kaCart", cart); }
  function addToCart(id, tam) {
    var key = id + "|" + tam;
    var found = cart.filter(function (i) { return i.key === key; })[0];
    if (found) found.qtd = Math.min(found.qtd + 1, 20);
    else cart.push({ key: key, id: id, tam: tam, qtd: 1 });
    saveCart();
    renderCart(true);
    var p = byId[id];
    U.track("AddToCart", { content_ids: [id], content_name: p.nome, currency: "BRL", value: typeof p.preco === "number" ? p.preco : 0 });
  }
  function countItems() { return cart.reduce(function (s, i) { return s + i.qtd; }, 0); }
  function subtotal() {
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
      var p = byId[cart[i].id];
      if (typeof p.preco !== "number") return null;
      total += p.preco * cart[i].qtd;
    }
    return total;
  }

  function renderCart(bump) {
    var n = countItems(), sub = subtotal();
    $$("[data-cart-count]").forEach(function (el) {
      el.textContent = n; el.hidden = n === 0;
      if (bump) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
    });
    $$("[data-cart-count-text]").forEach(function (el) { el.textContent = "(" + n + ")"; });
    $$("[data-cart-total-text]").forEach(function (el) { el.textContent = n && sub !== null ? "· " + U.money(sub) : ""; });
    $("#cartBtn").setAttribute("aria-label", "Abrir minha sacola, " + n + (n === 1 ? " peça" : " peças"));
    $("#cartBar").hidden = n === 0;
    document.body.classList.toggle("has-cartbar", n > 0);

    $("#cartEmpty").hidden = n > 0;
    $("#cartFoot").hidden = n === 0;
    $("#cartItems").innerHTML = cart.map(function (i) {
      var p = byId[i.id];
      var linePrice = typeof p.preco === "number" ? U.money(p.preco * i.qtd) : "Preço a definir";
      return '<div class="ci" data-key="' + esc(i.key) + '">' +
        '<div class="ci__media">' + media(p) + "</div>" +
        "<div>" +
        '<p class="ci__name">' + esc(p.nome) + "</p>" +
        '<p class="ci__meta">Tamanho: ' + esc(i.tam) + "</p>" +
        '<div class="ci__row">' +
        '<div class="qty"><button type="button" data-q="-1" aria-label="Diminuir quantidade de ' + esc(p.nome) + '">−</button>' +
        '<span aria-live="polite">' + i.qtd + "</span>" +
        '<button type="button" data-q="1" aria-label="Aumentar quantidade de ' + esc(p.nome) + '">+</button></div>' +
        '<span class="ci__price">' + linePrice + "</span>" +
        "</div>" +
        '<button type="button" class="ci__remove" data-remove>Remover</button>' +
        "</div></div>";
    }).join("");
    $("#cartSubtotal").textContent = sub === null ? "Confirmado pela loja" : U.money(sub);
  }

  $("#cartItems").addEventListener("click", function (e) {
    var row = e.target.closest(".ci"); if (!row) return;
    var key = row.getAttribute("data-key");
    var item = cart.filter(function (i) { return i.key === key; })[0]; if (!item) return;
    var q = e.target.closest("[data-q]");
    if (q) {
      item.qtd = Math.max(1, Math.min(20, item.qtd + Number(q.getAttribute("data-q"))));
    } else if (e.target.closest("[data-remove]")) {
      cart = cart.filter(function (i) { return i.key !== key; });
      U.toast("Peça removida da sacola");
    } else return;
    saveCart();
    renderCart();
    if (q) { var again = $('.ci[data-key="' + CSS.escape(key) + '"] [data-q="' + q.getAttribute("data-q") + '"]'); if (again) again.focus(); }
  });

  function showStep(name) {
    $$(".cart-step", cartPanel).forEach(function (s) { s.hidden = s.getAttribute("data-step") !== name; });
    cartPanel.scrollTop = 0;
    $("#cartTitle").textContent = name === "checkout" ? "Finalizar pedido" : name === "feito" ? "Pedido feito" : "Minha sacola";
  }
  function openCart(trigger) {
    $("#toast").hidden = true;
    showStep("itens");
    U.closeAll();
    U.openLayer(cartPanel, { trigger: trigger });
  }
  $("#cartBtn").addEventListener("click", function () { openCart($("#cartBtn")); });
  $$("[data-open-cart]").forEach(function (b) { b.addEventListener("click", function () { openCart(b); }); });
  $("[data-close-go]").addEventListener("click", function () { U.closeLayer(cartPanel, true); });

  /* ================= ENTREGA E DADOS ================= */
  var form = $("#checkoutForm");
  var f = {
    nome: $("#coNome"), whats: $("#coWhats"), email: $("#coEmail"), obs: $("#coObs"),
    cep: $("#coCep"), rua: $("#coRua"), num: $("#coNum"), comp: $("#coComp"),
    bairro: $("#coBairro"), cidade: $("#coCidade"), uf: $("#coUf"), consent: $("#coConsent")
  };
  U.maskPhone(f.whats);

  $("#shipOptions").innerHTML = entregas.map(function (en, i) {
    return '<label class="opt"><input type="radio" name="entrega" value="' + esc(en.id) + '"' + (i === 0 ? " checked" : "") + ">" +
      "<span><strong>" + esc(en.nome) + "</strong><small>" + esc(en.info || "") + "</small></span>" +
      "<em>" + freteText(en.frete) + "</em></label>";
  }).join("");

  function selectedShip() {
    var r = $('input[name="entrega"]:checked', form);
    return entregas.filter(function (e) { return r && e.id === r.value; })[0] || entregas[0] || { id: "", nome: "A combinar", frete: null, endereco: false };
  }
  function totals() {
    var sub = subtotal(), ship = selectedShip();
    var total = sub !== null && typeof ship.frete === "number" ? sub + ship.frete : null;
    return { sub: sub, ship: ship, total: total };
  }
  function renderCheckout() {
    var t = totals();
    $("#addressBox").hidden = !t.ship.endereco;
    if (t.ship.id === "boa-vista" && !f.cidade.value) { f.cidade.value = "Boa Vista"; f.uf.value = "RR"; }
    $("#checkoutTotals").innerHTML =
      "<p><span>Subtotal</span><strong>" + (t.sub === null ? "Confirmado pela loja" : U.money(t.sub)) + "</strong></p>" +
      "<p><span>Frete</span><strong>" + freteText(t.ship.frete) + "</strong></p>" +
      '<p class="total"><span>Total</span><strong>' + (t.total === null ? "Confirmado pela loja" : U.money(t.total)) + "</strong></p>";
  }
  form.addEventListener("change", function (e) { if (e.target.name === "entrega") renderCheckout(); });

  $("#toCheckout").addEventListener("click", function () {
    if (!cart.length) return;
    renderCheckout();
    showStep("checkout");
    var first = $('input[name="entrega"]:checked', form); if (first) first.focus();
  });
  $("#backToCart").addEventListener("click", function () { showStep("itens"); $("#toCheckout").focus(); });

  // CEP → endereço (ViaCEP). Se falhar, a cliente digita normalmente.
  f.cep.addEventListener("input", function () {
    var d = U.onlyDigits(f.cep.value).slice(0, 8);
    f.cep.value = d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
    $("#cepHint").textContent = "";
    if (d.length !== 8 || !window.fetch) return;
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 5000);
    $("#cepHint").textContent = "Buscando endereço…";
    fetch("https://viacep.com.br/ws/" + d + "/json/", ctrl ? { signal: ctrl.signal } : {})
      .then(function (r) { return r.json(); })
      .then(function (j) {
        clearTimeout(timer);
        if (!j || j.erro) { $("#cepHint").textContent = ""; return; }
        if (j.logradouro) f.rua.value = j.logradouro;
        if (j.bairro) f.bairro.value = j.bairro;
        if (j.localidade) f.cidade.value = j.localidade;
        if (j.uf) f.uf.value = j.uf;
        [f.rua, f.bairro, f.cidade].forEach(function (i) { U.setError(i, ""); });
        $("#cepHint").textContent = "Endereço encontrado ✦ confira e coloque o número.";
        f.num.focus();
      })
      .catch(function () { clearTimeout(timer); $("#cepHint").textContent = ""; });
  });

  Object.keys(f).forEach(function (k) {
    f[k].addEventListener(f[k].type === "checkbox" ? "change" : "input", function () { U.setError(f[k], ""); });
  });

  function validate() {
    var ok = true, ship = selectedShip();
    function req(input, test, msg) { if (!test(input.value)) { U.setError(input, msg); ok = false; } }
    req(f.nome, U.valid.nome, "Digite o seu nome.");
    req(f.whats, U.valid.whatsapp, "WhatsApp com DDD, ex.: (95) 99999-9999.");
    req(f.email, U.valid.email, "Confira o e-mail.");
    if (ship.endereco) {
      var filled = function (v) { return v.trim().length > 0; };
      req(f.rua, filled, "Informe a rua.");
      req(f.num, filled, "Informe o número (ou s/n).");
      req(f.bairro, filled, "Informe o bairro.");
      req(f.cidade, filled, "Informe a cidade.");
    }
    if (!f.consent.checked) { U.setError(f.consent, "Marque para continuar."); ok = false; }
    return ok;
  }

  function orderId() {
    var abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", out = "KA";
    var rnd = new Uint8Array(6);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(rnd);
    else for (var i = 0; i < 6; i++) rnd[i] = Math.floor(Math.random() * 256);
    for (var j = 0; j < 6; j++) out += abc[rnd[j] % abc.length];
    return out;
  }

  function addressText() {
    if (!selectedShip().endereco) return "";
    var parts = [f.rua.value.trim() + ", " + f.num.value.trim()];
    if (f.comp.value.trim()) parts.push(f.comp.value.trim());
    parts.push(f.bairro.value.trim());
    parts.push(f.cidade.value.trim() + (f.uf.value.trim() ? "/" + f.uf.value.trim().toUpperCase() : ""));
    if (f.cep.value.trim()) parts.push("CEP " + f.cep.value.trim());
    return parts.join(" · ");
  }

  function orderMessage(o) {
    var lines = [];
    lines.push("Olá, KA Brand! ✦ Quero fazer este pedido da pré-venda:");
    lines.push("");
    lines.push("*Pedido " + o.pedido + "*");
    lines.push("");
    lines.push("*Peças*");
    o.lista.forEach(function (i) {
      lines.push("• " + i.qtd + "x " + i.nome + " (" + i.tam + ") — " + i.precoTxt);
    });
    lines.push("");
    lines.push("Subtotal: " + o.subtotalTxt);
    lines.push("Entrega: " + o.entrega + " — frete: " + o.freteTxt);
    lines.push("Total: " + o.totalTxt);
    if (o.endereco) { lines.push(""); lines.push("*Endereço*"); lines.push(o.endereco); }
    lines.push("");
    lines.push("*Meus dados*");
    lines.push("Nome: " + o.nome);
    lines.push("WhatsApp: " + o.whatsappTxt);
    lines.push("E-mail: " + o.email);
    if (o.obs) lines.push("Obs.: " + o.obs);
    lines.push("");
    lines.push("Pagamento: Pix, depois da confirmação da loja.");
    return lines.join("\n");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!cart.length) { showStep("itens"); return; }
    if (!validate()) { var bad = $(".is-invalid", form); if (bad) bad.focus(); return; }

    var t = totals();
    var lista = cart.map(function (i) {
      var p = byId[i.id];
      return {
        id: p.id, nome: p.nome, tam: i.tam, qtd: i.qtd, preco: p.preco,
        precoTxt: typeof p.preco === "number" ? U.money(p.preco * i.qtd) : "preço a definir"
      };
    });
    var o = {
      pedido: orderId(),
      lista: lista,
      subtotalTxt: t.sub === null ? "confirmado pela loja" : U.money(t.sub),
      freteTxt: freteText(t.ship.frete).toLowerCase(),
      totalTxt: t.total === null ? "confirmado pela loja" : U.money(t.total),
      entrega: t.ship.nome,
      endereco: addressText(),
      nome: f.nome.value.trim(),
      whatsappTxt: f.whats.value.trim(),
      email: f.email.value.trim(),
      obs: f.obs.value.trim()
    };

    var registro = {
      tipo: "pedido",
      pedido: o.pedido,
      data: new Date().toISOString(),
      nome: o.nome,
      whatsapp: U.onlyDigits(o.whatsappTxt),
      email: o.email,
      entrega: o.entrega,
      endereco: o.endereco,
      itens: lista.map(function (i) { return i.qtd + "x " + i.nome + " (" + i.tam + ")"; }).join("; "),
      total: t.total === null ? "a confirmar" : t.total.toFixed(2),
      obs: o.obs,
      site: $('input[name="site"]', form).value
    };

    var btn = $("#placeOrder");
    btn.disabled = true;
    btn.textContent = "Registrando…";

    var pedidos = U.store.get("kaPedidos", []);
    pedidos.push(registro);
    var savedLocal = U.store.set("kaPedidos", pedidos.slice(-20));

    U.sendToEndpoint(registro).then(function (r) { done(r && r.demo ? "demo" : "ok"); }, function () { done("falhou"); });

    function done(how) {
      U.track("Purchase", { currency: "BRL", value: t.total || 0, num_items: countItems() });
      $("#orderNumber").textContent = o.pedido;
      $("#orderWhats").href = U.whatsappLink(orderMessage(o));
      $("#orderSaveNote").textContent =
        how === "ok" ? "A loja já recebeu uma cópia do seu pedido." :
        how === "falhou" ? "Não conseguimos enviar a cópia agora. Envie pelo WhatsApp para garantir." :
        savedLocal ? "Uma cópia ficou salva neste aparelho." : "";
      cart = [];
      saveCart();
      renderCart();
      btn.disabled = false;
      btn.textContent = "Confirmar pedido ✦";
      form.reset();
      showStep("feito");
      $("#orderWhats").focus();
    }
  });

  /* ================= INÍCIO ================= */
  if (KA.catalogoDeExemplo) $("#catalogNote").hidden = false;
  buildTabs();
  buildSizeFilter();
  render();
  renderCart();
})();
