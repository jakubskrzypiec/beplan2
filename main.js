// Polish copy. English lives in index.html and is read from the page on load.
const polish = {
  'meta.description': 'BEPLAN Design + Build. Architektura, projektowanie wnętrz i przestrzenie pracy pod klucz w regionie EMEA.',
  'skip': 'Przejdź do treści',
  'nav.projects': 'Realizacje',
  'nav.expertise': 'Oferta',
  'nav.international': 'Na świecie',
  'nav.studio': 'Studio',
  'nav.contact': 'Kontakt',
  'hero.title': 'Projektujemy.<br>Budujemy.<br>Oddajemy pod klucz.',
  'hero.explore': 'Zobacz realizacje',
  'hero.contact': 'Napisz do nas',
  'hero.hint': 'Przewijaj, aby zwiedzać',
  'projects.title': 'Wybrane realizacje',
  'area.1400': '1400 m²',
  'area.1500': '1500 m²',
  'area.2000': '2000 m²',
  'area.900': '900 m²',
  'city.warsaw': 'Warszawa',
  'city.dubai': 'Dubaj',
  'city.krakow': 'Kraków',
  'city.paris': 'Paryż',
  'city.lisbon': 'Lizbona',
  'city.ljubljana': 'Lublana',
  'city.valencia': 'Walencja',
  'city.madrid': 'Madryt',
  'city.malaga': 'Malaga',
  'expertise.label': 'Nasza oferta',
  'expertise.title': 'Od koncepcji<br>po realizację.',
  'expertise.text': 'Projektujemy, prowadzimy i realizujemy przestrzenie pracy — od pierwszego briefu po dzień przeprowadzki.',
  'service.1.title': 'Architektura i projektowanie wnętrz',
  'service.1.text': 'Projektujemy biura wokół tego, jak pracują zespoły — od pierwszej koncepcji i planu przestrzeni po szczegółową dokumentację wykonawczą.',
  'service.2.title': 'Design &amp; Build',
  'service.2.text': 'Jeden zespół prowadzi projekt od koncepcji przez budowę i fit-out, aż po przestrzeń gotową na przyjęcie Twojego zespołu.',
  'service.3.title': 'Generalne wykonawstwo',
  'service.3.text': 'Koordynujemy wykonawców, branże i montaż, realizując nowe i modernizowane wnętrza komercyjne.',
  'service.4.title': 'Zarządzanie projektem',
  'service.4.text': 'Planujemy harmonogramy, koordynujemy zespoły i pilnujemy jakości od startu projektu po odbiór.',
  'intl.label': 'Doświadczenie międzynarodowe',
  'intl.title': 'Jeden partner.<br>Wiele rynków.',
  'intl.text': 'Jedna wizja. Wiele rynków. Ta sama jakość. Z tym samym zespołem projektowym i wykonawczym realizujemy projekty w Polsce, Europie, na Bliskim Wschodzie i w Afryce.',
  'intl.explore': 'Zobacz miasta realizacji',
  'intl.pause': 'Zatrzymaj globus',
  'intl.play': 'Uruchom globus',
  'contact.label': 'Porozmawiajmy',
  'contact.title': 'Zbudujmy<br>coś wyjątkowego.',
  'contact.text': 'Opowiedz nam, co planujesz. Porozmawiamy o Twojej przestrzeni, harmonogramie i kolejnych krokach.',
  'contact.cta': 'Zacznij rozmowę',
  'contact.offices': 'Warszawa · Walencja',
  'interlude': 'Przestrzeń dla lepszej pracy',
  'form.label': 'Kontakt',
  'form.title': 'Opowiedz nam<br>o swoim projekcie.',
  'form.text': 'Krótki brief pomoże nam zrozumieć zakres i to, jak możemy współpracować.',
  'f.name': 'Imię i nazwisko',
  'f.name.ph': 'Jak się do Ciebie zwracać?',
  'f.email': 'E-mail',
  'f.phone': 'Telefon <i>(opcjonalnie)</i>',
  'f.type': 'Rodzaj projektu',
  'f.type.0': 'Wybierz rodzaj projektu',
  'f.type.1': 'Fit-out biura',
  'f.type.2': 'Handel lub gastronomia',
  'f.type.3': 'Modernizacja',
  'f.type.4': 'Inny',
  'f.location': 'Lokalizacja',
  'f.location.ph': 'Miasto lub okolica',
  'f.area': 'Powierzchnia',
  'f.area.ph': 'np. 750 m²',
  'f.start': 'Planowany start',
  'f.start.0': 'Wybierz termin',
  'f.start.1': 'Jak najszybciej',
  'f.start.2': 'W ciągu 3 miesięcy',
  'f.start.3': 'Za 3 do 6 miesięcy',
  'f.start.4': 'Za 6 miesięcy lub później',
  'f.start.5': 'Jeszcze planuję',
  'f.message': 'Kilka słów o projekcie',
  'f.message.ph': 'Co chcesz zmienić i co jest dla Ciebie najważniejsze?',
  'f.consent': 'Wyrażam zgodę na kontakt w sprawie tego zapytania.',
  'f.submit': 'Otwórz szkic e-maila',
  'f.help': 'Wyślij szkic ze swojego programu pocztowego lub skorzystaj z <a href="https://beplan.pl/#contact-anchor">formularza kontaktowego BEPLAN</a>.',
  'clients.title': 'Pracowaliśmy między innymi dla',
  'footer.about': 'Architektura, projektowanie i fit-out przestrzeni pracy w Europie, na Bliskim Wschodzie i w Afryce.',
  'footer.explore': 'Nawigacja',
  'footer.warsaw': 'Wschodnia 5, 05-090, Polska',
  'footer.valencia': 'Av. Francia 47, Walencja, Hiszpania',
  'footer.privacy': 'Polityka prywatności',
  'footer.top': 'Do góry',
};

const description = document.querySelector('meta[name="description"]');
const english = { 'meta.description': description.content };
for (const element of document.querySelectorAll('[data-i18n]')) english[element.dataset.i18n] ??= element.innerHTML;
for (const element of document.querySelectorAll('[data-i18n-placeholder]')) english[element.dataset.i18nPlaceholder] ??= element.placeholder;
const copy = { en: english, pl: polish };

function savedLanguage() {
  try {
    return localStorage.getItem('beplan-language');
  } catch {
    return null;
  }
}

function setLanguage(language, remember) {
  const text = copy[language];
  document.documentElement.lang = language;
  description.content = text['meta.description'];
  for (const element of document.querySelectorAll('[data-i18n]')) {
    const value = text[element.dataset.i18n] ?? english[element.dataset.i18n];
    if (element.innerHTML !== value) element.innerHTML = value;
  }
  for (const element of document.querySelectorAll('[data-i18n-placeholder]')) {
    element.placeholder = text[element.dataset.i18nPlaceholder] ?? english[element.dataset.i18nPlaceholder];
  }
  for (const button of document.querySelectorAll('[data-lang]')) {
    button.setAttribute('aria-pressed', String(button.dataset.lang === language));
  }
  if (remember) {
    try {
      localStorage.setItem('beplan-language', language);
    } catch {
      // The choice still applies to this visit.
    }
  }
  document.dispatchEvent(new CustomEvent('beplan:language', { detail: language }));
}

const requested = new URLSearchParams(location.search).get('lang') ?? savedLanguage()
  ?? (navigator.language?.toLowerCase().startsWith('pl') ? 'pl' : 'en');
if (requested === 'pl') setLanguage('pl', false);

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-lang]');
  if (button) setLanguage(button.dataset.lang, true);
});

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

// Extra copies of the logo list let the strip loop without a gap.
const logos = document.querySelector('.marquee-track');
for (let copies = 0; copies < 2; copies++) {
  const clone = logos.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  logos.parentElement.append(clone);
}

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
    let order = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (reducedMotion.matches || entry.target.matches(':focus-within')) continue;
      // Elements that come into view together, such as the service rows, follow one another.
      entry.target.animate(
        [{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 650, delay: 110 * order++, fill: 'backwards', easing: 'cubic-bezier(.2,.7,.2,1)' },
      );
    }
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-reveal], .service-list details').forEach((element) => reveal.observe(element));
}
