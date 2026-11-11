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
const heroVideo = heroStory.querySelector('video');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const heroFrameRate = 24;
const heroPlaybackEnd = 0.86;
let heroFrameRequest = null;
let heroProgress = null;
let heroFrameTime = null;

function updateHeroFrame(timestamp) {
  heroFrameRequest = null;
  if (!heroStory.classList.contains('is-scroll-video') || !Number.isFinite(heroVideo.duration)) return;

  const travel = heroStory.offsetHeight - hero.offsetHeight;
  if (travel <= 0) return;

  const target = Math.max(0, Math.min(1, -heroStory.getBoundingClientRect().top / travel));
  const elapsed = heroFrameTime === null ? 1000 / 60 : timestamp - heroFrameTime;
  heroFrameTime = timestamp;
  const lastFrame = Math.max(1, Math.round(heroVideo.duration * heroFrameRate) - 1);

  if (heroProgress === null || target === 1) {
    heroProgress = target;
  } else {
    const remaining = target - heroProgress;
    const halfFrame = heroPlaybackEnd / (2 * lastFrame);
    heroProgress = Math.abs(remaining) < halfFrame
      ? target
      : heroProgress + remaining * (1 - Math.exp(-elapsed / 75));
  }

  // Finish the shot before the sticky section releases so its last frame can
  // carry the transition into the projects section.
  const playback = Math.min(1, heroProgress / heroPlaybackEnd);
  const time = Math.round(playback * lastFrame) / heroFrameRate;
  const fade = Math.max(0, (heroProgress - 0.76) / 0.24);
  hero.style.setProperty('--hero-fade', String(fade * fade * (3 - 2 * fade)));

  if (!heroVideo.seeking && Math.abs(heroVideo.currentTime - time) >= 0.5 / heroFrameRate) {
    heroVideo.currentTime = time;
  }

  if (heroProgress === target) heroFrameTime = null;
  else requestHeroFrame();
}

function requestHeroFrame() {
  if (heroFrameRequest === null && heroStory.classList.contains('is-scroll-video')) {
    heroFrameRequest = window.requestAnimationFrame(updateHeroFrame);
  }
}

function updateHeroMotion() {
  const enabled = !reducedMotion.matches && !navigator.connection?.saveData
    && !heroVideo.error && Boolean(heroVideo.canPlayType('video/mp4'));
  heroStory.classList.toggle('is-scroll-video', enabled);
  if (!enabled) {
    heroProgress = null;
    heroFrameTime = null;
    hero.style.removeProperty('--hero-fade');
    return;
  }

  if (!heroVideo.hasAttribute('src')) {
    heroVideo.src = compactLayout.matches ? 'assets/hero-scroll-mobile.mp4' : 'assets/hero-scroll.mp4';
  }
  requestHeroFrame();
}

heroVideo.addEventListener('loadeddata', () => {
  heroVideo.classList.add('is-ready');
  requestHeroFrame();
});
heroVideo.addEventListener('loadedmetadata', requestHeroFrame);
heroVideo.addEventListener('seeked', requestHeroFrame);
heroVideo.addEventListener('error', updateHeroMotion);
window.addEventListener('scroll', requestHeroFrame, { passive: true });
window.addEventListener('resize', requestHeroFrame);
reducedMotion.addEventListener('change', updateHeroMotion);
updateHeroMotion();
