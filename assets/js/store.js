/* MyMatrix Store — shared behaviour for every page.
   Cart lives in localStorage. Checkout sends the order as a pre-filled WhatsApp message
   (see STORE_CONFIG in catalog.js) until a payment gateway is connected. */
(function () {
  "use strict";

  const CFG = window.STORE_CONFIG;
  const CAT = window.CATALOG;
  const byId = Object.fromEntries(CAT.map(p => [p.id, p]));
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const inr = n => "₹" + Number(n).toLocaleString("en-IN");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Icons ---------- */
  const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5.34c-.26 0-.51.1-.71.3l-.08.08a1 1 0 0 0 0 1.41L17.07 11H4a1 1 0 1 0 0 2h13.07l-3.86 3.86a1 1 0 0 0 0 1.42l.08.08a1 1 0 0 0 1.42 0l5.65-5.65a1 1 0 0 0 0-1.42l-5.65-5.65a1 1 0 0 0-.71-.3z"/></svg>';
  const PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5a1 1 0 0 1 1-1z"/></svg>';
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 16.6 5.4 12.5a1 1 0 1 0-1.4 1.4l4.8 4.8a1 1 0 0 0 1.4 0L20 8.9a1 1 0 1 0-1.4-1.4z"/></svg>';
  const BAG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12.5a1 1 0 0 1-1 .5H7a1 1 0 0 1-1-.5z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/></svg>';
  const CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17 19 7"/></svg>';
  const GLYPHS = {
    dino: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="8.5" cy="8.5" r="1" fill="#fff"/><circle cx="15.5" cy="8.5" r="1" fill="#fff"/><circle cx="12" cy="12" r="1" fill="#fff"/><circle cx="8.5" cy="15.5" r="1" fill="#fff"/><circle cx="15.5" cy="15.5" r="1" fill="#fff"/>',
    optics: '<path d="M3 12h18"/><path d="M12 4c2 2.5 2 13.5 0 16-2-2.5-2-13.5 0-16z"/><path d="M3 8l9 4 9-4M3 16l9-4 9 4"/>',
    cost: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2M8 18.5h8"/>'
  };
  const LOGO = '<svg viewBox="0 0 1800 1800" aria-hidden="true">' +
    [[0,0,1],[0,1,0],[0,2,0],[1,1,1],[1,2,1],[2,0,1],[2,1,0],[2,2,0]].map(([c,r,on]) =>
      `<rect x="${c*627.27}" y="${r*627.27}" width="545.45" height="545.45" rx="81.8" fill="${on ? "currentColor" : "#898989"}"/>`).join("") + "</svg>";

  const appIcon = (p, extra = "") =>
    `<div class="app-icon ${extra}" style="background:linear-gradient(145deg,${p.icon.from},${p.icon.to})"><svg viewBox="0 0 24 24">${GLYPHS[p.icon.glyph] || ""}</svg></div>`;
  const thumb = p => p.type === "app" ? appIcon(p) : `<img src="${p.image}" alt="" loading="lazy">`;
  const statusText = s => ({ "in-stock": "In stock", "pre-order": "Pre-order", "enquire": "Made to order" }[s]);

  /* ---------- Cart ---------- */
  const KEY = "mm-store-cart-v1";
  const cart = {
    items: (() => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } })()
      .filter(i => byId[i.id] && byId[i.id].status !== "enquire"),
    save() { localStorage.setItem(KEY, JSON.stringify(this.items)); render.cartAll(); },
    key: (id, option) => id + "|" + (option || ""),
    add(id, qty = 1, option = "") {
      const p = byId[id]; if (!p || p.status === "enquire") return;
      if (p.type === "app" && !option) option = p.platforms[0];
      const hit = this.items.find(i => this.key(i.id, i.option) === this.key(id, option));
      if (hit) hit.qty = p.type === "app" ? 1 : Math.min(hit.qty + qty, 10);
      else this.items.push({ id, qty: p.type === "app" ? 1 : qty, option });
      this.save();
    },
    set(idx, qty) { if (qty <= 0) this.items.splice(idx, 1); else this.items[idx].qty = Math.min(qty, 10); this.save(); },
    clear() { this.items = []; this.save(); },
    count() { return this.items.reduce((n, i) => n + i.qty, 0); },
    totals() {
      const sub = this.items.reduce((s, i) => s + byId[i.id].price * i.qty, 0);
      const physicalSub = this.items.filter(i => byId[i.id].type === "physical").reduce((s, i) => s + byId[i.id].price * i.qty, 0);
      const hasPhysical = physicalSub > 0;
      const ship = !hasPhysical || physicalSub >= CFG.freeShippingOver ? 0 : CFG.shippingFlat;
      return { sub, ship, total: sub + ship, hasPhysical };
    }
  };

  /* ---------- Shared chrome ---------- */
  const page = document.body.dataset.page;
  const SOON = !!CFG.comingSoon;
  if (SOON) document.body.classList.add("soon");
  const BELL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';
  let nfId = 0;
  const notifyForm = (compact = false) => { const n = ++nfId; return `
    <form class="notify ${compact ? "compact" : ""}" data-notify novalidate>
      <div class="field"><input id="nf-name-${n}" name="Name" placeholder=" " autocomplete="name" required><label for="nf-name-${n}">Your name</label><p class="err">Please enter your name.</p></div>
      <div class="field"><input id="nf-mail-${n}" name="Email" type="email" placeholder=" " autocomplete="email" required><label for="nf-mail-${n}">Email</label><p class="err">Enter a valid email.</p></div>
      <button class="btn press" type="submit"><span>Notify me</span><span class="arrow">${ARROW}</span></button>
      <p class="notify-msg" role="status" aria-live="polite"></p>
    </form>`; };
  function chrome() {
    const nav = [["index.html#store", "Shop all", "all"], ["index.html?f=physical#store", "Products", "physical"], ["index.html?f=app#store", "Apps", "app"]];
    const header = $("#site-header");
    if (header) {
      header.className = "site-header" + (page === "home" ? " on-dark-top" : "");
      header.innerHTML = `<div class="wrap bar">
        <a class="brand" href="index.html" aria-label="MyMatrix Store home">${LOGO}<b>mymatrix</b><span>store</span></a>
        <nav class="nav" aria-label="Store">
          ${nav.map(([h, t]) => `<a class="hide-sm" href="${h}">${t}</a>`).join("")}
          <a class="hide-sm" href="https://mymatrix.design" rel="noopener">Studio ↗</a>
          ${SOON ? `<a class="cart-btn" href="index.html#notify">${BELL}<span class="label">Notify me</span></a>`
                 : `<button class="cart-btn" type="button" data-open-cart aria-label="Open cart">${BAG}<span class="label">Cart</span><span class="cart-count" aria-live="polite">0</span></button>`}
        </nav></div>`;
      const onScroll = () => {
        header.classList.toggle("scrolled", scrollY > 8);
        if (page === "home") header.classList.toggle("on-dark-top", scrollY < ($(".hero")?.offsetHeight || 0) - 80);
      };
      addEventListener("scroll", onScroll, { passive: true }); onScroll();
    }
    const footer = $("#site-footer");
    if (footer) {
      footer.className = "site-footer";
      footer.innerHTML = `<div class="wrap">
        <div class="cols">
          <div><a class="brand" href="index.html">${LOGO}<b>mymatrix</b><span>store</span></a>
            <p>Products and apps designed by MyMatrix Design Studios, sold direct by the team that made them.</p></div>
          <div><h6>Shop</h6><ul><li><a href="index.html?f=physical#store">Physical products</a></li><li><a href="index.html?f=app#store">Software apps</a></li><li>${SOON ? '<a href="index.html#notify">Get notified</a>' : '<a href="checkout.html">Cart & checkout</a>'}</li></ul></div>
          <div><h6>Studio</h6><ul><li><a href="https://mymatrix.design">mymatrix.design</a></li><li><a href="https://mymatrix.design/services.html">Services</a></li><li><a href="https://mymatrix.design/contact.html">Contact</a></li><li><a href="https://mymatrix.design/privacy.html">Privacy Policy</a></li></ul></div>
          <div><h6>Offices</h6><ul><li><p>Mumbai · <a href="tel:+919967163083">+91 99671 63083</a></p></li><li><p>Thanjavur</p></li></ul></div>
        </div>
        <div class="legal"><span>© ${new Date().getFullYear()} MyMatrix Design Studios. All rights reserved.</span><span>store.mymatrix.design</span></div>
      </div>`;
    }
    document.body.insertAdjacentHTML("beforeend", `
      <div class="scrim" data-close-cart></div>
      <aside class="sheet" role="dialog" aria-modal="true" aria-labelledby="cart-title" aria-hidden="true" inert>
        <header><h4 id="cart-title">Your cart</h4><button class="close" type="button" data-close-cart aria-label="Close cart">${CLOSE}</button></header>
        <div class="items" id="sheet-items"></div>
        <footer id="sheet-foot"></footer>
      </aside>
      <div class="toast" role="status" aria-live="polite"><span id="toast-text"></span><button type="button" data-open-cart>View cart</button></div>`);
  }

  /* ---------- Sheet ---------- */
  let lastFocus = null;
  function openCart() {
    const sheet = $(".sheet"); lastFocus = document.activeElement;
    sheet.removeAttribute("inert"); sheet.setAttribute("aria-hidden", "false");
    sheet.classList.add("open"); $(".scrim").classList.add("open");
    document.documentElement.style.overflow = "hidden";
    hideToast(); setTimeout(() => $(".sheet .close").focus(), reduceMotion ? 0 : 120);
  }
  function closeCart() {
    const sheet = $(".sheet"); if (!sheet.classList.contains("open")) return;
    sheet.classList.remove("open"); $(".scrim").classList.remove("open");
    sheet.setAttribute("aria-hidden", "true"); sheet.setAttribute("inert", "");
    document.documentElement.style.overflow = "";
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  let toastTimer;
  function toast(msg) {
    $("#toast-text").textContent = msg; $(".toast").classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, 3200);
  }
  function hideToast() { $(".toast")?.classList.remove("show"); }

  /* ---------- Renderers ---------- */
  const lineItem = (i, idx, editable) => {
    const p = byId[i.id];
    return `<div class="line-item">
      <a class="thumb" href="product.html?id=${p.id}">${thumb(p)}</a>
      <div><div class="name">${esc(p.name)}</div>
        <div class="meta">${p.type === "app" ? esc(i.option) + " · licence" : statusText(p.status)}${editable ? "" : " · Qty " + i.qty}</div>
        ${editable ? `<button class="remove" type="button" data-remove="${idx}">Remove</button>` : ""}</div>
      <div style="text-align:right">
        <div style="font-weight:500">${inr(p.price * i.qty)}</div>
        ${editable && p.type === "physical" ? `<div class="stepper" style="margin-top:8px"><button type="button" data-step="${idx}" data-d="-1" aria-label="Decrease">−</button><output>${i.qty}</output><button type="button" data-step="${idx}" data-d="1" aria-label="Increase">+</button></div>` : ""}
      </div></div>`;
  };
  const totalsHTML = t => `
    <div class="row-between muted"><span>Subtotal</span><span>${inr(t.sub)}</span></div>
    ${t.hasPhysical ? `<div class="row-between muted"><span>Shipping</span><span>${t.ship ? inr(t.ship) : "Free"}</span></div>` : ""}
    <div class="row-between"><span>Total</span><span class="total">${inr(t.total)}</span></div>`;
  const EMPTY = `<div class="empty">${BAG}<p>Your cart is empty.</p></div>`;

  const render = {
    cartAll() {
      $$(".cart-count").forEach(el => { el.textContent = cart.count(); el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); });
      const items = $("#sheet-items"), foot = $("#sheet-foot"); if (!items) return;
      if (!cart.items.length) { items.innerHTML = EMPTY; foot.innerHTML = `<a class="btn dark block press" href="index.html#store"><span>Browse the store</span><span class="arrow">${ARROW}</span></a>`; }
      else {
        items.innerHTML = cart.items.map((i, idx) => lineItem(i, idx, true)).join("");
        foot.innerHTML = totalsHTML(cart.totals()) + `<a class="btn block press" href="checkout.html"><span>Checkout</span><span class="arrow">${ARROW}</span></a>`;
      }
      if (page === "checkout") render.checkoutSummary();
    },

    card(p) {
      const badge = SOON ? '<span class="badge soon">Coming soon</span>' : p.status === "pre-order" ? '<span class="badge pre">Pre-order</span>' : p.status === "enquire" ? '<span class="badge ask">Made to order</span>' : p.type === "app" ? '<span class="badge">Instant delivery</span>' : "";
      const media = p.type === "app" ? `<a class="media app-media" href="product.html?id=${p.id}" aria-label="${esc(p.name)}">${appIcon(p)}${badge}</a>`
        : `<a class="media ${p.fit === "contain" ? "contain" : ""}" href="product.html?id=${p.id}" aria-label="${esc(p.name)}"><img src="${p.image}" alt="${esc(p.name)}" loading="lazy">${badge}</a>`;
      const buy = SOON ? `<span class="price soon-text">Coming soon</span><a class="link" href="product.html?id=${p.id}">Details ${ARROW}</a>`
        : p.status === "enquire"
        ? `<span class="price">On request</span><a class="link" href="product.html?id=${p.id}">Enquire ${ARROW}</a>`
        : `<span class="price">${inr(p.price)}${p.type === "app" ? "<small>" + (p.specs.Licence || "").split(",")[0] + "</small>" : ""}</span>
           <button class="icon-btn" type="button" data-add="${p.id}" aria-label="Add ${esc(p.name)} to cart">${PLUS}</button>`;
      return `<article class="card reveal" data-type="${p.type}">
        ${media}
        <div><div class="labels"><span class="upper accent">${esc(p.category)}</span><span class="upper">${p.type === "app" ? esc(p.platforms.join(" · ")) : "Physical"}</span></div>
          <h5 style="margin-top:12px"><a href="product.html?id=${p.id}">${esc(p.name)}</a></h5>
          <p class="tagline">${esc(p.tagline)}</p></div>
        <div class="buy">${buy}</div></article>`;
    },

    home() {
      const grid = $("#grid"); if (!grid) return;
      grid.innerHTML = CAT.map(render.card).join("");
      const counts = { all: CAT.length, physical: CAT.filter(p => p.type === "physical").length, app: CAT.filter(p => p.type === "app").length };
      $$(".chip").forEach(c => c.insertAdjacentHTML("beforeend", `<span class="n">${counts[c.dataset.filter]}</span>`));
      $("#stat-products") && ($("#stat-products").textContent = counts.physical);
      $("#stat-apps") && ($("#stat-apps").textContent = counts.app);
      const apply = f => {
        $$(".chip").forEach(c => c.setAttribute("aria-pressed", String(c.dataset.filter === f)));
        $$("#grid .card").forEach(c => c.classList.toggle("hide", f !== "all" && c.dataset.type !== f));
        $$("#grid .card:not(.hide)").forEach(c => c.classList.add("in"));
      };
      $$(".chip").forEach(c => c.addEventListener("click", () => {
        apply(c.dataset.filter);
        const u = new URL(location); c.dataset.filter === "all" ? u.searchParams.delete("f") : u.searchParams.set("f", c.dataset.filter);
        history.replaceState(null, "", u);
      }));
      apply(new URLSearchParams(location.search).get("f") || "all");
      const stack = $("#app-stack"); if (stack) stack.innerHTML = CAT.filter(p => p.type === "app").slice(0, 2).map(p => appIcon(p)).join("");
    },

    product() {
      const p = byId[new URLSearchParams(location.search).get("id")];
      const root = $("#pdp");
      if (!p) { root.innerHTML = `<div class="empty" style="padding:140px 0"><h3>Product not found</h3><p style="margin:16px 0 36px">It may have moved or sold out.</p><a class="btn press" href="index.html#store"><span>Back to the store</span><span class="arrow">${ARROW}</span></a></div>`; return; }
      document.title = `${p.name} — MyMatrix Store`;
      const enquire = p.status === "enquire";
      const stockCls = p.status === "pre-order" ? "pre" : enquire ? "ask" : "";
      const stockMsg = p.type === "app" ? "Available now · delivered by email" : p.status === "pre-order" ? "Pre-order · we'll confirm the dispatch date" : enquire ? "Made to order · talk to the studio" : "In stock · ships in 3–5 working days";
      let option = p.type === "app" ? p.platforms[0] : "";
      let qty = 1;
      const waEnquiry = `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(`Hi MyMatrix, I'd like to know more about ${p.name}.`)}`;
      root.innerHTML = `
        <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Store</a><span>/</span><a href="index.html?f=${p.type}#store">${p.type === "app" ? "Apps" : "Products"}</a><span>/</span><span>${esc(p.name)}</span></nav>
        <div class="pdp">
          <div class="gallery ${p.type === "app" ? "app" : ""} ${p.fit === "contain" ? "contain" : ""}">${p.type === "app" ? appIcon(p) : `<img src="${p.image}" alt="${esc(p.name)}">`}</div>
          <div>
            <div class="labels"><span class="upper accent">${esc(p.category)}</span><span class="upper">${p.type === "app" ? "Software app" : "Physical product"}</span></div>
            <h1>${esc(p.name)}</h1>
            <p class="tagline">${esc(p.tagline)}</p>
            ${SOON ? `<div class="price-row"><span class="price">Coming soon</span></div>
            <span class="stock pre"><i></i>Launching soon · leave your email and we'll tell you first</span>
            <div class="actions">${notifyForm(true)}</div>` : `
            <div class="price-row"><span class="price">${enquire ? "Price on request" : inr(p.price)}</span>${!enquire && p.type === "physical" ? '<span class="muted">incl. GST</span>' : ""}</div>
            <span class="stock ${stockCls}"><i></i>${stockMsg}</span>
            ${p.type === "app" ? `<span class="option-label upper">Platform</span><div class="seg" role="group" aria-label="Platform">${p.platforms.map((pl, n) => `<button type="button" data-platform="${esc(pl)}" aria-pressed="${n === 0}">${esc(pl)}</button>`).join("")}</div>` : ""}
            <div class="actions">
              ${enquire ? `<a class="btn press" href="${waEnquiry}" target="_blank" rel="noopener"><span>Enquire on WhatsApp</span><span class="arrow">${ARROW}</span></a>
                         <a class="btn ghost press" href="https://mymatrix.design/contact.html"><span>Contact the studio</span><span class="arrow">${ARROW}</span></a>`
                : `${p.type === "physical" ? `<div class="stepper lg" aria-label="Quantity"><button type="button" data-q="-1" aria-label="Decrease">−</button><output id="qty">1</output><button type="button" data-q="1" aria-label="Increase">+</button></div>` : ""}
                   <button class="btn press" type="button" id="add"><span>${p.status === "pre-order" ? "Pre-order" : "Add to cart"}</span><span class="arrow">${PLUS}</span></button>
                   <button class="btn ghost press" type="button" id="buy-now"><span>Buy now</span><span class="arrow">${ARROW}</span></button>`}
            </div>`}
            <div class="desc"><p>${esc(p.description)}</p>
              <ul class="ticks">${p.features.map(f => `<li>${TICK}<span>${esc(f)}</span></li>`).join("")}</ul>
              ${SOON ? "" : `<dl class="specs">${Object.entries(p.specs).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
              ${p.status === "pre-order" ? '<p class="note">Pre-orders are confirmed by our team before payment. We\'ll share the expected dispatch date when we confirm your order.</p>' : ""}
              ${p.type === "app" ? '<p class="note">Apps are delivered digitally. After your order is confirmed you\'ll receive the download link or licence key by email.</p>' : ""}`}
            </div>
          </div>
        </div>`;
      $$("[data-platform]").forEach(b => b.addEventListener("click", () => {
        option = b.dataset.platform; $$("[data-platform]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      }));
      $$("[data-q]").forEach(b => b.addEventListener("click", () => { qty = Math.max(1, Math.min(10, qty + Number(b.dataset.q))); $("#qty").textContent = qty; }));
      $("#add")?.addEventListener("click", () => { cart.add(p.id, qty, option); toast(`${p.name} added to cart`); });
      $("#buy-now")?.addEventListener("click", () => { cart.add(p.id, qty, option); location.href = "checkout.html"; });
      const more = $("#more");
      if (more) more.innerHTML = CAT.filter(x => x.id !== p.id && x.type === p.type).concat(CAT.filter(x => x.type !== p.type)).slice(0, 3).map(render.card).join("");
    },

    checkoutSummary() {
      const box = $("#summary"); if (!box) return;
      const t = cart.totals();
      box.innerHTML = `<h5>Order summary</h5>
        ${cart.items.length ? cart.items.map((i, idx) => lineItem(i, idx, false)).join("") : EMPTY}
        <div class="totals">${totalsHTML(t)}</div>
        <p class="fine">${t.hasPhysical && t.ship ? `Free shipping on physical products over ${inr(CFG.freeShippingOver)}. ` : ""}No payment is taken on this page. Our team confirms availability and sends you a secure payment link.</p>`;
      const addr = $("#address-set");
      if (addr) { addr.hidden = !t.hasPhysical; $$("input, textarea", addr).forEach(el => el.required = t.hasPhysical); }
      const submit = $("#place-order"); if (submit) submit.disabled = !cart.items.length;
    },

    checkout() {
      render.checkoutSummary();
      const form = $("#checkout-form");
      const validate = el => {
        const f = el.closest(".field"); if (!f) return true;
        const ok = el.checkValidity(); f.classList.toggle("invalid", !ok); return ok;
      };
      $$("input, textarea", form).forEach(el => {
        el.addEventListener("blur", () => el.value && validate(el));       // validate inline, not only on submit
        el.addEventListener("input", () => el.closest(".field").classList.contains("invalid") && validate(el));
      });
      form.addEventListener("submit", e => {
        e.preventDefault();
        const fields = $$("input, textarea", form).filter(el => !el.closest("[hidden]"));
        const bad = fields.filter(el => !validate(el));
        if (bad.length) { bad[0].focus(); return; }
        if (!cart.items.length) return;
        const d = Object.fromEntries(new FormData(form));
        const t = cart.totals();
        const lines = cart.items.map(i => { const p = byId[i.id]; return `• ${p.name}${p.type === "app" ? " (" + i.option + ")" : ""} × ${i.qty} — ${inr(p.price * i.qty)}`; });
        const ref = "MMS-" + Date.now().toString(36).toUpperCase().slice(-6);
        const msg = [`New order ${ref} from store.mymatrix.design`, "", ...lines, "",
          `Subtotal: ${inr(t.sub)}`, t.hasPhysical ? `Shipping: ${t.ship ? inr(t.ship) : "Free"}` : null, `Total: ${inr(t.total)}`, "",
          `Name: ${d.name}`, `Phone: ${d.phone}`, `Email: ${d.email}`,
          t.hasPhysical ? `Address: ${d.address}, ${d.city} ${d.pin}` : null, d.notes ? `Notes: ${d.notes}` : null].filter(x => x !== null).join("\n");
        window.open(`https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
        cart.clear();
        $("#checkout-root").innerHTML = `<div class="done reveal in"><div class="tick">${TICK}</div><h2>Thank you, <span class="thin">${esc(d.name.split(" ")[0])}.</span></h2>
          <p>Your order <b>${ref}</b> has opened in WhatsApp — press send there to reach our team. We'll confirm availability and share a payment link.</p>
          <a class="btn press" href="index.html#store"><span>Keep browsing</span><span class="arrow">${ARROW}</span></a></div>`;
        scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      });
    }
  };

  /* ---------- Events ---------- */
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-open-cart],[data-close-cart],[data-add],[data-remove],[data-step]");
    if (!t) return;
    if (t.matches("[data-open-cart]")) openCart();
    else if (t.matches("[data-close-cart]")) closeCart();
    else if (t.matches("[data-add]")) {
      const p = byId[t.dataset.add]; cart.add(p.id);
      t.classList.add("added"); t.innerHTML = CHECK; setTimeout(() => { t.classList.remove("added"); t.innerHTML = PLUS; }, 1400);
      toast(`${p.name} added to cart`);
    }
    else if (t.matches("[data-remove]")) cart.set(Number(t.dataset.remove), 0);
    else if (t.matches("[data-step]")) { const i = Number(t.dataset.step); cart.set(i, cart.items[i].qty + Number(t.dataset.d)); }
  });
  document.addEventListener("submit", e => {
    const form = e.target.closest("[data-notify]"); if (!form) return;
    e.preventDefault();
    const fields = $$("input", form);
    const bad = fields.filter(el => { const ok = el.checkValidity(); el.closest(".field").classList.toggle("invalid", !ok); return !ok; });
    if (bad.length) { bad[0].focus(); return; }
    const msg = $(".notify-msg", form), btn = $("button[type=submit]", form);
    msg.className = "notify-msg"; msg.textContent = "Sending…"; btn.disabled = true;
    fetch(CFG.notifyEndpoint, { method: "POST", body: new FormData(form) })
      .then(r => r.json())
      .then(d => {
        if (d.result !== "success") throw new Error("not saved");
        const first = esc((fields[0].value || "").trim().split(" ")[0]);
        form.outerHTML = `<div class="notify-done"><span class="tick">${TICK}</span><div><b>You're on the list${first ? ", " + first : ""}.</b><p>We'll email you when the store opens.</p></div></div>`;
      })
      .catch(() => { msg.className = "notify-msg err"; msg.textContent = "Something went wrong. Please try again."; btn.disabled = false; });
  });
  document.addEventListener("input", e => { const f = e.target.closest("[data-notify] .field.invalid"); if (f) f.classList.toggle("invalid", !e.target.checkValidity()); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeCart(); });
  addEventListener("storage", e => { if (e.key === KEY) { try { cart.items = JSON.parse(e.newValue) || []; } catch {} render.cartAll(); } });

  /* ---------- Boot ---------- */
  if (SOON && page === "checkout") { location.replace("index.html#notify"); return; }
  chrome();
  $$("[data-notify-slot]").forEach(el => { el.innerHTML = notifyForm(); });
  if (page === "home") render.home();
  if (page === "product") render.product();
  if (page === "checkout") render.checkout();
  render.cartAll();
  $$(".cart-count").forEach(el => el.classList.remove("bump"));

  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach(el => io.observe(el));
  } else $$(".reveal").forEach(el => el.classList.add("in"));
})();
