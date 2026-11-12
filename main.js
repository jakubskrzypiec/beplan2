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
const heroEndFrame = heroStory.querySelector('.hero-end-frame');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const heroFrameRate = 24;
const heroPlaybackEnd = 0.78;
let heroFrameRequest = null;
let heroProgress = null;
let heroFrameTime = null;

function smoothStep(value) {
  const progress = Math.max(0, Math.min(1, value));
  return progress * progress * (3 - 2 * progress);
}

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

  const playback = Math.min(1, heroProgress / heroPlaybackEnd);
  // Keep a steady pace, then slow the camera to a stop over the final stretch.
  const brakingLength = 0.32;
  const braking = Math.max(0, (playback - (1 - brakingLength)) / brakingLength);
  const easedPlayback = (playback - brakingLength * braking * braking / 2) / (1 - brakingLength / 2);
  const time = Math.round(easedPlayback * lastFrame) / heroFrameRate;

  if (!heroVideo.seeking && Math.abs(heroVideo.currentTime - time) >= 0.5 / heroFrameRate) {
    heroVideo.currentTime = time;
  }

  const intro = 1 - smoothStep((heroProgress - 0.06) / 0.16);
  const finale = smoothStep((heroProgress - 0.70) / 0.14);
  const copyOpacity = Math.max(intro, finale);
  const showStill = playback === 1 && !heroVideo.seeking && heroEndFrame.complete && heroEndFrame.naturalWidth > 0;
  hero.classList.toggle('is-showing-end-frame', showStill);
  hero.classList.toggle('is-hero-copy-hidden', copyOpacity === 0);
  hero.style.setProperty('--hero-copy', String(copyOpacity));
  hero.style.setProperty('--hero-fade', String(smoothStep((heroProgress - 0.87) / 0.13)));

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
    hero.classList.remove('is-showing-end-frame', 'is-hero-copy-hidden');
    hero.style.removeProperty('--hero-copy');
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
heroEndFrame.addEventListener('load', requestHeroFrame);
heroVideo.addEventListener('error', updateHeroMotion);
window.addEventListener('scroll', requestHeroFrame, { passive: true });
window.addEventListener('resize', requestHeroFrame);
reducedMotion.addEventListener('change', updateHeroMotion);
updateHeroMotion();

// The sticky hero adds scroll distance after the browser reads the initial URL.
const initialTarget = document.getElementById(window.location.hash.slice(1));
if (initialTarget && heroStory.classList.contains('is-scroll-video')) {
  requestAnimationFrame(() => initialTarget.scrollIntoView({ behavior: 'instant' }));
}

const enquiry = document.querySelector('.enquiry');
enquiry.addEventListener('submit', (event) => {
  event.preventDefault();
  const fields = new FormData(enquiry);
  const body = [
    fields.get('message').trim(),
    '',
    'Name: ' + fields.get('name').trim(),
    'Email: ' + fields.get('email').trim(),
    'Company: ' + fields.get('company').trim(),
    'Project location: ' + fields.get('location').trim(),
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
