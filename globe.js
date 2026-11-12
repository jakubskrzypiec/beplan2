import { feature, geoDistance, geoOrthographic, geoPath, mesh, world } from './assets/globe-geometry.js';

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
  const focus = [14, 47];
  const projection = geoOrthographic().precision(0.8);
  const path = geoPath(projection, context);
  let width = 0;
  let height = 0;
  let radius;
  let center;
  let globeShade;
  let depthShade;
  let edgeFade;
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
    const longitude = focus[0] + 9 * Math.sin(elapsed / 13000);
    const latitude = focus[1];
    projection.rotate([-longitude, -latitude]);

    context.clearRect(0, 0, width, height);
    context.beginPath();
    context.arc(...center, radius, 0, Math.PI * 2);
    context.fillStyle = globeShade;
    context.fill();
    context.lineWidth = 0.75;
    fill(land, '#4e766678');
    fill(highlighted, '#85a88962');
    stroke(land, '#8bb69b65');
    stroke(borders, '#8bb69b32');
    context.globalCompositeOperation = 'source-atop';
    context.fillStyle = depthShade;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'destination-in';
    context.fillStyle = edgeFade;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';
    drawCities(context, projection, cities, labels, [longitude, latitude], width, height);
  }

  function resize() {
    ({ width, height } = stage.getBoundingClientRect());
    if (!width || !height) return;
    const scale = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    radius = Math.min(width * 1.04, height * 1.12);
    center = [width * 0.52, height * 0.47];
    projection.scale(radius).translate(center);
    globeShade = context.createRadialGradient(center[0] - radius * 0.17, center[1] - radius * 0.2, 0, ...center, radius);
    globeShade.addColorStop(0, '#20404b');
    globeShade.addColorStop(0.52, '#10232e');
    globeShade.addColorStop(1, '#080f15');
    depthShade = context.createRadialGradient(center[0], center[1] - radius * 0.10, radius * 0.12,
      center[0], center[1] - radius * 0.10, radius * 0.86);
    depthShade.addColorStop(0, '#0000');
    depthShade.addColorStop(0.55, '#03090f19');
    depthShade.addColorStop(1, '#03090fa0');
    edgeFade = context.createLinearGradient(0, 0, width, 0);
    edgeFade.addColorStop(0, '#0000');
    edgeFade.addColorStop(0.18, '#000');
    edgeFade.addColorStop(1, '#000');
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
  const gap = narrow ? 24 : 32;
  const margin = narrow ? 13 : 21;
  // Set the label positions once per resize. The leader lines follow the
  // projected points as the globe turns.
  const featured = new Set(narrow
    ? ['Warsaw', 'Paris', 'Barcelona', 'Lisbon', 'Kraków', 'Gdańsk', 'Madrid', 'Ljubljana']
    : ['Warsaw', 'Paris', 'Barcelona', 'Lisbon', 'Kraków', 'Gdańsk', 'Madrid', 'Ljubljana',
      'Valencia', 'Málaga', 'Wrocław', 'Poznań', 'Łódź', 'Szczecin']);
  const selected = cities.filter((city) => featured.has(city.name));
  return [-1, 1].flatMap((side) => {
    const column = selected.filter((city) => (city.coordinates[0] < 12 ? -1 : 1) === side)
      .map((city) => ({ city, y: projection(city.coordinates)[1] }))
      .sort((a, b) => a.y - b.y);
    let nextRow = margin;
    return column.map(({ city, y }, index) => {
      const lastAvailableRow = height - margin - (column.length - 1 - index) * gap;
      const row = Math.min(lastAvailableRow, Math.max(nextRow, y));
      nextRow = row + gap;
      const inset = margin + (index % 3) * (narrow ? 7 : 23);
      return { city, x: side === -1 ? inset : width - inset, y: row, side, fontSize: narrow ? 11 : 13 };
    });
  });
}

function drawCities(context, projection, cities, labels, globeCenter, width, height) {
  const visibility = (city, x, y) => {
    const edge = Math.min(x, width - x, y, height - y) / 28;
    return Math.max(0, Math.min(1, edge, Math.cos(geoDistance(city.coordinates, globeCenter)) * 5));
  };
  context.textBaseline = 'middle';

  for (const { city, x, y, side, fontSize } of labels) {
    const [pointX, pointY] = projection(city.coordinates);
    const opacity = visibility(city, pointX, pointY);
    if (opacity === 0) continue;
    context.font = `500 ${fontSize}px "Rethink Sans", Arial, sans-serif`;
    context.textAlign = side === -1 ? 'left' : 'right';
    const textWidth = context.measureText(city.name).width;
    const lineStart = x - side * (textWidth + 7);
    context.globalAlpha = opacity;
    context.beginPath();
    context.moveTo(lineStart, y);
    context.quadraticCurveTo(lineStart - side * 45, y, pointX, pointY);
    const leader = context.createLinearGradient(lineStart, y, pointX, pointY);
    leader.addColorStop(0, '#e8bd7920');
    leader.addColorStop(1, '#e8bd7975');
    context.strokeStyle = leader;
    context.stroke();
    context.fillStyle = '#e9d5b1';
    context.fillText(city.name, x, y);
  }

  for (const [index, city] of cities.entries()) {
    const [x, y] = projection(city.coordinates);
    const opacity = visibility(city, x, y);
    if (opacity === 0) continue;
    context.globalAlpha = opacity;
    context.beginPath();
    context.arc(x, y, index === 0 ? 4 : 2, 0, Math.PI * 2);
    context.shadowBlur = 10;
    context.shadowColor = '#e9ac61';
    context.fillStyle = '#f3cd8c';
    context.fill();
    context.shadowBlur = 0;
  }
  context.globalAlpha = 1;
}
