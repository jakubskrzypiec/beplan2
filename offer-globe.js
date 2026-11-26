// Offer finale: a spinning globe that the scroll flies into, then pulls far away from into the stars.
import { feature, geoDistance, geoOrthographic, geoPath, mesh, world } from './assets/globe-geometry.js';

const section = document.querySelector('.offer-space');
const canvas = section?.querySelector('.space-canvas');
const context = canvas?.getContext('2d');
if (section && context) run();

function run() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const countries = world.objects.countries;
  const projectCountries = new Set(['616', '724', '250', '620', '705', '784', '710']);
  const highlighted = {
    type: 'FeatureCollection',
    features: feature(world, countries).features.filter((country) => projectCountries.has(String(country.id))),
  };
  const land = feature(world, world.objects.land);
  const borders = mesh(world, countries, (a, b) => a !== b);
  const projection = geoOrthographic().precision(0.6);
  const path = geoPath(projection, context);
  const cityItems = [...section.querySelectorAll('.space-cities li')];
  const cities = cityItems.map((item) => ({ item, name: item.textContent.trim(), at: item.dataset.at.split(',').map(Number), side: item.dataset.side }));

  // A fixed star field, positions relative to the centre of the screen.
  let seed = 7;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const stars = Array.from({ length: 340 }, () => ({
    x: random() * 2.4 - 1.2,
    y: random() * 2.4 - 1.2,
    size: 0.35 + random() * random() * 1.5,
    phase: random() * Math.PI * 2,
    base: 0.25 + random() * 0.75,
  }));
  // A faint galactic band that shows up once we are far out.
  const band = Array.from({ length: 900 }, () => {
    const along = random() * 2.6 - 1.3;
    const spread = (random() + random() + random() - 1.5) * 0.16;
    return { along, spread, size: 0.3 + random() * 0.9, base: 0.2 + random() * 0.6 };
  });
  let lastP = 0;
  let speed = 0;

  let width = 0;
  let height = 0;
  let visible = false;
  let frame = null;
  let spin = 0;
  let last = null;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const span = (p, a, b) => clamp((p - a) / (b - a));
  const mix = (a, b, t) => a + (b - a) * t;
  const logMix = (a, b, t) => Math.exp(mix(Math.log(a), Math.log(b), t));
  const smooth = (t) => 0.5 - Math.cos(Math.PI * t) / 2;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
    wake();
  }, { passive: true });

  function progress() {
    if (reduced.matches) return 0;
    const travel = section.offsetHeight - window.innerHeight;
    return travel > 0 ? clamp(-section.getBoundingClientRect().top / travel) : 0;
  }

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    draw(0);
  }

  function draw(step) {
    if (!width || !height) return;
    const p = progress();
    if (!reduced.matches) spin += step * 0.02 * smooth(span(progress(), 0.06, 0.74));

    // Start: half a globe rising from the bottom edge, turned to Europe and following the mouse.
    // Scrolling pulls it away into space at a calm pace.
    const pullOut = smooth(span(p, 0.06, 0.74));
    const compact = width < 760;
    const rStart = compact ? width * 0.62 : Math.min(width * 0.44, height * 0.62);
    const radius = logMix(rStart, 2.5, pullOut);
    const cx = width / 2;
    const cy = mix(height + rStart * 0.14, height / 2, smooth(span(p, 0.06, 0.5)));

    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    const hold = 1 - pullOut;
    const lon = 15 + pointer.x * 16 * hold + spin;
    const lat = 12 + pointer.y * 8 * hold;
    projection.scale(radius).translate([cx, cy]).rotate([-lon, -lat]);

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    const time = performance.now() / 1000;
    const mid = height / 2;
    // How fast the reader is scrolling through the flight: drives the star streaks.
    speed += (Math.min(Math.abs(p - lastP) * 60, 1) - speed) * 0.15;
    lastP = p;

    // Nebulae: soft clouds of colour that swell in the middle of the flight and drift past.
    const haze = Math.sin(Math.PI * span(p, 0.12, 0.9));
    if (haze > 0.01) {
      const clouds = [
        [0.22 - pullOut * 0.18, 0.28 + pullOut * 0.1, 0.55, '71,133,197'],
        [0.82 + pullOut * 0.12, 0.7 - pullOut * 0.15, 0.5, '96,84,170'],
        [0.6 - pullOut * 0.3, 0.12 + pullOut * 0.2, 0.35, '127,176,227'],
      ];
      for (const [fx, fy, size, rgb] of clouds) {
        const r = Math.max(width, height) * size * (1.25 - pullOut * 0.45);
        const g = context.createRadialGradient(width * fx, height * fy, 0, width * fx, height * fy, r);
        g.addColorStop(0, `rgba(${rgb},${(0.16 * haze).toFixed(3)})`);
        g.addColorStop(0.5, `rgba(${rgb},${(0.05 * haze).toFixed(3)})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        context.fillStyle = g;
        context.fillRect(0, 0, width, height);
      }
    }

    // Galactic band, tilted across the sky, appears once we are far away.
    const galaxy = span(p, 0.42, 0.82);
    if (galaxy > 0) {
      const angle = -0.42;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const reach = Math.hypot(width, height) * 0.5;
      context.fillStyle = '#dfe9ff';
      for (const dot of band) {
        const u = dot.along * reach;
        const v = dot.spread * reach;
        const x = cx + u * cos - v * sin;
        const y = mid + u * sin + v * cos;
        if (x < 0 || x > width || y < 0 || y > height) continue;
        context.globalAlpha = dot.base * galaxy * 0.7;
        context.fillRect(x, y, dot.size, dot.size);
      }
    }

    // Stars: faint at first, brighter and drawn towards the centre as we pull away,
    // streaking while the scroll is quick.
    const starLight = mix(0.4, 1, pullOut);
    const converge = 1 - pullOut * 0.35;
    const streak = speed * Math.sin(Math.PI * pullOut) * 0.12;
    context.fillStyle = '#fff';
    context.strokeStyle = '#fff';
    for (const star of stars) {
      const dx = star.x * width * 0.5 * converge;
      const dy = star.y * height * 0.5 * converge;
      const x = cx + dx;
      const y = mid + dy;
      if (x < -2 || x > width + 2 || y < -2 || y > height + 2) continue;
      const twinkle = 0.65 + 0.35 * Math.sin(time * 1.3 + star.phase);
      context.globalAlpha = star.base * twinkle * starLight;
      if (streak > 0.004) {
        context.lineWidth = star.size;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + dx * streak, y + dy * streak);
        context.stroke();
      } else {
        context.fillRect(x, y, star.size, star.size);
      }
    }
    context.globalAlpha = 1;

    if (radius > 1.5) {
      // Atmosphere glow
      const glow = context.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius * 1.22);
      glow.addColorStop(0, '#4785c540');
      glow.addColorStop(1, '#4785c500');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(cx, cy, radius * 1.22, 0, Math.PI * 2);
      context.fill();

      const shade = context.createRadialGradient(cx - radius * 0.25, cy - radius * 0.35, 0, cx, cy, radius);
      shade.addColorStop(0, '#2a2a2a');
      shade.addColorStop(1, '#0c0c0c');
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.fillStyle = shade;
      context.fill();
      context.strokeStyle = '#7fb0e366';
      context.lineWidth = 1;
      context.stroke();

      if (radius > 12) {
        context.lineWidth = 0.75;
        context.beginPath(); path(land); context.fillStyle = '#a4a4a414'; context.fill();
        context.beginPath(); path(highlighted); context.fillStyle = '#bababa33'; context.fill();
        context.beginPath(); path(land); context.strokeStyle = '#b1b1b170'; context.stroke();
        context.beginPath(); path(borders); context.strokeStyle = '#b1b1b155'; context.stroke();
        drawCities(radius, lon, lat, compact);
      }
    }

    // The Moon slides past close to the camera on the way out.
    const moonT = span(p, 0.16, 0.62);
    if (moonT > 0 && moonT < 1) {
      const small = Math.min(width, height);
      const mr = small * mix(0.13, 0.035, smooth(moonT));
      const mx = mix(width * 1.12, width * 0.08, smooth(moonT));
      const my = mix(height * 0.22, height * 0.34, moonT);
      context.globalAlpha = Math.sin(Math.PI * moonT) * 1.4 > 1 ? 1 : Math.sin(Math.PI * moonT) * 1.4;
      const moonShade = context.createRadialGradient(mx - mr * 0.35, my - mr * 0.35, mr * 0.1, mx, my, mr);
      moonShade.addColorStop(0, '#9a9a9a');
      moonShade.addColorStop(0.6, '#4a4a4a');
      moonShade.addColorStop(1, '#151515');
      context.fillStyle = moonShade;
      context.beginPath();
      context.arc(mx, my, mr, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#00000038';
      for (const [ox, oy, s] of [[-0.3, -0.1, 0.18], [0.25, 0.2, 0.12], [0.05, -0.4, 0.09], [-0.1, 0.35, 0.14], [0.4, -0.15, 0.07]]) {
        context.beginPath();
        context.arc(mx + ox * mr, my + oy * mr, s * mr, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    }

    // Overlay copy follows the same timeline.
    section.style.setProperty('--intro', (1 - span(p, 0.04, 0.2)).toFixed(3));
    section.style.setProperty('--end', span(p, 0.66, 0.8).toFixed(3));
    section.classList.toggle('is-intro', p < 0.12);
    section.classList.toggle('is-end', p > 0.72);
  }

  function drawCities(radius, lon, lat, compact) {
    const labelled = radius > 140;
    const size = clamp(radius / 30, compact ? 11 : 12, compact ? 16 : 20);
    context.font = `500 ${size}px "Rethink Sans", Arial, sans-serif`;
    context.textBaseline = 'middle';
    const fade = clamp((radius - 20) / 60);
    for (const [index, city] of cities.entries()) {
      if (geoDistance(city.at, [lon, lat]) > Math.PI * 0.48) continue;
      const [x, y] = projection(city.at);
      if (x < -40 || x > width + 40 || y < -40 || y > height + 40) continue;
      context.globalAlpha = fade;
      context.beginPath();
      context.arc(x, y, index < 2 ? 3.4 : 2.6, 0, Math.PI * 2);
      context.shadowBlur = 14;
      context.shadowColor = '#4785c5';
      context.fillStyle = '#7fb0e3';
      context.fill();
      context.shadowBlur = 0;
      if (!labelled || (compact && index > 5) || (radius < 300 && index > 2)) continue;
      if (city.side === '-') continue;
      const side = city.side === 'l' ? -1 : 1;
      const reach = size * 2.4;
      const textWidth = context.measureText(city.name).width;
      const end = x + side * reach;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(end, y);
      context.strokeStyle = '#7fb0e38c';
      context.stroke();
      context.fillStyle = '#ededed';
      context.fillText(city.name, side === 1 ? end + 6 : end - 6 - textWidth, y);
    }
    context.globalAlpha = 1;
  }

  function onScreen() {
    const rect = section.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  }

  function tick(now) {
    visible = onScreen();
    if (!visible) { frame = null; last = null; return; }
    const step = last === null ? 0 : Math.min(now - last, 64);
    last = now;
    draw(step);
    frame = requestAnimationFrame(tick);
  }

  function wake() {
    if (frame === null && onScreen()) frame = requestAnimationFrame(tick);
  }
  // Capture catches the page scroll whichever element does the scrolling.
  window.addEventListener('scroll', wake, { passive: true, capture: true });
  window.addEventListener('resize', wake);
  wake();
  new ResizeObserver(resize).observe(canvas);
  document.addEventListener('beplan:language', () => {
    for (const city of cities) city.name = city.item.textContent.trim();
  });
  if (reduced.matches) section.classList.add('is-still');
  resize();
}
