(() => {
  'use strict';
  const fold = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const root = document.body.dataset.root || '';
  const menu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('guide-nav');
  function closeMenu() {nav.classList.remove('open');menu.setAttribute('aria-expanded','false');}
  menu.addEventListener('click', () => {const open = nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
  document.addEventListener('click', e => {if (nav.classList.contains('open') && !nav.contains(e.target) && !menu.contains(e.target)) closeMenu();});
  const dialog = document.getElementById('search-dialog');
  const input = document.getElementById('global-search');
  const results = document.getElementById('search-results');
  const index = (window.WARGS_SEARCH || []).map(item => ({...item, folded:fold(item.text), titleFolded:fold(item.title)}));
  function search() {
    const query = fold(input.value.trim());
    const terms = query.split(/\s+/).filter(Boolean);
    const hits = index.filter(item => terms.every(term => item.folded.includes(term))).sort((a,b) => Number(b.titleFolded.includes(query)) - Number(a.titleFolded.includes(query)));
    const shown = query ? hits.slice(0,30) : index.filter(item => ['NorseDemigods','Deathlink','Seasons','Extra Slots','RecipePinner'].includes(item.title));
    document.getElementById('search-count').textContent = query ? `${hits.length} résultat${hits.length === 1 ? '' : 's'}${hits.length > 30 ? ' · 30 affichés, précise ta recherche' : ''}` : 'Quelques repères pour commencer';
    results.innerHTML = shown.length ? shown.map(item => `<a class="search-result" href="${root+esc(item.url)}"><span>${esc(item.category)}</span><strong>${esc(item.title)}</strong><p>${esc(item.summary)}</p></a>`).join('') : '<p class="empty">Aucun résultat. Essaie une touche ou le nom de l’action.</p>';
  }
  document.querySelector('.search-open').addEventListener('click', () => {dialog.showModal();search();input.focus();});
  document.getElementById('search-close').addEventListener('click', () => dialog.close());
  input.addEventListener('input',search);
  dialog.addEventListener('click', e => {if(e.target === dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  document.addEventListener('keydown', e => {if(e.key==='Escape') closeMenu();if(e.key==='/'&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&!e.target.isContentEditable){e.preventDefault();if(!dialog.open)dialog.showModal();search();input.focus();}});
  const modFilter = document.getElementById('mod-filter');
  if(modFilter){
    let category='';
    const cards=[...document.querySelectorAll('.mod-card')];
    const filters=[...document.querySelectorAll('[data-filter]')];
    function filterMods(){const query=fold(modFilter.value.trim());let count=0;for(const card of cards){const show=(!category||card.dataset.category===category)&&fold(card.dataset.search).includes(query);card.hidden=!show;if(show)count++;}document.getElementById('mod-count').textContent=`${count} / ${cards.length} fiches`;document.getElementById('mod-empty').hidden=count!==0;}
    modFilter.addEventListener('input',filterMods);
    for(const button of filters)button.addEventListener('click',()=>{category=button.dataset.filter;for(const b of filters){b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));}filterMods();});
  }
  const keyFilter=document.getElementById('key-filter');
  if(keyFilter){const groups=[...document.querySelectorAll('.key-group')];keyFilter.addEventListener('input',()=>{const q=fold(keyFilter.value.trim());let count=0;for(const group of groups){const show=fold(group.dataset.search).includes(q);group.hidden=!show;if(show)count++;}document.getElementById('key-count').textContent=`${count} / ${groups.length} groupes de commandes`;document.getElementById('key-empty').hidden=count!==0;});}
})();
