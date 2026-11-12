const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-nav');
const compactLayout = window.matchMedia('(max-width: 760px)');

function setMenu(open) {
  menu.setAttribute('aria-expanded', String(open));
  navigation.hidden = compactLayout.matches && !open;
}

function updateLayout() {
  menu.hidden = !compactLayout.matches;
  setMenu(false);
}

menu.addEventListener('click', () => {
  setMenu(menu.getAttribute('aria-expanded') === 'false');
});

navigation.addEventListener('click', (event) => {
  if (compactLayout.matches && event.target.closest('a')) setMenu(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menu.focus();
  }
});

compactLayout.addEventListener('change', updateLayout);
updateLayout();

const heroStory = document.querySelector('.hero-story');
const hero = heroStory.querySelector('.hero');
const heroCanvas = heroStory.querySelector('.hero-scroll-frames');
const heroContext = heroCanvas.getContext('2d', { alpha: false });
const heroEndFrame = heroStory.querySelector('.hero-end-frame');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const heroPlaybackEnd = 0.78;
const heroLastFrame = 360;
const framesPerSheet = 6;
const heroSheets = new Map();
const heroFrameSize = compactLayout.matches ? [768, 432] : [1280, 720];
const heroFrameFolder = compactLayout.matches ? 'mobile' : 'desktop';
heroCanvas.width = heroFrameSize[0];
heroCanvas.height = heroFrameSize[1];
let heroFrameRequest = null;
let heroProgress = null;
let heroFrameTime = null;
let lastPaintedFrame = null;
let heroFramesUnavailable = false;

function smoothStep(value) {
  const progress = Math.max(0, Math.min(1, value));
  return progress * progress * (3 - 2 * progress);
}

function clipProgress(progress) {
  // Slow the middle of the shot continuously through the turn.
  const phase = progress * Math.PI * 2;
  return progress + 0.24 * (Math.sin(phase) - 0.5 * Math.sin(phase * 2)) / (Math.PI * 2);
}

function loadHeroSheet(index, urgent, attempt = 0) {
  if (heroSheets.has(index)) return;
  const image = new Image();
  const sheet = { image, ready: false };
  heroSheets.set(index, sheet);
  image.fetchPriority = urgent ? 'high' : 'low';
  const name = String(index).padStart(2, '0');
  image.src = `assets/hero-frames/${heroFrameFolder}/${name}.avif`;
  image.decode().then(() => {
    if (heroSheets.get(index) !== sheet) return;
    sheet.ready = true;
    requestHeroFrame();
  }).catch(() => {
    if (heroSheets.get(index) !== sheet) return;
    if (attempt === 0) {
      window.setTimeout(() => {
        if (heroSheets.get(index) !== sheet) return;
        heroSheets.delete(index);
        loadHeroSheet(index, urgent, 1);
      }, 700);
    } else {
      sheet.failed = true;
      requestHeroFrame();
    }
  });
}

function paintHeroFrame(wantedFrame) {
  // Let a quick scroll advance the shot without jumping across whole scenes.
  const difference = wantedFrame - (lastPaintedFrame ?? wantedFrame);
  const direction = Math.sign(difference) || 1;
  const frame = lastPaintedFrame === null
    ? wantedFrame
    : lastPaintedFrame + direction * Math.min(Math.abs(difference), 2);
  const index = Math.floor(frame / framesPerSheet);
  const neighbors = [index, index + direction, index + direction * 2, index - direction]
    .filter((sheet) => sheet >= 0 && sheet <= Math.floor(heroLastFrame / framesPerSheet));
  for (const [sheet, entry] of heroSheets) {
    if (neighbors.includes(sheet)) continue;
    heroSheets.delete(sheet);
    if (!entry.ready) entry.image.removeAttribute('src');
  }
  for (const sheet of neighbors) loadHeroSheet(sheet, sheet === index);

  const sheet = heroSheets.get(index);
  if (sheet.failed) {
    heroFramesUnavailable = true;
    updateHeroMotion();
    return false;
  }
  if (!sheet.ready || frame === lastPaintedFrame) return false;

  const [width, height] = heroFrameSize;
  const tile = frame % framesPerSheet;
  const x = (tile % 2) * width;
  const y = Math.floor(tile / 2) * height;
  heroContext.drawImage(sheet.image, x, y, width, height, 0, 0, width, height);
  lastPaintedFrame = frame;
  heroCanvas.classList.add('is-ready');
  return frame !== wantedFrame;
}

function updateHeroFrame(timestamp) {
  heroFrameRequest = null;
  if (!heroStory.classList.contains('is-scroll-sequence')) return;

  const travel = heroStory.offsetHeight - hero.offsetHeight;
  if (travel <= 0) return;

  const target = Math.max(0, Math.min(1, -heroStory.getBoundingClientRect().top / travel));
  const elapsed = heroFrameTime === null ? 1000 / 60 : Math.min(timestamp - heroFrameTime, 50);
  heroFrameTime = timestamp;
  if (heroProgress === null || target === 1) {
    heroProgress = target;
  } else {
    const remaining = target - heroProgress;
    const halfFrame = heroPlaybackEnd / (2 * heroLastFrame);
    heroProgress = Math.abs(remaining) < halfFrame
      ? target
      : heroProgress + remaining * (1 - Math.exp(-elapsed / 120));
  }

  const playback = Math.min(1, heroProgress / heroPlaybackEnd);
  // Keep a steady pace, then slow the camera to a stop over the final stretch.
  const brakingLength = 0.32;
  const braking = Math.max(0, (playback - (1 - brakingLength)) / brakingLength);
  const easedPlayback = (playback - brakingLength * braking * braking / 2) / (1 - brakingLength / 2);
  const frame = Math.round(clipProgress(Math.min(1, easedPlayback)) * heroLastFrame);
  const moreFrames = target < 1 && paintHeroFrame(frame);
  if (heroFramesUnavailable) return;

  const intro = 1 - smoothStep((heroProgress - 0.06) / 0.16);
  const finale = smoothStep((heroProgress - 0.70) / 0.14);
  const copyOpacity = Math.max(intro, finale);
  const stillReady = heroEndFrame.complete && heroEndFrame.naturalWidth > 0;
  const showStill = stillReady && (target === 1
    || (playback === 1 && lastPaintedFrame === heroLastFrame)
    || (lastPaintedFrame === null && hero.classList.contains('is-showing-end-frame')));
  if (target === 1) lastPaintedFrame = null;
  hero.classList.toggle('is-showing-end-frame', showStill);
  hero.classList.toggle('is-hero-copy-hidden', copyOpacity === 0);
  hero.style.setProperty('--hero-copy', String(copyOpacity));
  hero.style.setProperty('--hero-fade', String(smoothStep((heroProgress - 0.87) / 0.13)));

  if (heroProgress === target) heroFrameTime = null;
  if (heroProgress !== target || moreFrames) requestHeroFrame();
}

function requestHeroFrame() {
  if (heroFrameRequest === null && heroStory.classList.contains('is-scroll-sequence')) {
    heroFrameRequest = window.requestAnimationFrame(updateHeroFrame);
  }
}

function updateHeroMotion() {
  const enabled = !reducedMotion.matches && !navigator.connection?.saveData
    && !heroFramesUnavailable && Boolean(heroContext) && typeof Image.prototype.decode === 'function';
  heroStory.classList.toggle('is-scroll-sequence', enabled);
  if (!enabled) {
    heroProgress = null;
    heroFrameTime = null;
    lastPaintedFrame = null;
    heroSheets.clear();
    heroCanvas.classList.remove('is-ready');
    hero.classList.remove('is-showing-end-frame', 'is-hero-copy-hidden');
    hero.style.removeProperty('--hero-copy');
    hero.style.removeProperty('--hero-fade');
    return;
  }

  requestHeroFrame();
}

heroEndFrame.addEventListener('load', requestHeroFrame);
window.addEventListener('scroll', requestHeroFrame, { passive: true });
window.addEventListener('resize', requestHeroFrame);
reducedMotion.addEventListener('change', updateHeroMotion);
updateHeroMotion();

// The sticky hero adds scroll distance after the browser reads the initial URL.
const initialTarget = document.getElementById(window.location.hash.slice(1));
if (initialTarget && heroStory.classList.contains('is-scroll-sequence')) {
  requestAnimationFrame(() => initialTarget.scrollIntoView({ behavior: 'instant' }));
}

const enquiry = document.querySelector('.enquiry');
enquiry.addEventListener('submit', (event) => {
  event.preventDefault();
  const fields = new FormData(enquiry);
  const details = [
    ['Name', 'name'],
    ['Email', 'email'],
    ['Phone', 'phone'],
    ['Project type', 'projectType'],
    ['Project location', 'location'],
    ['Floor area', 'area'],
    ['Planned start', 'start'],
    ['Contact consent', 'contactConsent'],
  ].flatMap(([label, name]) => {
    const value = fields.get(name)?.trim();
    return value ? [label + ': ' + value] : [];
  });
  const body = [
    fields.get('message').trim(),
    '',
    ...details,
  ].join('\r\n');
  const subject = encodeURIComponent('BEPLAN project enquiry');
  window.location.href = enquiry.getAttribute('action') + '?subject=' + subject + '&body=' + encodeURIComponent(body);
});

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const reveal = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (reducedMotion.matches || entry.target.matches(':focus-within')) continue;
      entry.target.animate(
        [{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' },
      );
    }
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-reveal]').forEach((element) => reveal.observe(element));
}
