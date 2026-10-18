// Draws the demo catalog's product, category and banner pictures into public/images.
// Run with `npm run images` after changing products in supabase/seed.sql.
// Replace these with real photos (e.g. uploads to Supabase Storage) whenever you have them.
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const OUT = new URL("../public/images/", import.meta.url);

const C = {
  navy: "#2b3a67", red: "#d9534f", oat: "#e9dcc3", sage: "#93b294", pink: "#f3a2bd", yellow: "#f5c842",
  grey: "#a3a8b0", denim: "#5b7fb0", teal: "#2a9d8f", lilac: "#b39ddb", coral: "#f08a6c", cream: "#fbf3e4",
  white: "#ffffff", ink: "#1f2937", green: "#5fa865", orange: "#f4a259", sky: "#8ecae6",
};

// Garment outlines in a 400×400 box.
const P = {
  tee: "M140 95 L172 78 Q200 98 228 78 L260 95 L322 138 L296 180 L265 162 L265 322 L135 322 L135 162 L104 180 L78 138 Z",
  longsleeve: "M140 92 L172 76 Q200 96 228 76 L260 92 L298 118 L336 258 L304 268 L270 165 L266 324 L134 324 L130 165 L96 268 L64 258 L102 118 Z",
  dress: "M163 66 L184 66 Q200 84 216 66 L237 66 L248 142 L232 152 L304 334 L96 334 L168 152 L152 142 Z",
  pants: "M128 76 L272 76 L288 334 L220 334 L200 172 L180 334 L112 334 Z",
  shorts: "M122 118 L278 118 L298 272 L214 282 L200 202 L186 282 L102 272 Z",
  vest: "M148 78 L180 72 Q200 112 220 72 L252 78 L278 140 L278 324 L122 324 L122 140 Z",
  bodysuit: "M148 82 L174 72 Q200 92 226 72 L252 82 L298 124 L276 162 L256 150 L256 254 Q232 300 216 318 L184 318 Q168 300 144 254 L144 150 L124 162 L102 124 Z",
  romper: "M148 74 L174 64 Q200 84 226 64 L252 74 L296 116 L274 154 L256 142 L258 250 L272 336 L212 336 L200 262 L188 336 L128 336 L142 250 L144 142 L126 154 L104 116 Z",
  sack: "M158 76 Q200 98 242 76 L268 108 L274 298 Q200 350 126 298 L132 108 Z",
  hat: "M126 232 Q132 128 200 124 Q268 128 274 232 Z",
  sock: "M150 82 L204 82 L204 226 L256 266 Q276 300 240 314 L170 302 Q140 292 148 250 Z",
  sneaker: "M70 252 L92 166 L170 172 Q214 210 282 214 Q336 222 332 272 L70 272 Z",
};

const shape = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" stroke="rgba(0,0,0,.12)" stroke-width="3" stroke-linejoin="round" ${extra}/>`;

function stripes(d, base, stripe, id) {
  const bands = Array.from({ length: 10 }, (_, i) => `<rect x="0" y="${100 + i * 26}" width="400" height="12" fill="${stripe}"/>`).join("");
  return `<clipPath id="${id}"><path d="${d}"/></clipPath>${shape(d, base)}<g clip-path="url(#${id})">${bands}</g>`;
}

const star = (x, y, r, fill) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2, rr = i % 2 ? r / 2.4 : r;
    return `${x + rr * Math.cos(a)},${y + rr * Math.sin(a)}`;
  }).join(" ");
  return `<polygon points="${pts}" fill="${fill}"/>`;
};
const flower = (x, y, c) =>
  [0, 72, 144, 216, 288].map((a) => `<circle cx="${x + 9 * Math.cos((a * Math.PI) / 180)}" cy="${y + 9 * Math.sin((a * Math.PI) / 180)}" r="6" fill="${c}"/>`).join("") +
  `<circle cx="${x}" cy="${y}" r="5" fill="${C.yellow}"/>`;
const dino = (x, y, c) =>
  `<path transform="translate(${x} ${y})" fill="${c}" d="M0 30 Q10 0 40 4 Q58 6 62 -12 L74 -14 Q80 -6 72 2 Q66 22 50 30 L48 46 L40 46 L38 34 L20 34 L18 46 L10 46 L8 34 Q-14 40 -28 30 Q-10 30 0 30 Z"/>`;
const rainbow = (x, y) =>
  [C.red, C.orange, C.yellow, C.green, C.sky].map((c, i) => `<path d="M${x - 50 + i * 8} ${y} A ${50 - i * 8} ${50 - i * 8} 0 0 1 ${x + 50 - i * 8} ${y}" fill="none" stroke="${c}" stroke-width="8"/>`).join("");

// One drawing per product; `color` picks the variant colour shown.
const products = {
  "organic-cotton-bodysuit-3-pack": (k) => `<g transform="translate(-60 10) scale(.8)">${shape(P.bodysuit, k ? C.sage : C.oat)}</g><g transform="translate(140 10) scale(.8)">${shape(P.bodysuit, k ? C.oat : C.sage)}</g><g transform="translate(40 40) scale(.8)">${shape(P.bodysuit, C.white)}</g>`,
  "ribbed-knit-romper": (k) => shape(P.romper, k ? C.sage : C.oat) + `<line x1="200" y1="88" x2="200" y2="250" stroke="rgba(0,0,0,.15)" stroke-width="3" stroke-dasharray="2 14"/>`,
  "chunky-knit-baby-cardigan": (k) => shape(P.longsleeve, k ? C.cream : C.lilac) + `<line x1="200" y1="96" x2="200" y2="324" stroke="rgba(0,0,0,.2)" stroke-width="3"/>` + [140, 185, 230, 275].map((y) => `<circle cx="214" cy="${y}" r="7" fill="#8d6e63"/>`).join(""),
  "striped-cotton-tee": (k) => stripes(P.tee, C.white, k ? C.red : C.navy, `s${k}`),
  "dino-graphic-tee": (k) => shape(P.tee, k ? C.sky : C.sage) + dino(170, 190, C.green),
  "rainbow-pullover-hoodie": (k) => `<path d="M150 98 Q200 20 250 98 Z" fill="${k ? C.teal : C.grey}" stroke="rgba(0,0,0,.12)" stroke-width="3"/>` + shape(P.longsleeve, k ? C.teal : C.grey) + rainbow(200, 200) + `<rect x="152" y="250" width="96" height="44" rx="10" fill="rgba(0,0,0,.08)"/>`,
  "floral-twirl-dress": (k) => shape(P.dress, k ? C.yellow : C.pink) + [[160, 220], [210, 260], [250, 300], [150, 300], [200, 200], [240, 230]].map(([x, y]) => flower(x, y, C.white)).join(""),
  "denim-pinafore-dress": () => `<rect x="168" y="40" width="14" height="70" fill="${C.denim}"/><rect x="218" y="40" width="14" height="70" fill="${C.denim}"/>` + shape("M160 100 L240 100 L250 150 L300 334 L100 334 L150 150 Z", C.denim) + `<rect x="178" y="190" width="44" height="36" rx="6" fill="rgba(255,255,255,.18)"/>`,
  "party-tulle-dress": (k) => shape(P.dress, k ? C.lilac : C.pink) + Array.from({ length: 18 }, (_, i) => `<circle cx="${130 + ((i * 47) % 140)}" cy="${180 + ((i * 31) % 140)}" r="3" fill="#fff"/>`).join(""),
  "stretch-denim-jeans": () => shape(P.pants, C.denim) + `<path d="M128 76 L272 76 L273 92 L127 92 Z" fill="rgba(0,0,0,.12)"/><path d="M150 100 Q165 130 190 112" fill="none" stroke="#f5c842" stroke-width="3"/>`,
  "everyday-jogger-pants": (k) => shape(P.pants, k ? C.navy : C.grey) + `<rect x="114" y="314" width="58" height="20" fill="rgba(0,0,0,.12)"/><rect x="228" y="314" width="58" height="20" fill="rgba(0,0,0,.12)"/><path d="M190 80 L184 110 M210 80 L216 110" stroke="#fff" stroke-width="3"/>`,
  "cargo-play-shorts": () => shape(P.shorts, "#b7a77a") + `<rect x="114" y="200" width="44" height="40" rx="6" fill="rgba(0,0,0,.12)"/><rect x="242" y="200" width="44" height="40" rx="6" fill="rgba(0,0,0,.12)"/>`,
  "puddle-rain-jacket": (k) => `<path d="M148 100 Q200 14 252 100 Z" fill="${k ? C.navy : C.yellow}" stroke="rgba(0,0,0,.12)" stroke-width="3"/>` + shape(P.longsleeve, k ? C.navy : C.yellow) + `<line x1="200" y1="96" x2="200" y2="324" stroke="rgba(0,0,0,.25)" stroke-width="4"/><rect x="134" y="300" width="132" height="8" fill="#e0e0e0"/>`,
  "fleece-lined-winter-parka": (k) => `<path d="M144 102 Q200 8 256 102 Z" fill="#e8e1d6" stroke="#cfc6b8" stroke-width="10"/>` + shape("M140 92 L172 76 Q200 96 228 76 L260 92 L298 118 L336 288 L304 298 L270 165 L270 346 L130 346 L130 165 L96 298 L64 288 L102 118 Z", k ? "#5d6b4f" : "#7a4b3a") + `<line x1="200" y1="96" x2="200" y2="346" stroke="rgba(0,0,0,.25)" stroke-width="4"/>`,
  "quilted-puffer-vest": (k) => shape(P.vest, k ? C.navy : C.coral) + [130, 170, 210, 250, 290].map((y) => `<line x1="124" y1="${y}" x2="276" y2="${y}" stroke="rgba(0,0,0,.15)" stroke-width="3"/>`).join(""),
  "dinosaur-pajama-set": () => `<g transform="translate(0 50) scale(.62)">${shape(P.longsleeve, C.sage)}${dino(170, 190, C.green)}</g><g transform="translate(170 80) scale(.6)">${shape(P.pants, C.sage)}</g>`,
  "starry-night-pajama-set": () => `<g transform="translate(0 50) scale(.62)">${shape(P.longsleeve, C.navy)}${star(170, 170, 16, C.yellow)}${star(230, 230, 12, C.yellow)}${star(180, 280, 10, C.yellow)}</g><g transform="translate(170 80) scale(.6)">${shape(P.pants, C.navy)}${star(160, 200, 14, C.yellow)}${star(240, 260, 14, C.yellow)}</g>`,
  "cozy-fleece-sleep-sack": (k) => shape(P.sack, k ? C.lilac : C.sky) + `<line x1="200" y1="96" x2="200" y2="318" stroke="rgba(0,0,0,.2)" stroke-width="4"/>` + star(160, 200, 14, "#fff") + star(240, 250, 10, "#fff"),
  "cotton-sun-hat": () => `<ellipse cx="200" cy="236" rx="150" ry="34" fill="${C.cream}" stroke="rgba(0,0,0,.12)" stroke-width="3"/>` + shape(P.hat, C.cream) + `<rect x="130" y="200" width="140" height="18" fill="${C.coral}"/>`,
  "rainbow-socks-5-pack": () => [C.red, C.orange, C.yellow, C.green, C.sky].map((c, i) => `<g transform="translate(${-110 + i * 50} ${i % 2 ? 20 : 0}) scale(.8)">${shape(P.sock, c)}<rect x="150" y="82" width="54" height="22" fill="rgba(255,255,255,.5)"/></g>`).join(""),
  "light-up-sneakers": () => shape(P.sneaker, C.pink) + `<rect x="66" y="268" width="270" height="22" rx="8" fill="#fff" stroke="rgba(0,0,0,.12)" stroke-width="3"/>` + [C.red, C.yellow, C.green, C.sky, C.lilac].map((c, i) => `<circle cx="${100 + i * 52}" cy="279" r="6" fill="${c}"/>`).join("") + `<path d="M120 190 L160 196 M118 210 L170 216 M116 230 L180 236" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`,
};

const backgrounds = [["#fdf2e9", "#fbe4d5"], ["#eef6f3", "#dcefe8"], ["#f3effa", "#e6ddf5"], ["#eef4fb", "#dde9f7"], ["#fff8e1", "#fdecb5"]];

const svg = (w, h, body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${bg}"/>${body}</svg>`;

const categoryArt = {
  baby: "organic-cotton-bodysuit-3-pack", "tops-tees": "striped-cotton-tee", dresses: "floral-twirl-dress", "pants-shorts": "stretch-denim-jeans",
  outerwear: "puddle-rain-jacket", sleepwear: "starry-night-pajama-set", "shoes-accessories": "light-up-sneakers",
};

async function main() {
  await mkdir(new URL("products/", OUT), { recursive: true });
  await mkdir(new URL("categories/", OUT), { recursive: true });
  await mkdir(new URL("banners/", OUT), { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
  const page = await browser.newPage();
  const render = async (markup, w, h, file) => {
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<style>html,body{margin:0}</style>${markup}`);
    await page.screenshot({ path: new URL(file, OUT).pathname, type: "jpeg", quality: 85 });
  };

  let i = 0;
  for (const [slug, draw] of Object.entries(products)) {
    const [bg1, bg2] = backgrounds[i++ % backgrounds.length];
    await render(svg(800, 800, `<g transform="scale(2)">${draw(0)}</g>`, bg1), 800, 800, `products/${slug}-1.jpg`);
    await render(svg(800, 800, `<g transform="translate(400 400) rotate(-8) scale(1.7) translate(-200 -200)">${draw(1)}</g>`, bg2), 800, 800, `products/${slug}-2.jpg`);
  }

  i = 0;
  for (const [slug, art] of Object.entries(categoryArt)) {
    await render(svg(600, 400, `<g transform="translate(150 20) scale(.9)">${products[art](0)}</g>`, backgrounds[i++ % backgrounds.length][0]), 600, 400, `categories/${slug}.jpg`);
  }

  const scatter = (slugs, bg) => {
    const items = slugs.map((s, n) => `<g transform="translate(${700 + (n % 4) * 200} ${30 + Math.floor(n / 4) * 320 + (n % 2) * 40}) rotate(${(n % 3) * 6 - 6} 100 100) scale(.62)">${products[s](n % 2)}</g>`);
    return svg(1600, 700, items.join(""), bg);
  };
  await render(scatter(["striped-cotton-tee", "floral-twirl-dress", "dino-graphic-tee", "light-up-sneakers", "rainbow-pullover-hoodie", "cargo-play-shorts", "cotton-sun-hat", "rainbow-socks-5-pack"], "#0f766e"), 1600, 700, "banners/made-for-play.jpg");
  await render(scatter(["puddle-rain-jacket", "fleece-lined-winter-parka", "quilted-puffer-vest", "light-up-sneakers"], "#115e59"), 1600, 700, "banners/rain-or-shine.jpg");

  await browser.close();
  console.log(`Wrote ${Object.keys(products).length * 2} product, ${Object.keys(categoryArt).length} category and 2 banner images.`);
}

main();
