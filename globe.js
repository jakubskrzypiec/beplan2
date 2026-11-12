import { feature, geoDistance, geoOrthographic, geoPath, mesh, world } from './assets/globe-geometry.js';

const cityLabels = new Map([
  ['Warsaw', [9, -8]],
  ['Dubai', [-9, -8]],
  ['Paris', [-9, -7]],
  ['Barcelona', [8, -8]],
  ['Lisbon', [8, -9]],
  ['Madrid', [-7, 16]],
  ['Ljubljana', [8, 10]],
]);

const canvas = document.querySelector('#project-globe');
const context = canvas.getContext('2d');
if (context) drawProjectGlobe(context);

function drawProjectGlobe(context) {
  const stage = canvas.parentElement;
  const toggle = document.querySelector('.globe-toggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cities = Array.from(document.querySelectorAll('[data-coordinates]'), (link) => ({
    name: link.textContent.trim(),
    coordinates: link.dataset.coordinates.split(',').map(Number),
  }));
  const countries = world.objects.countries;
  const projectCountries = new Set(['616', '724', '250', '620', '705', '784', '710']);
  const highlighted = {
    type: 'FeatureCollection',
    features: feature(world, countries).features.filter((country) => projectCountries.has(String(country.id))),
  };
  const land = feature(world, world.objects.land);
  const borders = mesh(world, countries, (a, b) => a !== b);
  const focus = [22, 45];
  const projection = geoOrthographic().precision(0.8);
  const path = geoPath(projection, context);
  let width = 0;
  let height = 0;
  let radius;
  let center;
  let globeShade;
  let depthShade;
  let edgeFade;
  let lit = false;
  let running = !reducedMotion.matches;
  let request = null;
  let lastDraw = null;
  let elapsed = 0;

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
    const longitude = focus[0] + 4 * Math.sin(elapsed / 13000);
    const latitude = focus[1];
    projection.rotate([-longitude, -latitude]);

    context.clearRect(0, 0, width, height);
    context.beginPath();
    context.arc(...center, radius, 0, Math.PI * 2);
    context.fillStyle = globeShade;
    context.fill();
    context.lineWidth = 0.75;
    fill(land, '#77777764');
    fill(highlighted, '#b0b0b04a');
    stroke(land, '#cccccc58');
    stroke(borders, '#b8b8b833');
    context.globalCompositeOperation = 'source-atop';
    context.fillStyle = depthShade;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'destination-in';
    context.fillStyle = edgeFade;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';
    drawCities(context, projection, cities, [longitude, latitude], width, height);
  }

  function resize() {
    ({ width, height } = stage.getBoundingClientRect());
    if (!width || !height) return;
    const scale = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    radius = Math.min(width * 0.91, height * 1.04);
    center = [width * 0.445, height * 0.47];
    projection.scale(radius).translate(center);
    globeShade = context.createRadialGradient(center[0] - radius * 0.17, center[1] - radius * 0.2, 0, ...center, radius);
    globeShade.addColorStop(0, '#303030');
    globeShade.addColorStop(0.52, '#1b1b1b');
    globeShade.addColorStop(1, '#0b0b0b');
    depthShade = context.createRadialGradient(center[0], center[1] - radius * 0.10, radius * 0.12,
      center[0], center[1] - radius * 0.10, radius * 0.86);
    depthShade.addColorStop(0, '#0000');
    depthShade.addColorStop(0.55, '#08080819');
    depthShade.addColorStop(1, '#080808a0');
    edgeFade = context.createLinearGradient(0, 0, width, 0);
    edgeFade.addColorStop(0, '#0000');
    edgeFade.addColorStop(0.18, '#000');
    edgeFade.addColorStop(1, '#000');
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
    if (lastDraw === null || now - lastDraw >= 32) {
      if (lastDraw !== null) elapsed += Math.min(now - lastDraw, 64);
      lastDraw = now;
      draw();
    }
    request = requestAnimationFrame(tick);
  }

  function updateMotion() {
    toggle.textContent = running ? 'Pause globe' : 'Play globe';
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
  updateMotion();
}

function drawCities(context, projection, cities, globeCenter, width, height) {
  const narrow = width < 500;
  const visibleLabels = [];
  context.font = `600 ${narrow ? 11 : 14}px "Rethink Sans", Arial, sans-serif`;
  context.textBaseline = 'middle';

  for (const city of cities) {
    const [x, y] = projection(city.coordinates);
    const edge = Math.min(x, width - x, y, height - y) / 16;
    const opacity = Math.max(0, Math.min(1, edge, Math.cos(geoDistance(city.coordinates, globeCenter)) * 5));
    if (opacity === 0) continue;
    const label = cityLabels.get(city.name);
    const showLabel = label && !(narrow && city.name === 'Madrid');
    context.globalAlpha = opacity;
    context.beginPath();
    context.arc(x, y, showLabel ? 3.2 : 1.8, 0, Math.PI * 2);
    context.shadowBlur = showLabel ? 9 : 0;
    context.shadowColor = '#eeeeee';
    context.fillStyle = showLabel ? '#ffffff' : '#ababab';
    context.fill();
    context.shadowBlur = 0;
    if (showLabel) visibleLabels.push({ city, x, y, label, opacity });
  }

  for (const { city, x, y, label: [dx, dy], opacity } of visibleLabels) {
    const textWidth = context.measureText(city.name).width;
    const left = dx < 0 ? x + dx - textWidth : x + dx;
    const labelX = Math.max(6, Math.min(width - textWidth - 6, left));
    context.globalAlpha = opacity;
    context.strokeStyle = '#111111';
    context.lineWidth = 3;
    context.strokeText(city.name, labelX, y + dy);
    context.fillStyle = '#f6f6f6';
    context.fillText(city.name, labelX, y + dy);
  }
  context.globalAlpha = 1;
}
