(() => {
'use strict';
const $ = id => document.getElementById(id);
const panels = Array.from(document.querySelectorAll('.panel'));
const tabs = Array.from(document.querySelectorAll('[data-tab]'));
const allowed = new Set(panels.map(p=>p.id));
let currentPage=document.documentElement.dataset.page||'home';
const parseRoute = hash => {const v=(hash||'#home').slice(1).split('/');return {page:v[0]==='main'?currentPage:allowed.has(v[0])?v[0]:'home',anchor:v[1]||''};};
const showRoute = (move=false) => {
 const route=parseRoute(location.hash);currentPage=route.page;
 panels.forEach(p=>{p.hidden=p.id!==route.page;});
 tabs.forEach(t=>{const active=t.dataset.tab===route.page;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;});
 if(move&&!tabs.includes(document.activeElement)){const heading=location.hash==='#main'?$('main'):$(route.page).querySelector('h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}
 if(route.anchor){const target=$(route.anchor);if(target&&$(route.page).contains(target))target.scrollIntoView({block:'start'});}else if(move)window.scrollTo({top:0,behavior:'auto'});
};
tabs.forEach((t,i)=>{t.setAttribute('role','tab');t.setAttribute('aria-controls',t.dataset.tab);t.addEventListener('keydown',ev=>{let n;if(ev.key==='ArrowRight')n=(i+1)%tabs.length;else if(ev.key==='ArrowLeft')n=(i-1+tabs.length)%tabs.length;else if(ev.key==='Home')n=0;else if(ev.key==='End')n=tabs.length-1;else return;ev.preventDefault();tabs[n].focus();location.hash=tabs[n].getAttribute('href');});});
document.querySelector('[data-tabs]').setAttribute('role','tablist');
panels.forEach(p=>p.setAttribute('role','tabpanel'));
window.addEventListener('hashchange',()=>showRoute(true));
// All content is visible if JavaScript is unavailable. Hide inactive panels only after navigation is ready.
showRoute(false);document.documentElement.classList.add('js');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const stage=$('portrait-stage'), portrait=$('portrait-card'), motion=$('motion-toggle'), guide=$('guide-toggle');
let moving=false;
const resetPose=()=>{portrait.style.setProperty('--rx','0deg');portrait.style.setProperty('--ry','0deg');};
const syncMotion=()=>{if(reduced.matches)moving=false;stage.classList.toggle('motion',moving);motion.setAttribute('aria-pressed',String(moving));motion.textContent=reduced.matches?'Движение отключено настройками':moving?'Остановить движение':'Включить движение';motion.disabled=reduced.matches;if(!moving)resetPose();};
motion.addEventListener('click',()=>{moving=!moving;syncMotion();});
stage.addEventListener('pointermove',ev=>{if(!moving||reduced.matches)return;const b=portrait.getBoundingClientRect();const x=Math.max(-1,Math.min(1,(ev.clientX-b.left)/b.width*2-1)),y=Math.max(-1,Math.min(1,(ev.clientY-b.top)/b.height*2-1));portrait.style.setProperty('--rx',(-y*2.2)+'deg');portrait.style.setProperty('--ry',(x*2.2)+'deg');});
stage.addEventListener('pointerleave',resetPose);
if(reduced.addEventListener)reduced.addEventListener('change',syncMotion);
motion.hidden=false;syncMotion();

})();
// Local catalogue selection.
(() => { 'use strict';
 const $=id=>document.getElementById(id), picks=Array.from(document.querySelectorAll('[data-module-id]'));
 const refresh=()=>{const n=picks.filter(p=>p.checked).length; $('module-count').textContent=n?'Выбрано модулей: '+n+'. Состав и последовательность согласуем после диагностики.':'Модули пока не выбраны.';};
 picks.forEach(p=>p.addEventListener('change',refresh));
 $('module-audience').addEventListener('change',()=>{const a=$('module-audience').value;document.querySelectorAll('[data-module-audience]').forEach(x=>{x.hidden=a!=='all'&&x.dataset.moduleAudience!==a;});});
 $('module-clear').addEventListener('click',()=>{picks.forEach(p=>p.checked=false);refresh();});
})();
document.documentElement.classList.add('module-picker-ready');
