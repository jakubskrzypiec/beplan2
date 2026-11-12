import { feature, geoDistance, geoOrthographic, geoPath, mesh, world } from './assets/globe-geometry.js';

const canvas = document.querySelector('#project-globe');
const context = canvas.getContext('2d');
if (context) drawProjectGlobe(context);

function drawProjectGlobe(context) {
  const stage = canvas.parentElement;
  const toggle = document.querySelector('.globe-toggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cities = Array.from(document.querySelectorAll('[data-coordinates]'), (link, index) => ({
    link,
    name: link.textContent.trim(),
    coordinates: link.dataset.coordinates.split(',').map(Number),
    side: index % 2 === 0 ? 1 : -1,
    dot: 0,
    label: 0,
    offset: null,
    shift: 0,
  }));
  const countries = world.objects.countries;
  const projectCountries = new Set(['616', '724', '250', '620', '705', '784', '710']);
  const highlighted = {
    type: 'FeatureCollection',
    features: feature(world, countries).features.filter((country) => projectCountries.has(String(country.id))),
  };
  const land = feature(world, world.objects.land);
  const borders = mesh(world, countries, (a, b) => a !== b);
  const projection = geoOrthographic().precision(0.8);
  const path = geoPath(projection, context);
  let width = 0;
  let height = 0;
  let radius;
  let center;
  let globeShade;
  let lit = false;
  let running = !reducedMotion.matches;
  let request = null;
  let lastDraw = null;
  let elapsed = 0;
  let step = 0;

  function stroke(shape, color) {
    context.beginPath();
    path(shape);
    context.strokeStyle = color;
    context.stroke();
  }

  function fill(shape, color) {
    context.beginPath();
    path(shape);
    context.fillStyle = color;
    context.fill();
  }

  function draw() {
    if (!width || !height) return;
    const longitude = 19 + 29 * Math.sin(elapsed / 10500);
    const latitude = 16;
    projection.rotate([-longitude, -latitude]);

    context.clearRect(0, 0, width, height);
    context.lineWidth = 1;
    context.beginPath();
    context.arc(...center, radius, 0, Math.PI * 2);
    context.fillStyle = globeShade;
    context.fill();
    context.strokeStyle = '#93939345';
    context.stroke();

    context.lineWidth = 0.75;
    fill(land, '#a4a4a413');
    fill(highlighted, '#bababa35');
    stroke(land, '#b1b1b168');
    stroke(borders, '#b1b1b169');
    drawCities(context, projection, cities, [longitude, latitude], width, height, step);
    step = 0;
  }

  function resize() {
    ({ width, height } = stage.getBoundingClientRect());
    if (!width || !height) return;
    const scale = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    radius = Math.min(width * 0.60, height * 0.70);
    center = [width * (width < 540 ? 0.52 : 0.60), radius + height * 0.035];
    projection.scale(radius).translate(center);
    globeShade = context.createRadialGradient(center[0] - radius * 0.19, center[1] - radius * 0.4, 0, ...center, radius);
    globeShade.addColorStop(0, '#292929');
    globeShade.addColorStop(1, '#101010');
    draw();
    stage.classList.add('is-drawn');
    toggle.hidden = false;
  }

  function tick(now) {
    if (!lit || !running) {
      request = null;
      lastDraw = null;
      return;
    }
    if (lastDraw !== null) {
      step = Math.min(now - lastDraw, 64);
      elapsed += step;
    }
    lastDraw = now;
    draw();
    request = requestAnimationFrame(tick);
  }

  function updateMotion() {
    toggle.classList.toggle('is-paused', !running);
    if (lit && running && request === null) request = requestAnimationFrame(tick);
  }

  toggle.addEventListener('click', () => {
    running = !running;
    updateMotion();
  });
  reducedMotion.addEventListener('change', () => {
    running = !reducedMotion.matches;
    updateMotion();
  });
  new IntersectionObserver(([entry]) => {
    lit = entry.isIntersecting;
    updateMotion();
  }).observe(stage);
  new ResizeObserver(resize).observe(stage);
  document.addEventListener('beplan:language', () => {
    for (const city of cities) city.name = city.link.textContent.trim();
    draw();
  });
  document.fonts?.ready.then(draw);
  updateMotion();
}

const labelOffsets = [0, -21, 21, -42, 42, -63, 63];

function overlaps(box, labels, padX, padY) {
  return labels.some((label) => box.left < label.right + padX && box.right > label.left - padX
    && box.top < label.bottom + padY && box.bottom > label.top - padY);
}

// Each city keeps its side and label slot between frames. A label only moves when it would collide,
// and then it glides to the new slot; cities entering or leaving the visible side fade.
function drawCities(context, projection, cities, globeCenter, width, height, step) {
  const compact = width < 540;
  const fontSize = compact ? 11 : 13;
  const reach = compact ? 26 : 42;
  const ease = step ? 1 - Math.exp(-step / 220) : 1;
  const fade = step ? step / 320 : 1;
  context.font = `500 ${fontSize}px "Rethink Sans", Arial, sans-serif`;
  context.textBaseline = 'middle';
  const labels = [];

  for (const [index, city] of cities.entries()) {
    const distance = geoDistance(city.coordinates, globeCenter);
    const [x, y] = projection(city.coordinates);
    // A city already on screen stays until it is well past the edge, so it does not flicker there.
    const edge = city.dot > 0 ? 2 : 10;
    const visible = distance < Math.PI * (city.dot > 0 ? 0.49 : 0.47)
      && x > edge && x < width - edge && y > edge && y < height - edge;
    city.dot = Math.max(0, Math.min(1, city.dot + (visible ? fade : -fade)));
    if (!city.dot) {
      city.label = 0;
      city.offset = null;
      continue;
    }

    context.globalAlpha = city.dot;
    context.beginPath();
    context.arc(x, y, index < 3 ? 3.2 : 2.2, 0, Math.PI * 2);
    context.shadowBlur = 12;
    context.shadowColor = '#bdbdbd';
    context.fillStyle = '#cdcdcd';
    context.fill();
    context.shadowBlur = 0;

    if (index >= (compact ? 8 : 11)) continue;
    const textWidth = context.measureText(city.name).width;
    const lineEnd = x + city.side * reach;
    const left = city.side === 1 ? lineEnd + 6 : lineEnd - 6 - textWidth;
    const boxAt = (offset) => {
      const top = y + offset - fontSize / 2;
      return { left, right: left + textWidth, top, bottom: top + fontSize };
    };
    const fits = (box, keeping) => box.left >= 8 && box.right <= width - 8 && box.top >= 8 && box.bottom <= height - 8
      && !overlaps(box, labels, keeping ? 4 : 10, keeping ? 1 : 5);

    let offset = null;
    if (visible) {
      if (city.offset !== null && fits(boxAt(city.offset), true)) offset = city.offset;
      else offset = labelOffsets.find((candidate) => fits(boxAt(candidate), false)) ?? null;
    }
    if (offset !== null) {
      labels.push(boxAt(offset));
      if (city.offset === null || !city.label) city.shift = offset;
      city.offset = offset;
    }
    city.label = Math.max(0, Math.min(1, city.label + (offset !== null ? fade : -fade)));
    if (!city.label) {
      city.offset = null;
      continue;
    }
    if (city.offset !== null) city.shift += (city.offset - city.shift) * ease;

    const labelY = y + city.shift;
    context.globalAlpha = Math.min(city.dot, city.label);
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + city.side * 12, labelY);
    context.lineTo(lineEnd, labelY);
    context.strokeStyle = '#bcbcbc76';
    context.stroke();
    context.fillStyle = '#e4e4e4';
    context.fillText(city.name, left, labelY);
  }
  context.globalAlpha = 1;
}
