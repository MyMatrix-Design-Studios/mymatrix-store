/*
  MyMatrix Store catalog — the only file you need to edit to change what's on sale.

  ⚠ SAMPLE DATA: prices, stock status, specs and the three apps below are placeholders
  written to show the layout. Replace them with real details before going live.

  Fields
    id          unique, used in links: product.html?id=<id>
    type        "physical" | "app"
    status      "in-stock" | "pre-order" | "enquire"   (enquire hides the price and the cart button)
    price       in rupees (number). Ignored when status is "enquire".
    image       physical products: path to a photo
    fit         optional "contain" to show the whole photo on white instead of cropping it
    icon        apps: { from, to, glyph }  colours + one of the glyphs in store.js (dino, optics, cost)
    platforms   apps only
*/
window.STORE_CONFIG = {
  // true  = "Coming soon": no prices, specs or cart; visitors leave name + email to be notified.
  // false = full store with prices, cart and WhatsApp checkout.
  comingSoon: true,
  // Same Google Sheet signup the main site footer uses (fields: Name, Email).
  notifyEndpoint: "https://script.google.com/macros/s/AKfycbzowQYkeOdxkMinOpZs6Wpnzl1-wXWxc8tUceUgMv-afY_TiK56Qp9yWvPijV-ZbRJCYw/exec",
  currency: "INR",
  // Orders are sent to this WhatsApp number as a pre-filled message (no online payment yet).
  whatsapp: "919967163083",
  shippingFlat: 150,          // added once when the cart has any physical product
  freeShippingOver: 2999
};

window.CATALOG = [
  {
    id: "dino-defender-board-game",
    type: "physical",
    name: "Dino Defender",
    tagline: "The board game where playtime meets arithmetic.",
    category: "Game Design",
    status: "in-stock",
    price: 1499,
    image: "assets/img/dino-defender.jpg",
    fit: "contain",            // show the whole image (it has text on the right edge)
    description: "A clever dinosaur has broken out of the old lab and is heading for the village bridge. Players solve addition, subtraction, multiplication and division problems to remove the right stones before it crosses. Every dice roll changes the plan, so children learn to adapt, not memorise.",
    features: ["Builds confidence with the four basic operations", "Dice-driven play: no two games are the same", "For 2–4 players, ages 6+", "Designed in-house by MyMatrix Design Studios"],
    specs: { Players: "2–4", Age: "6+", "Play time": "20–30 min", "In the box": "Board, bridge stones, dino & hero tokens, dice, cards" }
  },
  {
    id: "chillpack-plus",
    type: "physical",
    name: "ChillPack+",
    tagline: "Portable cooling, carried like a bag.",
    category: "Technology",
    status: "pre-order",
    price: 7999,
    image: "assets/img/chillpack.jpg",
    description: "A compact active-cooling pack with a fold-flat carry handle and a status display, designed for medicines, samples and anything that has to stay cold on the move.",
    features: ["Active cooling with live temperature display", "Fold-flat handle for easy carrying", "Rechargeable battery", "Easy-clean interior"],
    specs: { Capacity: "6 L", Battery: "Up to 8 h", Charging: "USB-C", Weight: "2.1 kg" }
  },
  {
    id: "minipapa-minimama",
    type: "physical",
    name: "miniPAPA & miniMAMA",
    tagline: "A pair of countertop companions for the kitchen.",
    category: "Industrial Design",
    status: "pre-order",
    price: 4499,
    image: "assets/img/minipapa.jpg",
    description: "A matched pair of countertop appliances with a clear body, soft-touch controls and a sculpted lid — built to look good left out on the counter.",
    features: ["Transparent body so you can see inside", "One-touch controls", "Dishwasher-safe container", "Sold as a matched pair"],
    specs: { Material: "Food-grade Tritan, ABS", Power: "230 V", Warranty: "1 year" }
  },
  {
    id: "dual-function-tower-fan",
    type: "physical",
    name: "Dual Function Tower Fan",
    tagline: "Fan and air purifier in one slim tower.",
    category: "Industrial Design",
    status: "pre-order",
    price: 9999,
    image: "assets/img/towerfan.jpg",
    description: "A slim tower that switches between a cooling fan and a filtered air purifier, with a top control strip and a footprint small enough for any room.",
    features: ["Fan and purifier modes", "Replaceable filter", "Top touch controls", "Quiet night mode"],
    specs: { Height: "105 cm", Modes: "Fan · Purify · Night", Filter: "Replaceable", Warranty: "1 year" }
  },
  {
    id: "biblade-x",
    type: "physical",
    name: "BiBladeX",
    tagline: "A personal flying concept, built to order.",
    category: "Industrial Design",
    status: "enquire",
    price: 0,
    image: "assets/img/biblade.jpg",
    description: "A single-seat coaxial-rotor concept vehicle. BiBladeX is built to order for research partners and exhibitions — talk to the studio about availability.",
    features: ["Coaxial twin-rotor layout", "Single-seat open cabin", "Built to order"],
    specs: { Availability: "Made to order", Lead: "On request" }
  },
  {
    id: "dino-defender-app",
    type: "app",
    name: "Dino Defender: Tablet Edition",
    tagline: "The board game, now on your tablet.",
    category: "Learning app",
    status: "in-stock",
    price: 199,
    icon: { from: "#afa2fe", to: "#6c5ce7", glyph: "dino" },
    platforms: ["Android", "iPad"],
    description: "All the bridge-breaking maths of Dino Defender with adaptive difficulty and progress tracking for parents.",
    features: ["Adaptive difficulty", "Parent progress dashboard", "Works offline", "No ads, no in-app purchases"],
    specs: { Platforms: "Android 9+, iPadOS 16+", Licence: "One-time purchase, up to 3 devices", Delivery: "Download link by email" }
  },
  {
    id: "optics-toolkit",
    type: "app",
    name: "Matrix Optics Toolkit",
    tagline: "Lens and ray calculations from our optics desk.",
    category: "Engineering tool",
    status: "in-stock",
    price: 2499,
    icon: { from: "#2c3e50", to: "#3d7bd9", glyph: "optics" },
    platforms: ["Windows", "macOS"],
    description: "The calculators our optics team uses every day — focal length, magnification, field of view and quick ray sketches — packaged as one desktop app.",
    features: ["Thin-lens and lens-system calculators", "Field-of-view and sensor matching", "Export results to PDF", "Free updates for 12 months"],
    specs: { Platforms: "Windows 10+, macOS 13+", Licence: "Per user, lifetime", Delivery: "Licence key by email" }
  },
  {
    id: "dfm-cost-estimator",
    type: "app",
    name: "Prototype Cost Estimator",
    tagline: "Know what a prototype costs before you build it.",
    category: "Engineering tool",
    status: "in-stock",
    price: 1499,
    icon: { from: "#111111", to: "#4d4d4d", glyph: "cost" },
    platforms: ["Web"],
    description: "Estimate prototyping and small-batch costs for 3D printing, CNC and moulding, based on the design-for-manufacture checks we run for clients.",
    features: ["3D printing, CNC and moulding estimates", "DFM checklist for each process", "Shareable quotes", "12 months of access"],
    specs: { Platform: "Any modern browser", Licence: "12-month subscription", Delivery: "Account invite by email" }
  }
];
