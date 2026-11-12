import { feature, geoDistance, geoGraticule10, geoOrthographic, geoPath, mesh, world } from './assets/globe-geometry.js';

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
  const grid = geoGraticule10();
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
    const latitude = -12;
    projection.rotate([-longitude, -latitude]);

    context.clearRect(0, 0, width, height);
    context.lineWidth = 1;
    context.beginPath();
    context.arc(...center, radius, 0, Math.PI * 2);
    context.fillStyle = globeShade;
    context.fill();
    context.strokeStyle = '#a2917545';
    context.stroke();

    context.lineWidth = 0.75;
    context.setLineDash([1, 5]);
    stroke(grid, '#a4937440');
    context.setLineDash([]);
    fill(land, '#b7a28613');
    fill(highlighted, '#e7b56d35');
    stroke(land, '#c5af8a68');
    stroke(borders, '#c5af8a69');
    drawCities(context, projection, cities, [longitude, latitude], width, height);
  }

  function resize() {
    ({ width, height } = stage.getBoundingClientRect());
    if (!width || !height) return;
    const scale = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    radius = Math.min(width * 0.60, height * 0.74);
    center = [width * 0.60, radius + height * 0.035];
    projection.scale(radius).translate(center);
    globeShade = context.createRadialGradient(center[0] - radius * 0.19, center[1] - radius * 0.4, 0, ...center, radius);
    globeShade.addColorStop(0, '#30281d');
    globeShade.addColorStop(1, '#10100e');
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
  const fontSize = width < 540 ? 11 : 13;
  context.font = `500 ${fontSize}px "Rethink Sans", Arial, sans-serif`;
  context.textBaseline = 'middle';
  const labels = [];

  for (const [index, city] of cities.entries()) {
    if (geoDistance(city.coordinates, globeCenter) > Math.PI * 0.475) continue;
    const [x, y] = projection(city.coordinates);
    if (x < 10 || x > width - 10 || y < 10 || y > height - 10) continue;

    context.beginPath();
    context.arc(x, y, index < 3 ? 3.2 : 2.2, 0, Math.PI * 2);
    context.shadowBlur = 12;
    context.shadowColor = '#eab67b';
    context.fillStyle = '#f4c987';
    context.fill();
    context.shadowBlur = 0;

    const textWidth = context.measureText(city.name).width;
    const side = index % 2 === 0 ? 1 : -1;
    const offsets = [0, -21, 21, -42, 42, -63, 63];
    for (const offset of offsets) {
      const lineEnd = x + side * (width < 540 ? 26 : 42);
      const left = side === 1 ? lineEnd + 6 : lineEnd - 6 - textWidth;
      const top = y + offset - fontSize / 2;
      const box = { left, right: left + textWidth, top, bottom: top + fontSize };
      if (box.left < 8 || box.right > width - 8 || box.top < 8 || box.bottom > height - 8) continue;
      if (labels.some((label) => box.left < label.right + 10 && box.right > label.left - 10
        && box.top < label.bottom + 5 && box.bottom > label.top - 5)) continue;

      labels.push(box);
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + side * 12, y + offset);
      context.lineTo(lineEnd, y + offset);
      context.strokeStyle = '#e1b77e76';
      context.stroke();
      context.fillStyle = '#f2e3ca';
      context.fillText(city.name, left, y + offset);
      break;
    }
  }
}
