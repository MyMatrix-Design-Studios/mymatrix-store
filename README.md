# MyMatrix Store — store.mymatrix.design

Static storefront for physical products and software apps by MyMatrix Design Studios.
No build step: plain HTML, CSS and JS, ready for GitHub Pages (the `CNAME` file sets the domain).

## Edit products
Everything on sale lives in `assets/js/catalog.js`: names, prices, stock status, specs, images, app platforms.
The current entries are **sample data** — replace prices, specs and the three apps with real ones before launch.

- `status: "in-stock" | "pre-order" | "enquire"` (enquire hides the price and shows WhatsApp / contact buttons)
- Physical products use `image`; apps use `icon: { from, to, glyph }` (glyphs: `dino`, `optics`, `cost`)

## Orders
There is no payment gateway yet. Checkout builds the order and opens WhatsApp to `STORE_CONFIG.whatsapp`
with the full order pre-filled; the team confirms and sends a payment link. To take payments online,
connect a gateway (e.g. Razorpay Payment Links or Shopify Buy Button) in `render.checkout()` in `assets/js/store.js`.

## Pages
- `index.html` — hero, Products / Apps entry points, filterable catalogue
- `product.html?id=<id>` — product detail
- `checkout.html` — contact + shipping form and order summary

Run locally: `python -m http.server` in this folder, then open http://localhost:8000

## Coming soon mode
`STORE_CONFIG.comingSoon` in `assets/js/catalog.js` is `true`: prices, specs, cart and checkout are hidden and
visitors leave their name and email (sent to the same Google Sheet as the main site's footer signup).
Set it to `false` to open the full store.
