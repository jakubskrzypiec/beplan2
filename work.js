// Project pages.
// - sector.html: one sector's projects as stacked full-screen frames (each frame sticks, the next
//   slides over it while the previous one shrinks and fades), plus a "projects map" overlay.
// - project.html: a single project with its description and photos.
// Runs before main.js so the English copy is in the page when main.js collects it for the
// language switch.
(function () {
  const projects = window.BEPLAN_PROJECTS || [];
  const details = window.BEPLAN_DETAILS || {};
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

  // Place names in Polish and Spanish; anything not listed stays as on the old site.
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
  const projectUrl = (slug) => `project.html?p=${slug}`;
  const placeTag = (p) => `<span data-place="${p.place}">${p.place}</span>`;
  const areaTag = (p) => (p.area ? `<span data-area="${p.area}">${localArea(p.area, 'en')}</span>` : '');

  function relabel(lang) {
    for (const el of document.querySelectorAll('[data-place]')) el.textContent = localPlace(el.dataset.place, lang);
    for (const el of document.querySelectorAll('[data-area]')) el.textContent = localArea(Number(el.dataset.area), lang);
    const heading = document.getElementById('sector-title') || document.getElementById('hub-title') || document.getElementById('pj-name') || document.getElementById('legal-title');
    if (heading) document.title = `${heading.textContent.trim()} — BEPLAN Design + Build`;
  }
  document.addEventListener('beplan:language', (event) => relabel(event.detail));

  /* ================= Single project ================= */
  const pjName = document.getElementById('pj-name');
  if (pjName) {
    const slug = new URLSearchParams(location.search).get('p');
    const p = projects.find((x) => x.slug === slug) || projects[0];
    const d = details[p.slug] || { blocks: [], photos: 0 };
    const sectorKey = p.sector;
    document.title = `${p.name} — BEPLAN Design + Build`;
    pjName.textContent = p.name;
    const cover = document.getElementById('pj-cover');
    cover.src = p.image;
    cover.alt = p.name;
    const back = document.getElementById('pj-back');
    back.href = `sector.html?s=${sectorKey}`;
    const backLabel = document.getElementById('pj-sector');
    backLabel.innerHTML = sectors[sectorKey].title;
    backLabel.dataset.i18n = `sector.${sectorKey}.title`;
    document.getElementById('pj-tags').innerHTML = placeTag(p) + areaTag(p);

    document.getElementById('pj-facts').innerHTML = `
      <div><dt data-i18n="work.sector">Sector</dt><dd><a href="sector.html?s=${sectorKey}" data-i18n="sector.${sectorKey}.title">${sectors[sectorKey].title}</a></dd></div>
      <div><dt data-i18n="work.location">Location</dt><dd>${placeTag(p)}</dd></div>
      ${p.area ? `<div><dt data-i18n="work.area">Area</dt><dd>${areaTag(p)}</dd></div>` : ''}`;

    // description: paragraphs, headings and lists from the original project page
    let html = '';
    let inList = false;
    for (const b of d.blocks) {
      if (b.type === 'li') { if (!inList) { html += '<ul>'; inList = true; } html += `<li>${b.text}</li>`; continue; }
      if (inList) { html += '</ul>'; inList = false; }
      html += b.type === 'h' ? `<h3>${b.text}</h3>` : `<p>${b.text}</p>`;
    }
    if (inList) html += '</ul>';
    const body = document.getElementById('pj-body');
    body.innerHTML = html;
    body.lang = 'en';

    // photos: one wide, then two side by side, repeating
    const photos = Array.from({ length: d.photos }, (_, i) => `assets/work/${p.slug}/${i + 1}.webp`);
    let g = '';
    for (let i = 0, row = 0; i < photos.length; row++) {
      const take = (row % 2 === 0 || i === photos.length - 1) ? 1 : 2;
      const group = photos.slice(i, i + take);
      g += `<div class="pj-row pj-row--${group.length}">${group.map((src) => `<figure class="pj-photo" data-reveal><img src="${src}" alt="${p.name}" loading="lazy" decoding="async"></figure>`).join('')}</div>`;
      i += take;
    }
    document.getElementById('pj-gallery').innerHTML = g;

    // previous / next within the same sector
    const same = projects.filter((x) => x.sector === sectorKey);
    const at = same.findIndex((x) => x.slug === p.slug);
    const prev = same[(at - 1 + same.length) % same.length];
    const next = same[(at + 1) % same.length];
    const navItem = (x, cls, label, text) => `<a class="pj-nav-item ${cls}" href="${projectUrl(x.slug)}">
        <img src="assets/work/thumbs/${x.slug}.webp" alt="" loading="lazy" decoding="async">
        <span class="pj-nav-label" data-i18n="${label}">${text}</span>
        <span class="pj-nav-name">${x.name}</span>
      </a>`;
    document.getElementById('pj-nav').innerHTML = navItem(prev, 'is-prev', 'work.prev', 'Previous project') + navItem(next, 'is-next', 'work.next', 'Next project');
    return;
  }

  /* ================= Sector page ================= */
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

  const mapButton = (cls) => `<button class="${cls} map-open" type="button" aria-haspopup="dialog" aria-controls="pmap"><span data-i18n="work.map">Projects map</span><span class="map-icon" aria-hidden="true"></span></button>`;
  document.querySelector('.sector-count').insertAdjacentHTML('afterend', mapButton('intro-map'));

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
  frames.innerHTML = groups.map((group, gi) => `
      <section class="frame frame--${group.length}">
        <div class="frame-inner">
${group.map((p) => { n += 1; return `          <a class="panel" href="${projectUrl(p.slug)}">
            <span class="panel-media"><img src="${p.image}" alt="" ${gi < 2 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></span>
            <span class="panel-no">${pad(n)} / ${pad(list.length)}</span>
            <span class="panel-meta">
              <span class="panel-name">${p.name}</span>
              <span class="panel-tags">${placeTag(p)}${areaTag(p)}</span>
            </span>
          </a>`; }).join('\n')}
        </div>
        <div class="frame-tools">
          <button class="frame-top to-top" type="button"><span data-i18n="footer.top">Back to top</span><span class="top-icon" aria-hidden="true"></span></button>
          ${mapButton('frame-map')}
        </div>
      </section>
      <div class="frame-hold" aria-hidden="true"></div>`).join('');

  const more = document.getElementById('more-links');
  more.innerHTML = Object.keys(sectors).filter((k) => k !== sector).map((k) => `<a class="more-link" href="sector.html?s=${k}"><span data-i18n="sector.${k}.title">${sectors[k].title}</span><b>${projects.filter((p) => p.sector === k).length}</b><span class="more-arrow" aria-hidden="true"></span></a>`).join('');

  /* ---- Projects map: every project of the sector at a glance ---- */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="pmap" id="pmap" role="dialog" aria-modal="true" aria-labelledby="pmap-title" hidden>
      <div class="pmap-head wrap">
        <div>
          <p class="section-label" data-i18n="work.map">Projects map</p>
          <h2 class="statement" id="pmap-title" data-i18n="sector.${sector}.title">${sectors[sector].title}</h2>
        </div>
        <button class="pmap-close" type="button"><span data-i18n="work.close">Close</span><span class="pmap-x" aria-hidden="true"></span></button>
      </div>
      <div class="pmap-grid wrap">
${list.map((p, i) => `        <a class="pmap-item" href="${projectUrl(p.slug)}">
          <span class="pmap-thumb"><img src="assets/work/thumbs/${p.slug}.webp" alt="" loading="lazy" decoding="async"></span>
          <span class="pmap-no">${pad(i + 1)}</span>
          <span class="pmap-name">${p.name}</span>
          <span class="pmap-place">${placeTag(p)}</span>
        </a>`).join('\n')}
      </div>
    </div>`);
  const pmap = document.getElementById('pmap');
  let opener = null;
  function openMap(button) {
    opener = button;
    pmap.hidden = false;
    document.documentElement.classList.add('pmap-open');
    requestAnimationFrame(() => pmap.classList.add('is-open'));
    pmap.querySelector('.pmap-close').focus();
  }
  function closeMap() {
    pmap.classList.remove('is-open');
    document.documentElement.classList.remove('pmap-open');
    setTimeout(() => { pmap.hidden = true; }, 350);
    opener?.focus();
  }
  document.addEventListener('click', (event) => {
    if (event.target.closest('.to-top')) {
      const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: instant ? 'auto' : 'smooth' });
      return;
    }
    const button = event.target.closest('.map-open');
    if (button) openMap(button);
    if (event.target.closest('.pmap-close')) closeMap();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !pmap.hidden) closeMap();
  });

  /* ---- Motion: frames arrive whole; the previous one shrinks and fades underneath ---- */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.addEventListener('DOMContentLoaded', () => {
    if (reduce || !window.gsap || !window.ScrollTrigger) return;
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('has-frame-motion');
    const all = gsap.utils.toArray('.frame');
    all.forEach((frame, i) => {
      const next = all[i + 1] || document.querySelector('.sector-more');
      gsap.to(frame.querySelector('.frame-inner'), {
        scale: 0.92, opacity: 0.35, ease: 'none', force3D: true,
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true },
      });
    });
    window.addEventListener('load', () => ScrollTrigger.refresh());
  });
})();
