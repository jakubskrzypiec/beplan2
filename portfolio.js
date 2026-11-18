let projects = [];
const parameters = new URLSearchParams(location.search);
let sector = ['offices', 'residential', 'retail'].includes(parameters.get('sector')) ? parameters.get('sector') : 'all';
const grid = document.querySelector('#portfolio-grid');
const detail = document.querySelector('#project-detail');
const status = document.querySelector('.portfolio-status');
const text = key => copy[document.documentElement.lang]?.[key] ?? copy.en[key] ?? key;
const escapeText = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');

function renderCard(project) {
  const area = project.area ? new Intl.NumberFormat(document.documentElement.lang).format(project.area) + ' m²' : '';
  return `<a class="project" href="project.html?id=${encodeURIComponent(project.id)}">
    <span class="project-visual"><img src="${project.thumbnail}" alt="${escapeText(project.title)}" width="1000" height="667" loading="lazy" decoding="async"></span>
    <span class="project-caption">
      <span class="project-name">${escapeText(project.title.split('|')[0].trim())}</span>
      <span class="project-details">${escapeText([project.location, area].filter(Boolean).join(' · '))}</span>
      <span class="project-arrow" aria-hidden="true">↗</span>
    </span>
  </a>`;
}

function render() {
  if (grid) {
    const selected = sector === 'all' ? projects : projects.filter(project => project.category === sector);
    grid.innerHTML = selected.map(renderCard).join('');
    for (const button of document.querySelectorAll('[data-sector]')) button.setAttribute('aria-pressed', String(button.dataset.sector === sector));
    status.textContent = selected.length ? '' : text('projects.empty');
    return;
  }
  const project = projects.find(project => project.id === parameters.get('id'));
  if (!project) {
    status.textContent = text('project.missing');
    return;
  }
  document.title = project.title + ' — BEPLAN360';
  const area = project.area ? `<div><dt>${text('project.area')}</dt><dd>${new Intl.NumberFormat(document.documentElement.lang).format(project.area)} m²</dd></div>` : '';
  detail.innerHTML = `
    <p class="section-label">${text('sector.' + project.category)}</p>
    <h1 class="statement project-page-title">${escapeText(project.title.split('|')[0])}</h1>
    <img class="project-page-image" src="${project.hero ?? project.thumbnail}" alt="${escapeText(project.title)}" width="1000" height="667" fetchpriority="high">
    <div class="project-page-overview">
      <p class="project-description" lang="en">${escapeText(project.description)}</p>
      <dl class="project-facts">
        <div><dt>${text('project.location')}</dt><dd>${escapeText(project.location)}</dd></div>
        ${area}
        <div><dt>${text('project.sector')}</dt><dd>${text('sector.' + project.category)}</dd></div>
      </dl>
    </div>
    <div class="project-page-actions">
      <a class="button button-light" href="index.html#contact-form">${text('hero.contact')}</a>
      <a class="back-link" href="projects.html?sector=${project.category}">${text('project.back')}</a>
    </div>`;
  status.textContent = '';
}

async function loadProjects() {
  try {
    const response = await fetch('projects.json?v=14');
    if (!response.ok) throw new Error('Projects unavailable');
    projects = await response.json();
    render();
  } catch {
    status.textContent = text('project.error') + ' ';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'sector-link';
    retry.textContent = text('project.retry');
    retry.addEventListener('click', loadProjects, { once: true });
    status.append(retry);
  }
}

document.querySelector('.portfolio-filters')?.addEventListener('click', event => {
  const button = event.target.closest('[data-sector]');
  if (!button) return;
  sector = button.dataset.sector;
  const url = new URL(location.href);
  if (sector === 'all') url.searchParams.delete('sector');
  else url.searchParams.set('sector', sector);
  history.replaceState(null, '', url);
  render();
});
document.addEventListener('beplan:language', () => { if (projects.length) render(); });
loadProjects();
