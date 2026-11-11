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
