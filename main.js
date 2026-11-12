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
const heroVideo = heroStory.querySelector('.hero-video');
const heroPlayback = heroStory.querySelector('.hero-playback');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let heroInView = false;
let pausedByUser = false;

function updatePlaybackButton() {
  heroPlayback.textContent = heroVideo.ended ? 'Replay film' : heroVideo.paused ? 'Play film' : 'Pause film';
}

function updateHeroPlayback() {
  if (reducedMotion.matches || navigator.connection?.saveData) {
    heroPlayback.hidden = true;
    heroVideo.pause();
    heroVideo.classList.remove('is-ready');
    return;
  }

  if (!heroInView || document.hidden || pausedByUser || heroVideo.ended) {
    heroVideo.pause();
    return;
  }

  if (!heroVideo.hasAttribute('src')) {
    const connection = navigator.connection?.effectiveType;
    const lightweight = compactLayout.matches || connection === '3g' || connection === '2g';
    heroVideo.src = lightweight ? 'assets/hero-playback-mobile.mp4' : 'assets/hero-playback.mp4';
  }
  heroVideo.play().catch(() => {
    if (!heroVideo.error && !reducedMotion.matches && heroInView) {
      heroPlayback.hidden = false;
      updatePlaybackButton();
    }
  });
}

heroVideo.addEventListener('playing', () => {
  heroVideo.classList.add('is-ready');
  heroPlayback.hidden = false;
  updatePlaybackButton();
});
heroVideo.addEventListener('pause', updatePlaybackButton);
heroVideo.addEventListener('ended', updatePlaybackButton);
heroVideo.addEventListener('error', () => {
  heroVideo.classList.remove('is-ready');
  heroPlayback.hidden = true;
});
heroPlayback.addEventListener('click', () => {
  if (heroVideo.ended) heroVideo.currentTime = 0;
  pausedByUser = !heroVideo.paused;
  updateHeroPlayback();
});
document.addEventListener('visibilitychange', updateHeroPlayback);
reducedMotion.addEventListener('change', updateHeroPlayback);
new IntersectionObserver(([entry]) => {
  heroInView = entry.isIntersecting && entry.intersectionRatio >= 0.25;
  updateHeroPlayback();
}, { threshold: 0.25 }).observe(heroStory);

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
