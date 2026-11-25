// Project pages: builds a sector's projects as full-screen frames and animates them like the
// stacked cases on the kubask site (each frame sticks, the next one slides over it while the
// previous one shrinks and fades). Runs before main.js so the English copy is in the page when
// main.js collects it for the language switch.
(function () {
  const projects = window.BEPLAN_PROJECTS || [];
  const sectors = {
    offices: {
      title: 'Offices &amp; Workplaces',
      text: 'We design and deliver innovative workplaces that enhance collaboration, productivity and employee well-being. From corporate headquarters and flexible offices to complete workplace transformations, we create environments that reflect each organization’s identity and evolving business needs.',
    },
    residential: {
      title: 'Residential',
      text: 'We create distinctive residential spaces that combine contemporary design, comfort and individuality. From luxury apartments and private residences to complete renovations, we deliver thoughtfully designed interiors where aesthetics, functionality and craftsmanship come together.',
    },
    retail: {
      title: 'Retail &amp; Commercial',
      text: 'We design and build engaging commercial environments that strengthen brand identity and enhance customer experience. From retail stores and showrooms to hospitality and leisure spaces, we combine creative design with technical expertise to deliver functional, memorable destinations.',
    },
  };

  // Place names in Polish and Spanish; anything not listed stays as on beplan.pl.
  const places = {
    pl: { Warsaw: 'Warszawa', Paris: 'Paryż', Lisbon: 'Lizbona', Madrid: 'Madryt', Dubai: 'Dubaj', UAE: 'ZEA', Spain: 'Hiszpania', Poland: 'Polska', Slovenia: 'Słowenia', Ljubljana: 'Lublana', 'South Africa': 'RPA', Valencia: 'Walencja', Málaga: 'Malaga', Malaga: 'Malaga' },
    es: { Warsaw: 'Varsovia', Paris: 'París', Lisbon: 'Lisboa', Dubai: 'Dubái', UAE: 'EAU', Spain: 'España', Poland: 'Polonia', Slovenia: 'Eslovenia', Ljubljana: 'Liubliana', 'South Africa': 'Sudáfrica', 'Kraków': 'Cracovia', 'Poznań': 'Poznan', 'Łódź': 'Lodz', Malaga: 'Málaga' },
  };
  const localPlace = (place, lang) => {
    const map = places[lang];
    if (!map) return place;
    return place.split(/(,\s*)/).map((part) => map[part] ?? part).join('');
  };
  const localArea = (area, lang) => {
    if (!area) return '';
    const locale = { pl: 'pl-PL', es: 'es-ES' }[lang] || 'en-GB';
    return `${area.toLocaleString(locale, { useGrouping: area >= 1000 }).replace(/ /g, ' ')} m²`;
  };
  const pad = (n) => String(n).padStart(2, '0');

  function relabel(lang) {
    for (const el of document.querySelectorAll('[data-place]')) el.textContent = localPlace(el.dataset.place, lang);
    for (const el of document.querySelectorAll('[data-area]')) el.textContent = localArea(Number(el.dataset.area), lang);
  }
  document.addEventListener('beplan:language', (event) => relabel(event.detail));
  document.addEventListener('beplan:language', () => {
    const heading = document.getElementById('sector-title') || document.getElementById('hub-title');
    if (heading) document.title = `${heading.textContent.trim()} — BEPLAN Design + Build`;
  });

  /* ---- Sector page ---- */
  const frames = document.getElementById('frames');
  if (!frames) return;
  const key = new URLSearchParams(location.search).get('s');
  const sector = sectors[key] ? key : 'offices';
  const list = projects.filter((p) => p.sector === sector);

  document.title = `${sectors[sector].title.replace('&amp;', '&')} — BEPLAN Design + Build`;
  const title = document.getElementById('sector-title');
  title.innerHTML = sectors[sector].title;
  title.dataset.i18n = `sector.${sector}.title`;
  const text = document.getElementById('sector-text');
  text.innerHTML = sectors[sector].text;
  text.dataset.i18n = `sector.${sector}.text`;
  document.getElementById('sector-count').textContent = list.length;

  // Frames alternate between one project on the whole screen and two or three side by side.
  const pattern = [1, 2, 1, 3];
  const groups = [];
  for (let i = 0, step = 0; i < list.length; step++) {
    let size = pattern[step % pattern.length];
    if (list.length - i - size === 1 && size > 1) size -= 1; // never leave a lone last project after a split
    groups.push(list.slice(i, i + size));
    i += size;
  }
  let n = 0;
  frames.innerHTML = groups.map((group) => `
      <section class="frame frame--${group.length}">
        <div class="frame-inner">
${group.map((p) => { n += 1; return `          <a class="panel" href="https://beplan.pl/projects/${p.slug}/">
            <span class="panel-media"><img src="${p.image}" alt="" loading="lazy" decoding="async"></span>
            <span class="panel-no">${pad(n)} / ${pad(list.length)}</span>
            <span class="panel-view"><span data-i18n="work.view">View project</span><span class="panel-arrow" aria-hidden="true"></span></span>
            <span class="panel-meta">
              <span class="panel-name">${p.name}</span>
              <span class="panel-tags"><span data-place="${p.place}">${p.place}</span>${p.area ? `<span data-area="${p.area}">${localArea(p.area, 'en')}</span>` : ''}</span>
            </span>
          </a>`; }).join('\n')}
        </div>
      </section>
      <div class="frame-hold" aria-hidden="true"></div>`).join('');

  const more = document.getElementById('more-links');
  more.innerHTML = Object.keys(sectors).filter((k) => k !== sector).map((k) => `<a class="more-link" href="sector.html?s=${k}"><span data-i18n="sector.${k}.title">${sectors[k].title}</span><b>${projects.filter((p) => p.sector === k).length}</b><span class="more-arrow" aria-hidden="true"></span></a>`).join('');

  /* ---- Motion ---- */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.addEventListener('DOMContentLoaded', () => {
    if (reduce || !window.gsap || !window.ScrollTrigger) return;
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('has-frame-motion');

    gsap.from('.sector-intro > *', { opacity: 0, y: 28, duration: 1.1, stagger: 0.08, ease: 'power3.out' });

    const all = gsap.utils.toArray('.frame');
    all.forEach((frame, i) => {
      const panels = frame.querySelectorAll('.panel');
      // panels open upwards, one after another: the photo layer slides up while the
      // image inside slides down by the same amount, so it reads as a curtain (transforms only)
      const media = frame.querySelectorAll('.panel-media');
      const imgs = frame.querySelectorAll('.panel-media img');
      const reveal = gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 80%', once: true } });
      reveal.fromTo(media, { yPercent: 100 }, { yPercent: 0, duration: 1.3, ease: 'expo.inOut', stagger: 0.12 }, 0);
      reveal.fromTo(imgs, { yPercent: -100, scale: 1.15 }, { yPercent: 0, scale: 1.04, duration: 1.3, ease: 'expo.inOut', stagger: 0.12 }, 0);
      gsap.fromTo(frame.querySelectorAll('.panel-meta, .panel-no, .panel-view'), { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.06,
        scrollTrigger: { trigger: frame, start: 'top 45%', once: true },
      });
      // while the next frame slides over, this one shrinks and fades
      const next = all[i + 1] || document.querySelector('.sector-more');
      gsap.to(frame.querySelector('.frame-inner'), {
        scale: 0.92, opacity: 0.35, ease: 'none', force3D: true,
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: 0.4 },
      });
    });
    gsap.from('.more-link, .more-cta > *', { opacity: 0, y: 30, duration: 1.1, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.sector-more', start: 'top 70%' } });
    window.addEventListener('load', () => ScrollTrigger.refresh());
  });
})();
