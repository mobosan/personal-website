import { writeFileSync } from 'node:fs';
// Deterministic source illustration; running this again produces the same asset.
let seed = 27;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
const points = Array.from({ length: 65 }, () => ({
  x: 60 + random() * 580,
  y: 45 + random() * 290,
}));
const lines = points
  .flatMap((p, i) =>
    points
      .slice(i + 1)
      .filter((q) => Math.hypot(p.x - q.x, p.y - q.y) < 110)
      .map(
        (q) =>
          `<path d="M${p.x.toFixed(1)} ${p.y.toFixed(1)}L${q.x.toFixed(1)} ${q.y.toFixed(1)}"/>`,
      ),
  )
  .join('');
const dots = points
  .map(
    (p, i) =>
      `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i % 5 === 0 ? 2.6 : 1.5}" fill="${i % 3 === 0 ? '#86d5f4' : '#b1a3ff'}"/>`,
  )
  .join('');
writeFileSync(
  'public/images/particles.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="380" viewBox="0 0 700 380"><defs><radialGradient id="p"><stop stop-color="#1a2140"/><stop offset="1" stop-color="#0c1424"/></radialGradient></defs><rect width="700" height="380" fill="url(#p)"/><g fill="none" stroke="#8a88dd" stroke-opacity=".25" stroke-width=".8">${lines}</g>${dots}<text x="28" y="350" font-family="monospace" font-size="10" letter-spacing="2" fill="#7688aa">SMALL DOTS. INFINITE CONNECTIONS.</text></svg>`,
);
