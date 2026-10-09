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
  const referenceFilter=document.getElementById('reference-filter');
  if(referenceFilter){
    const groups=[...document.querySelectorAll('.reference-group')].map(el=>({el,title:fold(el.querySelector('summary').textContent),rows:[...el.querySelectorAll('tbody tr')].map(el=>({el,text:fold(el.textContent)}))}));
    let filtering=false;
    function filterReference(){
      const q=fold(referenceFilter.value.trim());let count=0,shown=0;
      for(const group of groups){
        const titleMatches=!!q&&group.title.includes(q);let matched=0;
        for(const row of group.rows){const visible=!q||titleMatches||row.text.includes(q);row.el.hidden=!visible;if(visible)matched++;}
        group.el.hidden=matched===0;
        if(q)group.el.open=matched>0;else if(filtering)group.el.open=false;
        if(matched){count+=matched;shown++;}
      }
      filtering=!!q;
      document.getElementById('reference-count').textContent=`${count} valeur${count===1?'':'s'} · ${shown} section${shown===1?'':'s'}`;
      document.getElementById('reference-empty').hidden=shown!==0;
    }
    referenceFilter.addEventListener('input',filterReference);filterReference();
  }
  const deathLevel=document.getElementById('deathlink-level');
  if(deathLevel){
    function updateDeathlink(){
      const level=Number(deathLevel.value),factor=Math.max(.01,Math.min(1,level/100));
      const raw=4*factor,floor=Math.floor(raw);
      const gear=(raw-floor===.5)?(floor%2===0?floor:floor+1):Math.round(raw);
      const food=level>=90?3:level>=60?2:level>30?1:0;
      const loss=new Intl.NumberFormat('fr-FR',{maximumFractionDigits:3}).format(5*(1-factor));
      document.getElementById('deathlink-level-value').textContent=level;
      document.getElementById('deathlink-loss').textContent=`Baisse de niveau : ${loss} %.`;
      document.getElementById('deathlink-gear').textContent=`Jusqu’à ${gear} pièce${gear===1?'':'s'} reprise${gear===1?'':'s'}.`;
      document.getElementById('deathlink-food').textContent=`${food} repas conservé${food===1?'':'s'} sur 3.`;
    }
    deathLevel.addEventListener('input',updateDeathlink);updateDeathlink();
  }
  const slotsSimulator=document.querySelector('.extraslots-simulator');
  if(slotsSimulator){
    function updateExtraSlots(){
      const state={};slotsSimulator.querySelectorAll('[data-slot-condition]').forEach(el=>{state[el.dataset.slotCondition]=el.checked;});
      const first=state.elder||state.crypt,third=first&&(state.bonemass||state.wishbone);
      const quick=first?(third?3:2):0;
      const utilityOne=state.utility&&(state.bonemass||state.wishbone);
      const utilityTwo=utilityOne&&(state.yagluth||state.demister);
      const utility=state.utility?(utilityTwo?3:utilityOne?2:1):0;
      const misc=quick>0?Number(state.food)+Number(state.ammo):0;
      document.getElementById('slots-quick-result').textContent=`${quick} sur 3 disponibles${quick===3?' : X, C et V':quick===2?' : X et C':''}.`;
      document.getElementById('slots-utility-result').textContent=`${utility} emplacement${utility===1?'':'s'} disponible${utility===1?'':'s'} au total.`;
      document.getElementById('slots-other-result').textContent=`Nourriture : ${state.food?3:0} · Munitions : ${state.ammo?3:0} · Divers : ${misc}.`;
      document.getElementById('slots-light-result').textContent=state.light?'Deux dernières lignes : poids comptabilisé ×0,5.':'Pas encore actives.';
    }
    slotsSimulator.querySelectorAll('input').forEach(el=>el.addEventListener('change',updateExtraSlots));updateExtraSlots();
  }
  const seasonExample=document.getElementById('season-example');
  if(seasonExample){
    const rates={Spring:{food:1,rest:1.25,grow:2},Summer:{food:.75,rest:1.5,grow:1.5},Fall:{food:1,rest:.85,grow:.5},Winter:{food:1.25,rest:.75,grow:0}};
    const duration=min=>{const seconds=Math.round(min*60),m=Math.floor(seconds/60),s=seconds%60;return `${m} min${s?' '+s+' s':''}`;};
    function updateSeasonExample(){
      const r=rates[seasonExample.value];
      const base=id=>Math.max(1,Number(document.getElementById(id).value)||1);
      document.getElementById('season-food-result').textContent=duration(base('season-food-base')/r.food);
      document.getElementById('season-rest-result').textContent=duration(base('season-rest-base')*r.rest);
      document.getElementById('season-grow-result').textContent=r.grow?duration(base('season-grow-base')/r.grow):'Croissance arrêtée en hiver.';
    }
    for(const id of ['season-example','season-food-base','season-rest-base','season-grow-base'])document.getElementById(id).addEventListener('input',updateSeasonExample);
    updateSeasonExample();
  }
  const mythicsSimulator=document.getElementById('mythics-simulator');
  if(mythicsSimulator){
    const fmt=n=>Number(n.toFixed(2)).toLocaleString('fr-FR');
    const bounded=(id,defaultValue)=>{const n=Number(document.getElementById(id).value);return Math.max(0,Math.min(100,Number.isFinite(n)?n:defaultValue));};
    function updateMythics(){
      const seen=new Set();let base=0,duplicate=false;
      for(let i=1;i<=3;i++){
        const select=document.getElementById(`mythics-food-${i}`);
        if(!select.value)continue;
        if(seen.has(select.value)){duplicate=true;continue;}
        seen.add(select.value);base+=Number(select.selectedOptions[0].dataset.eitr);
      }
      const total=base*Math.pow(bounded('mythics-food-left',100)/100,.3);
      const weapon=document.getElementById('mythics-weapon');
      const cost=Number(weapon.selectedOptions[0].dataset.cost)*(1-.33*bounded('mythics-skill',0)/100);
      document.getElementById('mythics-eitr-result').textContent=`${fmt(total)} eitr${duplicate?' — repas identique compté une seule fois.':'.'}`;
      document.getElementById('mythics-cost-result').textContent=`${fmt(cost)} eitr pour le sort principal.`;
      document.getElementById('mythics-casts-result').textContent=`${Math.floor((total+1e-9)/cost)} lancer(s) avec cette réserve pleine, sans régénération.`;
    }
    mythicsSimulator.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',updateMythics));updateMythics();
  }
  const legendsPlanner=document.getElementById('legends-planner');
  if(legendsPlanner){
    function updateLegendsBudget(){
      const item=document.getElementById('legends-item').selectedOptions[0];
      const input=document.getElementById('legends-quality'),max=Number(item.dataset.max);
      input.max=max;const quality=Math.max(1,Math.min(max,Math.floor(Number(input.value)||1)));input.value=quality;
      document.getElementById('legends-quality-note').textContent=`Qualité maximale de cet objet : ${max}. Budget jusqu’à qualité ${quality}.`;
      const total=document.getElementById('legends-budget');total.replaceChildren();
      for(const ingredient of JSON.parse(item.dataset.ingredients)){
        const amount=ingredient.amount+ingredient.upgrade*quality*(quality-1)/2;
        if(amount<=0)continue;
        const li=document.createElement('li');li.textContent=`${amount.toLocaleString('fr-FR')} ${ingredient.name}`;total.append(li);
      }
    }
    legendsPlanner.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',updateLegendsBudget));updateLegendsBudget();
  }
  const legendsBow=document.getElementById('legends-bow-hits');
  if(legendsBow){
    function updateLegendsBow(){
      const hits=Math.max(1,Math.min(100,Math.floor(Number(legendsBow.value)||1)));
      const fmt=v=>Number(v.toFixed(2)).toLocaleString('fr-FR');
      document.getElementById('legends-bow-result').textContent=`${fmt(hits*.45)} déclenchements en moyenne ; ${fmt(100*(1-Math.pow(.55,hits)))} % de chances d’en obtenir au moins un, et ${fmt(100*Math.pow(.55,hits))} % de n’en obtenir aucun.`;
    }
    legendsBow.addEventListener('input',updateLegendsBow);updateLegendsBow();
  }
  const oceanMeals=document.getElementById('ocean-meals');
  if(oceanMeals){
    function updateOceanMeals(){
      const food=document.getElementById('ocean-food').selectedOptions[0];
      const portions=Math.max(1,Math.min(999,Math.floor(Number(document.getElementById('ocean-portions').value)||1)));
      document.getElementById('ocean-portions').value=portions;
      const rate=Number(document.getElementById('ocean-season').value);
      const each=Number(food.dataset.duration)/60/rate;
      const fmt=n=>Number(n.toFixed(2)).toLocaleString('fr-FR');
      document.getElementById('ocean-meal-result').textContent=`${fmt(each)} minutes par portion ; ${fmt(each*portions)} minutes pour ${portions} portion(s).`;
    }
    oceanMeals.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',updateOceanMeals));updateOceanMeals();
  }
  const questChoice=document.getElementById('quest-choice');
  if(questChoice){
    function updateQuestRoute(){
      const chain=JSON.parse(questChoice.selectedOptions[0].dataset.chain);
      const list=document.getElementById('quest-route');list.replaceChildren();
      let kills=0,gather=0;
      for(const step of chain){
        kills+=step.killCount;gather+=step.gatherCount;
        const li=document.createElement('li');
        const strong=document.createElement('strong');strong.textContent=step.title;
        const text=document.createElement('p');text.textContent=`Vaincre : ${step.kills}. Rassembler : ${step.gather}. Récompenses : ${step.rewards}.`;
        li.append(strong,text);list.append(li);
      }
      document.getElementById('quest-route-total').textContent=`${chain.length} étape(s), ${kills} mort(s) à créditer et ${gather} objet(s) à comptabiliser sur l’ensemble de la chaîne.`;
    }
    questChoice.addEventListener('input',updateQuestRoute);updateQuestRoute();
  }
  const wardsRadius=document.getElementById('wards-radius');
  if(wardsRadius){
    function updateWardsArea(){
      const r=Math.max(1,Math.min(200,Number(wardsRadius.value)||1));
      const active=document.getElementById('wards-active').value==='yes';
      const effective=active?r:Math.min(r,10);
      const fmt=n=>Number(n.toFixed(2)).toLocaleString('fr-FR');
      document.getElementById('wards-area-result').textContent=`Rayon de suppression illustré : ${fmt(effective)} m ; ${fmt(Math.PI*effective*effective)} m² au sol ; ×${fmt(effective*effective/100)} la surface d’un rayon de 10 m.`;
    }
    wardsRadius.addEventListener('input',updateWardsArea);document.getElementById('wards-active').addEventListener('input',updateWardsArea);updateWardsArea();
  }
  const wardsRegen=document.getElementById('wards-food-regen');
  if(wardsRegen){
    function updateWardsHealing(){
      const regen=Math.max(0,Math.min(100,Number(wardsRegen.value)||0));
      const fmt=n=>Number(n.toFixed(2)).toLocaleString('fr-FR');
      document.getElementById('wards-heal-result').textContent=`${fmt(regen/2)} PV/s ; ${fmt(regen*90)} PV de potentiel nominal sur 180 secondes par bénéficiaire éligible.`;
    }
    wardsRegen.addEventListener('input',updateWardsHealing);updateWardsHealing();
  }
  const tradersOffer=document.getElementById('traders-offer');
  if(tradersOffer){
    const offers=JSON.parse(document.getElementById('traders-calc-data').textContent);
    function evenRound(n){const a=Math.floor(n),d=n-a;return d===0.5?(a%2===0?a:a+1):Math.round(n);}
    function updateTraderPrice(){
      const o=offers[tradersOffer.value];
      const b=Math.max(0,Math.min(1000000,Math.floor(Number(document.getElementById('traders-balance').value)||0)));
      const n=Math.max(1,Math.min(10000,Math.floor(Number(document.getElementById('traders-count').value)||1)));
      const buy=o.direction==='buy';
      // Match float interpolation, percentage rounding and lot-first purchase rounding.
      const f=Math.fround;
      const lerp=(a,z,t)=>f(f(a)+f(f(f(z)-f(a))*f(Math.max(0,Math.min(1,t)))));
      const raw=b<2000?lerp(buy?1.5:0.7,1,f(b/2000)):lerp(1,buy?0.7:1.5,f((b-2000)/4000));
      const factor=evenRound(f(raw*100))/100;
      // Decimal money arithmetic after the mod's percentage normalization.
      const percent=Math.round(factor*100);
      const perLot=Math.max(1,Math.floor(o.price*percent/100));
      const cost=buy?perLot*n:Math.max(1,Math.floor(o.price*n*percent/100));
      const fmt=x=>x.toLocaleString('fr-FR');
      document.getElementById('traders-price-result').textContent=`${buy?'Acheter':'Vendre'} ${fmt(n*o.stack)} objet(s) — ${o.name}. Facteur ×${fmt(factor)}. ${buy?fmt(perLot)+' pièce(s) par lot ; ':''}total : ${fmt(cost)} pièce(s).`;
      document.getElementById('traders-balance-result').textContent=!buy&&cost>b?'Vente impossible à cette caisse : le marchand manque de pièces.':`Caisse après cet échange : ${fmt(b+(buy?cost:-cost))} pièce(s).`;
    }
    for(const id of ['traders-offer','traders-balance','traders-count'])document.getElementById(id).addEventListener('input',updateTraderPrice);
    updateTraderPrice();
  }

})();
