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

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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
