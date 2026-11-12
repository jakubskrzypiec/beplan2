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
  const focus = [18, 25];
  const hub = cities[0].coordinates;
  const routes = {
    type: 'MultiLineString',
    coordinates: cities.slice(1, 8).map((city) => [hub, city.coordinates]),
  };
  const projection = geoOrthographic().precision(0.8);
  const path = geoPath(projection, context);
  let width = 0;
  let height = 0;
  let radius;
  let center;
  let globeShade;
  let rimLight;
  let labels = [];
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
    const longitude = focus[0] + 19 * Math.sin(elapsed / 11000);
    const latitude = focus[1];
    projection.rotate([-longitude, -latitude]);

    context.clearRect(0, 0, width, height);
    context.lineWidth = 1;
    context.beginPath();
    context.arc(...center, radius, 0, Math.PI * 2);
    context.fillStyle = globeShade;
    context.fill();
    context.strokeStyle = rimLight;
    context.shadowColor = '#e8e8e8';
    context.shadowBlur = 16;
    context.stroke();
    context.shadowBlur = 0;

    context.lineWidth = 0.75;
    context.setLineDash([1, 5]);
    stroke(grid, '#94949440');
    context.setLineDash([]);
    fill(land, '#a4a4a413');
    fill(highlighted, '#bababa35');
    stroke(land, '#b1b1b168');
    stroke(borders, '#b1b1b169');
    context.lineWidth = 1.1;
    stroke(routes, '#dddddd30');
    context.setLineDash([3, 11]);
    context.lineDashOffset = -elapsed / 110;
    stroke(routes, '#f0f0f09c');
    context.setLineDash([]);
    context.lineDashOffset = 0;
    drawCities(context, projection, cities, labels, [longitude, latitude], elapsed);
  }

  function resize() {
    ({ width, height } = stage.getBoundingClientRect());
    if (!width || !height) return;
    const scale = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    radius = Math.min(width * 0.57, height * 0.55);
    center = [width * 0.55, height * 0.53];
    projection.scale(radius).translate(center);
    globeShade = context.createRadialGradient(center[0] - radius * 0.26, center[1] - radius * 0.43, 0, ...center, radius);
    globeShade.addColorStop(0, '#363636');
    globeShade.addColorStop(0.65, '#202020');
    globeShade.addColorStop(1, '#101010');
    rimLight = context.createLinearGradient(center[0] - radius, 0, center[0] + radius, height);
    rimLight.addColorStop(0, '#f0f0f033');
    rimLight.addColorStop(0.34, '#f0f0f0b3');
    rimLight.addColorStop(0.72, '#f0f0f021');
    rimLight.addColorStop(1, '#f0f0f008');
    projection.rotate([-focus[0], -focus[1]]);
    labels = layoutLabels(cities, projection, width, height);
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

function layoutLabels(cities, projection, width, height) {
  const narrow = width < 510;
  const gap = narrow ? 18 : 25;
  const margin = narrow ? 12 : 20;
  // Set the label positions once per resize. The leader lines follow the
  // projected points as the globe turns.
  const selected = narrow ? cities.slice(0, 9) : cities;
  return [-1, 1].flatMap((side) => {
    const column = selected.filter((city) => (city.coordinates[0] < 17 ? -1 : 1) === side)
      .map((city) => ({ city, y: projection(city.coordinates)[1] }))
      .sort((a, b) => a.y - b.y);
    let nextRow = margin;
    return column.map(({ city, y }, index) => {
      const lastAvailableRow = height - margin - (column.length - 1 - index) * gap;
      const row = Math.min(lastAvailableRow, Math.max(nextRow, y));
      nextRow = row + gap;
      return { city, x: side === -1 ? margin : width - margin, y: row, side, fontSize: narrow ? 11 : 13 };
    });
  });
}

function drawCities(context, projection, cities, labels, globeCenter, elapsed) {
  const visibility = (city) => Math.max(0, Math.min(1, Math.cos(geoDistance(city.coordinates, globeCenter)) * 5));
  context.textBaseline = 'middle';

  for (const { city, x, y, side, fontSize } of labels) {
    const opacity = visibility(city);
    if (opacity === 0) continue;
    const [pointX, pointY] = projection(city.coordinates);
    context.font = `500 ${fontSize}px "Rethink Sans", Arial, sans-serif`;
    context.textAlign = side === -1 ? 'left' : 'right';
    const textWidth = context.measureText(city.name).width;
    const lineStart = x - side * (textWidth + 7);
    context.globalAlpha = opacity;
    context.beginPath();
    context.moveTo(lineStart, y);
    context.lineTo(lineStart - side * 18, y);
    context.lineTo(pointX, pointY);
    context.strokeStyle = '#d5d5d55c';
    context.stroke();
    context.fillStyle = '#f0f0f0';
    context.fillText(city.name, x, y);
  }

  for (const [index, city] of cities.entries()) {
    const opacity = visibility(city);
    if (opacity === 0) continue;
    const [x, y] = projection(city.coordinates);
    context.globalAlpha = opacity;
    context.beginPath();
    context.arc(x, y, index === 0 ? 4 : 2.4, 0, Math.PI * 2);
    context.shadowBlur = 10;
    context.shadowColor = '#fff';
    context.fillStyle = '#f4f4f4';
    context.fill();
    context.shadowBlur = 0;
    if (index === 0) {
      const pulse = (elapsed % 2300) / 2300;
      context.globalAlpha = opacity * (1 - pulse) * 0.58;
      context.beginPath();
      context.arc(x, y, 7 + 18 * pulse, 0, Math.PI * 2);
      context.strokeStyle = '#fff';
      context.stroke();
    }
  }
  context.globalAlpha = 1;
}
