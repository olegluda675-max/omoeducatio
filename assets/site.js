(() => {
'use strict';
const $ = id => document.getElementById(id);
const panels = Array.from(document.querySelectorAll('.panel'));
const tabs = Array.from(document.querySelectorAll('[data-tab]'));
const allowed = new Set(panels.map(p=>p.id));
let currentPage='home';
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
const printDetails=new Map();
window.addEventListener('beforeprint',()=>{if(printDetails.size)return;document.querySelectorAll('details').forEach(detail=>{printDetails.set(detail,detail.open===true);detail.open=true;});});
window.addEventListener('afterprint',()=>{printDetails.forEach((open,detail)=>{detail.open=open;});printDetails.clear();});
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const stage=$('portrait-stage'), portrait=$('portrait-card'), motion=$('motion-toggle'), guide=$('guide-toggle');
let moving=false;
const resetPose=()=>{portrait.style.setProperty('--rx','0deg');portrait.style.setProperty('--ry','0deg');};
const syncMotion=()=>{if(reduced.matches)moving=false;stage.classList.toggle('motion',moving);motion.setAttribute('aria-pressed',String(moving));motion.textContent=reduced.matches?'Движение отключено настройками':moving?'Остановить движение':'Включить движение';motion.disabled=reduced.matches;if(!moving)resetPose();};
motion.addEventListener('click',()=>{moving=!moving;syncMotion();});
stage.addEventListener('pointermove',ev=>{if(!moving||reduced.matches)return;const b=portrait.getBoundingClientRect();const x=Math.max(-1,Math.min(1,(ev.clientX-b.left)/b.width*2-1)),y=Math.max(-1,Math.min(1,(ev.clientY-b.top)/b.height*2-1));portrait.style.setProperty('--rx',(-y*2.2)+'deg');portrait.style.setProperty('--ry',(x*2.2)+'deg');});
stage.addEventListener('pointerleave',resetPose);
guide.addEventListener('click',()=>{const open=guide.getAttribute('aria-expanded')!=='true';guide.setAttribute('aria-expanded',String(open));$('guide').hidden=!open;guide.textContent=open?'Закрыть подсказку −':'Помочь выбрать маршрут +';});
if(reduced.addEventListener)reduced.addEventListener('change',syncMotion);
guide.hidden=false;motion.hidden=false;syncMotion();

const form=$('brief'), fields=$('brief-fields'), draft=$('draft'), status=$('brief-status');
const copy=$('copy'),download=$('download'),mail=$('mail'),eml=$('eml');
// Public recipient confirmed by the site owner on 2026-10-07. No delivery service is used.
const BRIEF_RECIPIENT='education@omelchenckooleq.ru';
const field=name=>form.querySelector('[name="'+name+'"]');
const controls=Array.from(form.querySelectorAll('input, select, textarea')).filter(el=>el.name);
const steps=Array.from(form.querySelectorAll('[data-step]'));
const stepLinks=Array.from(form.querySelectorAll('[data-step-link]'));
const branchFields=Array.from(form.querySelectorAll('[data-branch]'));
const topicNames=Object.freeze({marketing:'Стратегический маркетинг',sales:'Управление продажами и коммерческой службой',management:'Управление FMCG-бизнесом',owner:'Программа собственника',team:'Корпоративная программа',talent:'Кейс-сессия / хакатон со студентами',university:'Трансфер технологий университета',strategy:'Стратегия и реализация',budgeting:'Бюджетирование',other:'Помогите определить формат'});
const roles=Object.freeze({owner:'Собственник / основатель',top:'CEO / топ-менеджмент',marketing:'Руководитель маркетинга',sales:'Руководитель продаж / коммерческой службы',hr:'HR / L&D / организатор обучения',university:'Представитель университета'});
const roleHints=Object.freeze({owner:'Сфокусируемся на целях владельца, следующем этапе бизнеса и управляемости.',top:'Сфокусируемся на решениях топ-команды, согласовании функций и исполнении.',marketing:'Сфокусируемся на выборе рынка, клиента, предложения и источников роста.',sales:'Сфокусируемся на коммерческой системе, каналах, клиентах и работе команды.',hr:'Свяжем запрос на обучение с задачей заказчика и ролями участников.',university:'Определим точку входа: разработка, потребность индустрии или система трансфера.'});
let currentStep=0,maxStep=0,revision=0,attempt=0,ready=false;
const clean=v=>typeof v==='string'?v.trim():'';
const value=n=>clean(field(n).value);
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const invalidate=()=>{revision++;attempt++;ready=false;draft.value='';$('recommendation').textContent='';[copy,download,mail,eml].forEach(b=>b.disabled=true);status.textContent='';controls.forEach(el=>{el.setCustomValidity('');el.removeAttribute('aria-invalid');});};
const syncBranches=()=>{
 const r=value('role'),t=value('topic');
 const uni=t==='university'||r==='university'&&t!=='talent';
 const active={owner:r==='owner'&&!uni,top:r==='top'&&!uni,marketing:r==='marketing'&&!uni,sales:r==='sales'&&!uni,hr:r==='hr'&&!uni,university:uni,talent:t==='talent',industryOther:value('industry')==='Другая',delegation:r==='owner'&&!uni&&value('ownerPriority')==='delegation',mixed:value('level')==='mixed',ownData:['own','anonymous'].includes(value('practice'))};
 branchFields.forEach(group=>{const on=active[group.dataset.branch]===true;group.hidden=!on;group.querySelectorAll('input, select, textarea').forEach(el=>{el.disabled=!on;el.required=on&&el.dataset.required==='true';if(!on){el.setCustomValidity('');el.removeAttribute('aria-invalid');}});});
 $('role-hint').textContent=t==='talent'?'Соединим бизнес-кейс, работу студенческих команд и критерии отбора на стажировку или работу.':uni?roleHints.university:roleHints[r]||'Уточним задачу и рабочий результат.';
 $('privacy-hint').textContent=value('privacy')==='nda'?'Для обсуждения до NDA оставьте только неконфиденциальное описание. Соглашение и границы раскрытия нужно согласовать до передачи закрытых данных.':value('privacy')==='anonymous'?'Опишите кейс без названий контрагентов, персональных данных и коммерческих секретов. На этом шаге сами файлы и цифры не нужны.':'Для первого разговора достаточно общего контекста. Не включайте коммерческие секреты, сведения о здоровье, персональные данные сотрудников и студентов.';
};
const showStep=(index,focus=true)=>{
 currentStep=Math.max(0,Math.min(4,index));
 steps.forEach((step,i)=>{step.hidden=i!==currentStep;});
 stepLinks.forEach((link,i)=>{link.disabled=i>maxStep||i===4&&!ready;if(i===currentStep)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');});
 $('previous').hidden=currentStep===0;$('next').hidden=currentStep===4;$('next').textContent=currentStep===3?'Собрать бриф →':'Далее →';
 $('brief-progress').value=currentStep+1;$('brief-progress').textContent=(currentStep+1)+' из 5';
 if(focus)steps[currentStep].querySelector('.wizard-heading').focus({preventScroll:false});
};
const validateStep=index=>{
 const inputs=Array.from(steps[index].querySelectorAll('input, select, textarea')).filter(el=>!el.disabled);
 for(const el of inputs){
  el.setCustomValidity('');el.removeAttribute('aria-invalid');
  if(el.required&&!clean(el.value))el.setCustomValidity('Заполните это поле.');
  if(el.tagName==='SELECT'&&el.required&&!Array.from(el.options).some(o=>o.value===el.value&&o.value!==''))el.setCustomValidity('Выберите вариант из списка.');
  if(el.name==='participants'&&(!/^\d+$/.test(el.value)||Number(el.value)<1||Number(el.value)>10000))el.setCustomValidity('Укажите целое число участников от 1 до 10 000.');
  if(!el.checkValidity()){showStep(index,false);el.setAttribute('aria-invalid','true');status.textContent='Проверьте поле «'+el.dataset.label+'».';el.reportValidity();el.focus();return false;}
 }
 return true;
};
const collect=()=>{
 const raw={},lines=[];
 controls.filter(el=>!el.disabled).forEach(el=>{const v=clean(el.value);if(!v)return;raw[el.name]=v;const selected=el.tagName==='SELECT'?Array.from(el.options).find(o=>o.value===v):null;lines.push([el.dataset.label,selected?selected.textContent:v]);});
 return {raw,lines};
};
const recommend=data=>{
 const t=data.topic,r=data.role,uni=t==='university'||r==='university'&&t!=='talent';
 let track,outcome;
 if(uni){track='Диагностика и развитие трансфера технологий';outcome=data.entry==='technology'?'Карточка разработки, гипотеза применения и план проверки спроса':data.entry==='demand'?'Профиль запроса индустрии, критерии решения и маршрут поиска компетенций':'Карта ролей, технологического портфеля и процесса работы с бизнесом';}
 else if(t==='talent'){track='Кейс-сессия / хакатон со студенческими командами';outcome='Бриф кейса, критерии оценки решений и компетенций, формат защиты и следующий шаг для кандидатов';}
 else if(t==='strategy'){track='Стратегия и реализация';outcome='Стратегический выбор, портфель инициатив и дорожная карта';}
 else if(t==='budgeting'){track='Бюджетирование и управленческая экономика';outcome='Логика бюджетов, ключевые драйверы и порядок план-факт анализа';}
 else if(t==='owner'||r==='owner'){track='Собственник: стратегия и управляемость';outcome='Повестка собственника, критерии выбора, модель делегирования и дорожная карта';}
 else if(t==='sales'||r==='sales'){track='Управление продажами и коммерческой службой';outcome='Карта коммерческой системы, приоритеты каналов и клиентов, показатели и план развития команды';}
 else if(t==='marketing'||r==='marketing'){track='Стратегический маркетинг';outcome='Карта маркетинговых решений, приоритеты роста и план проверки гипотез';}
 else{track='Управление FMCG-бизнесом и согласование команды';outcome='Карта ограничений, общие показатели функций и план применения решений';}
 const depth={basic:'Базовые инструменты, общий язык и учебные упражнения',applied:'Прикладные модули с разбором решений и практической работой',advanced:'Продвинутые проектные разборы, сценарии и проверка допущений',mixed:'Входная диагностика, выравнивание базы и задания разной сложности'};
 const material={own:'Работа на задаче компании; состав данных согласуется отдельно',anonymous:'Работа на обезличенном кейсе компании',case:'Работа на учебных кейсах и перенос инструмента в свою практику',diagnostic:'Начать с диагностики запроса и доступных данных'};
 const preparation=uni?'Неконфиденциальное описание разработки или запроса бизнеса и ответственный за проект':t==='talent'?'Неконфиденциальный кейс, желаемые компетенции кандидатов и эксперт со стороны компании':'Краткое описание бизнеса, участников и решения; перечень доступных инструментов и данных';
 return 'ПРЕДВАРИТЕЛЬНЫЙ МАРШРУТ ДЛЯ ОБСУЖДЕНИЯ\n'+track+'\n\nРабочий результат: '+outcome+'.\nГлубина: '+(depth[data.level]||'Уточняется после диагностики')+'.\nПрактика: '+(material[data.practice]||'Уточняется')+'.\nПодготовка к разговору: '+preparation+'.'+(data.privacy==='nda'?'\nДо раскрытия закрытых данных: согласовать NDA и границы использования информации.':'')+'\n\nМаршрут сформирован по вашим ответам. Объём, календарь и стоимость уточняются с Олегом.';
};
const makeBrief=data=>['Здравствуйте, Олег Михайлович.','Прошу обсудить задачу и подходящий формат работы.','',...data.lines.map(([label,v])=>label+': '+v),'',recommend(data.raw)].join('\n');
const generate=()=>{
 syncBranches();for(let i=0;i<4;i++)if(!validateStep(i))return false;
 const data=collect();draft.value=makeBrief(data);$('recommendation').textContent=recommend(data.raw);ready=true;maxStep=4;
 copy.disabled=false;download.disabled=false;mail.disabled=!BRIEF_RECIPIENT;eml.disabled=false;
 showStep(4);status.textContent='Бриф подготовлен. Проверьте текст и выберите способ передачи.';return true;
};
form.addEventListener('submit',ev=>{ev.preventDefault();if(currentStep<4)$('next').click();});
$('next').addEventListener('click',()=>{syncBranches();if(!validateStep(currentStep))return;if(currentStep===3){generate();return;}maxStep=Math.max(maxStep,currentStep+1);status.textContent='';showStep(currentStep+1);});
$('previous').addEventListener('click',()=>{status.textContent='';showStep(currentStep-1);});
stepLinks.forEach((button,i)=>button.addEventListener('click',()=>{if(!button.disabled){status.textContent='';showStep(i);}}));
const edited=()=>{invalidate();syncBranches();if(currentStep===4)showStep(3);else showStep(currentStep,false);};
form.addEventListener('input',edited);form.addEventListener('change',edited);
form.addEventListener('reset',()=>{invalidate();maxStep=0;setTimeout(()=>{syncBranches();showStep(0);status.textContent='Ответы очищены.';},0);});
copy.addEventListener('click',async()=>{
 if(!ready||!draft.value.trim())return;const text=draft.value,rev=revision,job=++attempt;
 const current=()=>ready&&rev===revision&&job===attempt&&draft.value===text;
 let ok=false;try{if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){await navigator.clipboard.writeText(text);ok=true;}}catch(_){}
 if(!current())return;
 if(!ok){try{draft.focus();draft.select();ok=document.execCommand('copy')===true;}catch(_){ok=false;}}
 if(!current())return;status.textContent=ok?'Текст скопирован.':'Автоматическое копирование недоступно. Выделите текст и скопируйте вручную.';
});
const save=(contents,mime,name)=>{
 let url;try{url=URL.createObjectURL(new Blob([contents],{type:mime}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();status.textContent='Файл подготовлен. Проверьте сохранение в браузере.';setTimeout(()=>URL.revokeObjectURL(url),1000);return true;}catch(_){if(url)URL.revokeObjectURL(url);status.textContent='Не удалось подготовить файл. Скопируйте текст вручную.';return false;}
};
download.addEventListener('click',()=>{if(ready&&draft.value.trim())save('\uFEFF'+draft.value,'text/plain;charset=utf-8','Бриф_Олегу_Омельченко.txt');});
const utf8base64=text=>{const bytes=new TextEncoder().encode(text);let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary);};
const subject=()=>('Бриф: '+value('company')).replace(/[\r\n]/g,' ').slice(0,160);
const encodeSubject=text=>{const parts=[''];for(const ch of Array.from(text)){if(new TextEncoder().encode(parts[parts.length-1]+ch).length>42)parts.push('');parts[parts.length-1]+=ch;}return parts.map(part=>'=?UTF-8?B?'+utf8base64(part)+'?=').join('\r\n ');};
const makeEml=()=>{
 const body=utf8base64(draft.value.replace(/\r?\n/g,'\r\n')).match(/.{1,76}/g).join('\r\n');
 return ['X-Unsent: 1',...(BRIEF_RECIPIENT?['To: '+BRIEF_RECIPIENT]:[]),'Subject: '+encodeSubject(subject()),'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',''+body,''].join('\r\n');
};
eml.addEventListener('click',()=>{if(!ready||!draft.value.trim())return;if(!save(makeEml(),'message/rfc822','Бриф_Олегу_Омельченко.eml'))return;status.textContent=BRIEF_RECIPIENT?'Черновик письма подготовлен. Откройте его в почтовом приложении, проверьте и отправьте.':'Черновик подготовлен без адреса получателя. Уточните email Олега и добавьте его перед отправкой.';});
mail.addEventListener('click',()=>{
 if(!ready||!BRIEF_RECIPIENT||!draft.value.trim())return;
 const href='mailto:'+BRIEF_RECIPIENT+'?subject='+encodeURIComponent(subject())+'&body='+encodeURIComponent(draft.value);
 if(href.length>1900){status.textContent='Бриф слишком длинный для надёжного открытия через почтовую ссылку. Скачайте письмо .eml или скопируйте полный текст.';return;}
 const a=document.createElement('a');a.href=href;document.body.appendChild(a);a.click();a.remove();status.textContent='Запрошено открытие почтового приложения. Проверьте текст и нажмите «Отправить» в почте. Если письмо не открылось, используйте .eml или копирование.';
});
document.querySelectorAll('[data-topic]').forEach(a=>a.addEventListener('click',()=>{
 const t=a.dataset.topic;if(!own(topicNames,t))return;field('topic').value=t;
 if(t==='owner')field('role').value='owner';else if(t==='university')field('role').value='university';else if(!value('role')&&t==='marketing')field('role').value='marketing';else if(!value('role')&&t==='sales')field('role').value='sales';
 invalidate();syncBranches();maxStep=0;showStep(0,false);
}));
$('recipient-note').textContent=BRIEF_RECIPIENT?'Получатель: '+BRIEF_RECIPIENT:'Email получателя уточняется. Можно сохранить бриф, скопировать его или связаться с Олегом в Telegram.';
invalidate();fields.disabled=false;syncBranches();showStep(0,false);form.hidden=false;$('brief-pending').hidden=true;

})();
// RC7: local module selector. Choices never leave this browser.
(() => { 'use strict';
 const $=id=>document.getElementById(id), picks=Array.from(document.querySelectorAll('[data-module-id]'));
 const refresh=()=>{const n=picks.filter(p=>p.checked).length; $('module-count').textContent=n?'Выбрано модулей: '+n+'. Состав и последовательность согласуем после диагностики.':'Модули пока не выбраны.';};
 picks.forEach(p=>p.addEventListener('change',refresh));
 $('module-audience').addEventListener('change',()=>{const a=$('module-audience').value;document.querySelectorAll('[data-module-audience]').forEach(x=>{x.hidden=a!=='all'&&x.dataset.moduleAudience!==a;});});
 $('module-clear').addEventListener('click',()=>{picks.forEach(p=>p.checked=false);refresh();});
})();

// RC7 diagnostic schema: no network, no storage, no personal details before results.
const OMO_DIAGNOSTICS={"title": "С чего начать обучение", "intro": "Семь коротких вопросов помогут выбрать первые модули и рабочий результат. Контакты для просмотра результата не нужны. Это предварительный учебный маршрут по вашим ответам, а не оценка качества бизнеса или управленческое решение.", "questions": [{"id": "role", "title": "Для кого подбираем маршрут?", "type": "single", "required": true, "options": [{"id": "owner", "label": "Для себя как собственника"}, {"id": "manager", "label": "Для руководителя или команды"}]}, {"id": "priority", "title": "Какие задачи сейчас важнее?", "hint": "Выберите одну или две.", "type": "multi", "min": 1, "max": 2, "optionsByRole": {"owner": [{"id": "visibility", "label": "Быстро видеть отклонения и риски", "ownerWeights": {"O2": 3, "O3": 1}}, {"id": "delegation", "label": "Передать решения и сохранить контроль", "ownerWeights": {"O4": 3, "O1": 1}}, {"id": "operations", "label": "Согласовать продажи, производство и запасы", "ownerWeights": {"O5": 3, "O2": 1}}, {"id": "time", "label": "Освободить время от текущих вопросов", "ownerWeights": {"O6": 3, "O4": 1}}, {"id": "growth", "label": "Выбрать приоритеты роста и оценить экономику", "ownerWeights": {"O7": 3, "O1": 1}}, {"id": "ai", "label": "Применять ИИ в ежедневном управлении", "ownerWeights": {"O8": 3, "O3": 1}}], "manager": [{"id": "strategy", "label": "Усилить стратегию и выбор источников роста", "managerWeights": {"M1": 3, "M2": 1}}, {"id": "insights", "label": "Разобраться в покупателях и спросе", "managerWeights": {"M2": 3, "M3": 1}}, {"id": "portfolio", "label": "Принять решение по брендам и ассортименту", "managerWeights": {"M5": 3, "M6": 1}}, {"id": "price", "label": "Проверить цену, промо и каннибализацию", "managerWeights": {"M6": 3, "M7": 1}}, {"id": "media", "label": "Пересобрать коммуникации и медиаплан", "managerWeights": {"M4": 3, "M7": 1}}, {"id": "measurement", "label": "Проверить эффект и обоснованность аналитики", "managerWeights": {"M7": 3, "M3": 1}}, {"id": "team", "label": "Собрать общий стандарт стратегии в команде", "managerWeights": {"M9": 3, "M8": 1}}]}}, {"id": "practice", "title": "Как это устроено сейчас?", "type": "single", "required": true, "optionsByRole": {"owner": [{"id": "ad_hoc", "label": "Информация приходит по запросу, много срочных вопросов", "ownerWeights": {"O2": 2, "O3": 2}}, {"id": "reports", "label": "Отчёты есть, но неясно, какое решение требуется", "ownerWeights": {"O3": 2, "O2": 1}}, {"id": "centralized", "label": "Порядок есть, но решения часто ждут меня", "ownerWeights": {"O4": 2, "O6": 1}}, {"id": "stable", "label": "Регулярный цикл работает, нужен следующий уровень", "ownerWeights": {"O7": 1, "O1": 1}}, {"id": "unknown", "label": "Пока трудно определить"}], "manager": [{"id": "activities", "label": "Стратегия чаще выглядит как список активностей", "managerWeights": {"M1": 2, "M8": 1}}, {"id": "evidence", "label": "Решения есть, но не хватает доказательств", "managerWeights": {"M3": 2, "M7": 1}}, {"id": "standards", "label": "У участников разные подходы к стратегии", "managerWeights": {"M9": 2, "M1": 1}}, {"id": "advanced", "label": "Есть стратегия и аналитика, нужен сложный разбор", "managerWeights": {"M8": 1, "M7": 1}}, {"id": "unknown", "label": "Пока трудно определить"}]}}, {"id": "data", "title": "На каком материале сможете работать?", "type": "single", "required": true, "options": [{"id": "learning", "label": "Пока только на учебном кейсе", "ownerWeights": {"O2": 1}, "managerWeights": {"M3": 1}, "note": "Начните с учебного набора. Перенос решения на компанию потребует проверки её процессов и данных."}, {"id": "anonymized", "label": "Есть обезличенный кейс, данные нужно подготовить", "ownerWeights": {"O2": 1}, "managerWeights": {"M3": 1}, "note": "До практикума согласуйте состав данных, определения показателей и ограничения использования."}, {"id": "ready", "label": "Есть согласованные данные и ответственный", "note": "Можно готовить прикладной проект; доступность данных не заменяет проверку их качества."}, {"id": "unknown", "label": "Нужно сначала определить", "note": "Первый шаг: уточнить учебную задачу и минимальный набор данных. Закрытые файлы сейчас не нужны."}]}, {"id": "ai", "title": "Как команда использует ИИ?", "type": "single", "required": true, "options": [{"id": "new", "label": "Пока не использует", "ownerWeights": {"O8": 2}, "note": "Добавьте вводную практику: задача, разрешённые данные, проверка результата и ответственность человека."}, {"id": "occasional", "label": "Использует время от времени, общих правил нет", "ownerWeights": {"O8": 2}, "note": "Начните с правил данных и проверки ответов, затем выберите один ограниченный пилот."}, {"id": "governed", "label": "Есть разрешённые инструменты и проверка ответов", "note": "Уточните критерии качества и сравните пилот с текущим способом работы."}, {"id": "restricted", "label": "Внешние ИИ-сервисы ограничены или запрещены", "note": "Используйте учебные материалы, подготовленные результаты моделей или разрешённую среду. Не загружайте закрытые данные во внешние сервисы."}]}, {"id": "goal", "title": "Какой ближайший результат нужен?", "type": "single", "required": true, "options": [{"id": "one", "label": "Рабочая форма для одной задачи", "format": "focused"}, {"id": "personal", "label": "Последовательно изменить свою практику управления", "format": "owner"}, {"id": "team", "label": "Согласовать правила и решения в команде", "format": "team"}, {"id": "project", "label": "Пройти весь цикл и защитить проект", "format": "advanced"}]}, {"id": "format", "title": "Какой ритм вам удобнее?", "type": "single", "required": true, "options": [{"id": "short", "label": "Короткие встречи с работой между ними"}, {"id": "days", "label": "Несколько полных учебных дней"}, {"id": "online", "label": "Онлайн или смешанный формат"}, {"id": "unknown", "label": "Определим после обсуждения"}]}], "rules": {"scope": "Учебная маршрутизация на основе выбранных ответов. Не психологический тест, не диагностика стадии по Адизесу и не измерение зрелости бизнеса.", "algorithm": ["Начальные баллы всех модулей выбранного маршрута равны нулю.", "Сложить ownerWeights либо managerWeights для всех выбранных ответов. Ответ «Пока трудно определить» не добавляет баллов и не трактуется как недостаток.", "Отсортировать модули по сумме убыванию; при равенстве выше модуль с большим вкладом вопроса priority; затем по числу в ID.", "Показать три первых модуля с ненулевыми баллами. Если их меньше трёх, показать меньше, не дополнять произвольными.", "Для каждого модуля показать конкретный ответ, из-за которого он предложен, затем результат и ИИ-практику. Баллы пользователю не выдавать за валидированную оценку.", "Выбор формата и цели не меняет оценку модулей. Он влияет только на организационную рекомендацию.", "Если role=manager и goal=personal, рекомендовать индивидуальную работу руководителя над маркетинговым проектом; не показывать название «маршрут собственника».", "Если role=owner и goal=project, рекомендовать модульную программу с защитой управленческого проекта; не назначать автоматически 28-часовую маркетинговую программу.", "Если goal=one, рекомендовать точечную сессию по первому модулю; остальные показывать как возможное продолжение. Если format=short или online, предложить модульный календарь; не обещать конкретное число часов.", "Выбор «Внешние ИИ-сервисы ограничены» не снижает результат и не блокирует обучение.", "Всегда дать возможность открыть полный каталог и изменить ответы. При смене роли очистить только несовместимые ответы priority и practice."], "output": ["Ваш предварительный маршрут", "Почему предложены эти модули", "Что подготовите на практике", "Как будет использоваться ИИ", "Подходящий формат для обсуждения", "Что уточнить до начала"], "disclaimer": "Результат сформирован по открытым правилам на этой странице. Он помогает обсудить обучение и не заменяет диагностику компании, профессиональную экспертизу или решения руководителя."}, "privacy": {"contactBeforeResult": false, "automaticTransmission": false, "noUploads": true, "warning": "Не вводите коммерческие секреты, закрытые финансовые показатели, персональные данные сотрудников, пароли или ключи доступа.", "optionalHandoff": "По желанию перенесите результат в бриф. Для ответа достаточно имени и email либо выбранного вами канала связи. Название компании и численность команды можно уточнить позднее.", "implementation": "Не передавать ответы в аналитику, URL, сторонний ИИ или сетевой запрос. Если хранение не реализовано, честно указать, что ответы пропадут после обновления. Копирование и скачивание выполняются только по действию посетителя."}};
const OMO_PROGRAMS={"version": "2026-10-08", "status": "Авторский проект содержания для частного RC7, организационные условия согласуются с Олегом", "headings": {"owner": "Собственнику производственного бизнеса", "ownerIntro": "Настройте понятную систему управления: что видеть каждый день, какие вопросы задавать руководителям и какие решения оставлять за собой. На выходе обучения будут рабочие формы контроля, календарь управления и проверенный сценарий применения ИИ.", "manager": "Руководителям и маркетинговым командам", "managerIntro": "Продвинутая работа со стратегией, портфелем, ценой, коммуникациями и аналитикой. Каждый участник проходит путь от диагноза до защищённого решения на задаче своей компании или учебном кейсе."}, "ownerModules": [{"id": "O1", "title": "Роль собственника и следующий этап компании", "learn": "Разбираем, какие решения остаются у владельца, какие принимает генеральный директор и где полномочия расходятся с ответственностью. Определяем ограничения роста и договариваемся о работе управленческой команды.", "artifact": "Карта решений собственника, руководителя и команды; список трёх ограничений роста.", "ai": "ИИ помогает сравнить описания ролей, найти пересечения и подготовить вопросы для обсуждения. Решения о полномочиях принимает владелец.", "outcome": "Сможете отделить стратегические вопросы от оперативных и задать границы самостоятельности команды."}, {"id": "O2", "title": "Ежедневная панель собственника", "learn": "Собираем один экран с отклонениями по клиентским обязательствам, выпуску, качеству, запасам и денежным рискам. Для каждого показателя определяем источник, срок обновления, владельца и условие вмешательства.", "artifact": "Прототип панели из 6–8 индикаторов, паспорта показателей и правила эскалации.", "ai": "ИИ составляет краткую сводку по подготовленной выгрузке, отмечает пропуски и противоречия. Расчёты и первичные данные проверяет ответственный.", "outcome": "Сможете за короткий просмотр понять, какое отклонение требует вашего решения, а какое уже ведёт команда."}, {"id": "O3", "title": "Что запрашивать у руководителей", "learn": "Вводим отчёт по отклонениям: факт, сравнение с планом, причина, действие, ответственный, срок и требуемое решение. Разделяем ежедневные сигналы, недельный разбор и месячную экономику.", "artifact": "Три шаблона отчётности и единый журнал решений с контрольными датами.", "ai": "ИИ приводит отчёты к единому формату и выделяет неподтверждённые объяснения. Причина считается гипотезой до проверки.", "outcome": "Сможете запрашивать информацию, необходимую для решения, и проверять исполнение без лишних совещаний."}, {"id": "O4", "title": "Контроль и делегирование без микроменеджмента", "learn": "Согласуем ожидаемый результат, полномочия, ограничения и контрольные точки. Задаём условия, при которых руководитель обращается к собственнику, и разбираем срыв обязательств без подмены исполнителя.", "artifact": "Карточка делегирования, матрица полномочий и форма контрольной встречи.", "ai": "ИИ проверяет полноту поручения и готовит вопросы к контрольной точке. Он не оценивает сотрудников и не принимает кадровых решений.", "outcome": "Сможете контролировать результат и риски, сохраняя самостоятельность руководителей."}, {"id": "O5", "title": "Продажи, производство и запасы", "learn": "Согласуем коммерческий прогноз, возможности производства и ограничения снабжения. Учимся разбирать дефицит, избыток запасов, просроченные заказы и узкое место в едином цикле планирования.", "artifact": "Повестка межфункциональной встречи, карта ограничений и два сценария плана.", "ai": "ИИ собирает вопросы к расхождениям планов и объясняет подготовленные прогнозные сценарии. Производственный план утверждают ответственные специалисты.", "outcome": "Сможете видеть последствия коммерческих решений для загрузки, сервиса и оборотного капитала."}, {"id": "O6", "title": "Время собственника и ритм управления", "learn": "Разбираем календарь и типовые обращения к владельцу. Защищаем время для стратегии, сокращаем дублирующие встречи и создаём понятный порядок срочных вопросов.", "artifact": "Недельный календарь собственника, правила встреч и список решений для передачи команде.", "ai": "ИИ группирует обезличенные категории задач и предлагает варианты повестки. Личные и чувствительные сведения в учебный анализ не включаются.", "outcome": "Сможете связать календарь с приоритетами бизнеса и проверить, что делегирование действительно освобождает время."}, {"id": "O7", "title": "Экономика решений и приоритеты роста", "learn": "Связываем продажи с маржой, запасами и денежным потоком. Сравниваем инициативы по эффекту, ресурсам, рискам и условиям остановки. Определяем, что компания будет делать в ближайшие 90 дней.", "artifact": "Карта инициатив, сценарный расчёт на учебных данных и план первых 90 дней.", "ai": "ИИ помогает выявлять допущения и готовить альтернативные сценарии. Финансовый расчёт проверяется отдельно; инвестиционное решение остаётся у собственника.", "outcome": "Сможете обсуждать рост через экономику и ограничения, а не только через объём продаж."}, {"id": "O8", "title": "Практический ИИ в управлении", "learn": "Выбираем одну повторяющуюся задачу: сводка отчётов, протокол решений, анализ обращений или подготовка сценариев. Настраиваем входные данные, проверку результата и границы доступа.", "artifact": "Паспорт ИИ-пилота, шаблон запроса, проверочный набор и правила остановки.", "ai": "Сравниваем ручное выполнение и работу с ИИ по времени, ошибкам и полноте. Масштабирование допускается после проверки пилота.", "outcome": "Сможете поставить ИИ понятную задачу, проверить ответ и определить, где его применение оправдано."}], "managerModules": [{"id": "M1", "title": "Качество стратегического выбора", "learn": "Проверяем диагноз, осознанный выбор, механизм роста, ограничения и согласованность действий. Разбираем текущий проект по единой рубрике.", "artifact": "Первичная оценка стратегии и перечень решений для пересмотра.", "ai": "ИИ ищет разрывы в аргументации и предлагает альтернативные объяснения; участник проверяет их по источникам.", "hours": 2}, {"id": "M2", "title": "Категория, покупатель и источники роста", "learn": "Сопоставляем потребительские задачи, ситуации входа в категорию, проникновение, частоту и ценность покупки. Проверяем две приоритетные гипотезы.", "artifact": "Карта источников роста и план проверки двух гипотез.", "ai": "ИИ группирует разрешённые отзывы и интервью со ссылкой на исходный фрагмент. Синтетический потребитель не подтверждает спрос.", "hours": 2}, {"id": "M3", "title": "Диагностика и прогноз спроса", "learn": "Сравниваем простой сезонный прогноз и подготовленные результаты ML-модели на отложенном по времени периоде. Разбираем смещение, промо, отсутствие товара и утечку данных.", "artifact": "Доказательный диагноз и паспорт аналитической задачи.", "ai": "Практикум по интерпретации модели: где она полезна, где ошибается и когда нужен простой прогноз.", "hours": 4}, {"id": "M4", "title": "Коммуникации и медиасценарии", "learn": "Связываем задачу бренда с аудиторией, креативом, охватом, частотой и результатом. Готовим сценарий замены подорожавшего или недоступного канала.", "artifact": "Медиапортфель и правила пересмотра распределения ресурсов.", "ai": "ИИ помогает подготовить варианты креативного брифа и проверить согласованность сообщений. Факты, права и требования к размещению проверяют специалисты.", "hours": 2}, {"id": "M5", "title": "Архитектура брендов и расширение портфеля", "learn": "Определяем роли брендов, границы расширения и критерии отдельного запуска. Проверяем потребительскую логику, дистрибуцию и экономику предложения.", "artifact": "Карта ролей брендов и критерии решения по расширению.", "ai": "ИИ структурирует аргументы за и против запуска. Выводы опираются на реальные исследования и согласованные данные.", "hours": 2}, {"id": "M6", "title": "Цена, промо и прибыль портфеля", "learn": "Сопоставляем цену за единицу, упаковку и ценность. Считаем сценарии с учётом перетока между собственными SKU и ограничений оценки эластичности.", "artifact": "Ценностно-ценовая карта, сценарий портфеля и проверка каннибализации.", "ai": "Работаем с подготовленными модельными сценариями. Коэффициент прогнозной модели сам по себе не доказывает причинный эффект цены.", "hours": 4}, {"id": "M7", "title": "Измерение и причинные эффекты", "learn": "Связываем 5–7 KPI с механизмом роста. Сопоставляем контрольный эксперимент, маркетинг-микс-моделирование и платформенную атрибуцию.", "artifact": "План измерения, дизайн теста и критерии масштабирования.", "ai": "ИИ проверяет полноту плана эксперимента. Платформенный ROAS не заменяет оценку дополнительного эффекта.", "hours": 3}, {"id": "M8", "title": "Сборка стратегии и проверка рисков", "learn": "Собираем стратегию на одной странице, доказательное приложение и план первых 90 дней. Заранее разбираем причины возможного провала.", "artifact": "Проект стратегии, реестр допущений и условия пересмотра.", "ai": "ИИ выступает оппонентом: ищет противоречия и предлагает неблагоприятные сценарии. Ответственность за выбор остаётся у команды.", "hours": 3}, {"id": "M9", "title": "Единый стандарт команды и защита", "learn": "Согласуем структуру стратегии, требования к доказательствам и правила оценки. Участники защищают доработанные проекты и получают следующий шаг.", "artifact": "Общий шаблон стратегии, оценочная рубрика и индивидуальный план доработки.", "ai": "ИИ помогает подготовиться к вопросам и проверить комплектность материалов. Итоговую оценку дают ведущий и уполномоченные руководители.", "hours": 2}], "formats": [{"id": "focused", "title": "Разбор одной задачи", "text": "Короткая рабочая сессия по конкретному решению. Выбираем один инструмент и собираем его первый вариант. Это точечный формат, его объём определяется задачей."}, {"id": "owner", "title": "Индивидуальный маршрут собственника", "text": "Последовательность рабочих встреч с применением форм в своём бизнесе между занятиями. Начинаем с панели, отчётности или делегирования и проверяем результат на следующей встрече."}, {"id": "team", "title": "Собственник и управленческая команда", "text": "Общие правила отчётности, полномочий и согласования планов. Команда работает над одной задачей предприятия и проверяет договорённости в реальном управленческом цикле."}, {"id": "advanced", "title": "Продвинутая маркетинговая программа", "text": "Возможная конфигурация: три учебных дня по 8 академических часов и защита на 4 академических часа через 4–6 недель. Итого 28 академических часов, или 21 обычный час без перерывов. Подготовка и самостоятельная доработка учитываются отдельно. Размер группы и объём защиты согласуются."}, {"id": "modular", "title": "Модульная программа", "text": "Те же задачи распределяем по более коротким очным или онлайн-встречам. Между занятиями участники собирают данные, уточняют решения и применяют формы. Календарь и нагрузка зависят от состава группы."}], "boundaries": ["Это независимые авторские программы Олега Омельченко. Упоминание внешних подходов и программ не означает партнёрство, аккредитацию или сертификацию их правообладателями.", "Стоимость, календарь, состав программы и документ по итогам согласуются после обсуждения задачи. Формат ДПО требует отдельного согласования с уполномоченной образовательной организацией.", "ИИ помогает готовить материалы и проверять гипотезы. Управленческие, кадровые, ценовые, инвестиционные и производственные решения принимают уполномоченные люди.", "Для практики достаточно учебных или согласованных обезличенных данных. Закрытые материалы не передаются внешним ИИ-сервисам без отдельного разрешения компании."]};

function omoCalculate(answers,selectedModules=[]){
 const D=OMO_DIAGNOSTICS,P=OMO_PROGRAMS,role=answers.role,ms=role==='owner'?P.ownerModules:P.managerModules,scores={},priority={},reasons={};
 ms.forEach(m=>{scores[m.id]=0;priority[m.id]=0;reasons[m.id]=[];});
 const chosen={};
 D.questions.forEach(q=>{const options=q.optionsByRole?q.optionsByRole[role]:q.options;if(!options)return;const ids=Array.isArray(answers[q.id])?answers[q.id]:[answers[q.id]];chosen[q.id]=options.filter(o=>ids.includes(o.id));chosen[q.id].forEach(o=>Object.entries(o[role+'Weights']||{}).forEach(([id,w])=>{if(!(id in scores))return;scores[id]+=w;if(q.id==='priority')priority[id]+=w;reasons[id].push(o.label);}));});
 const ranked=ms.filter(m=>scores[m.id]>0).sort((a,b)=>scores[b.id]-scores[a.id]||priority[b.id]-priority[a.id]||Number(a.id.slice(1))-Number(b.id.slice(1))).slice(0,3);
 let format=(P.formats.find(f=>f.id===((chosen.goal||[])[0]||{}).format)||{}).title||'Формат уточним';
 if(role==='manager'&&answers.goal==='personal')format='Индивидуальная работа руководителя над маркетинговым проектом';
 if(role==='owner'&&answers.goal==='project')format='Модульная программа с защитой управленческого проекта';
 let text='КАРТА УЧЕБНОГО МАРШРУТА\n'+(role==='owner'?'Для собственника':'Для руководителя или команды')+'\n\n';
 text+='ПЕРВЫЕ МОДУЛИ\n'+ranked.map((m,i)=>(i+1)+'. '+m.id+' · '+m.title+'\nПочему: '+reasons[m.id].join('; ')+'.\nНа практике: '+m.artifact+'\nИИ: '+m.ai).join('\n\n');
 if(answers.goal==='one')text+='\n\nНачните с точечной сессии по первому модулю. Остальные могут стать продолжением.';
 text+='\n\nФОРМАТ ДЛЯ ОБСУЖДЕНИЯ\n'+format+'.';
 if(['short','online'].includes(answers.format))text+=' Модульный календарь; продолжительность согласуем по задаче.';
 text+='\nУдобный ритм: '+((chosen.format||[])[0]||{}).label+'.';
 const notes=[...(chosen.data||[]),...(chosen.ai||[])].filter(x=>x.note).map(x=>x.note);
 text+='\n\nДО НАЧАЛА\n'+notes.join('\n');
 const picked=[...P.ownerModules,...P.managerModules].filter(m=>selectedModules.includes(m.id));
 if(picked.length)text+='\n\nВАШ ВЫБОР ИЗ КАТАЛОГА\n'+picked.map(m=>m.id+' · '+m.title).join('\n')+'\nРучной выбор сохранён отдельно от рекомендаций; итоговую последовательность согласуем.';
 text+='\n\nОТВЕТЫ\n'+D.questions.map(q=>q.title+' '+(chosen[q.id]||[]).map(o=>o.label).join('; ')).join('\n');
 text+='\n\n'+D.rules.disclaimer+'\n\nОтправка с сайта не подключена. Эта карта никуда не отправлена.';
 return {text,modules:ranked.map(m=>m.id),scores,priority};
}
(() => { 'use strict';
 const $=id=>document.getElementById(id), fields=$('diagnostic-fields'), status=$('diag-status');let current='';
 const invalidate=()=>{current='';$('diag-card').textContent='';$('diag-result').hidden=true;$('diag-export').disabled=true;status.textContent='';};
 const role=()=>$('diag-role').value;
 const sync=()=>{document.querySelectorAll('[data-diag-role]').forEach(g=>{g.hidden=g.dataset.diagRole!==role();g.querySelectorAll('input,select').forEach(c=>c.disabled=g.hidden);});};
 $('diag-role').addEventListener('change',()=>{document.querySelectorAll('[data-priority]').forEach(c=>c.checked=false);['owner','manager'].forEach(r=>$('diag-practice-'+r).value='');sync();invalidate();});
 fields.addEventListener('change',invalidate);fields.addEventListener('input',invalidate);
 document.querySelectorAll('[data-module-id]').forEach(p=>p.addEventListener('change',invalidate));$('module-clear').addEventListener('click',invalidate);
 $('diag-generate').addEventListener('click',()=>{
  invalidate();const a={role:role()}, fail=(msg,el)=>{status.textContent=msg;el.focus();};
  if(!['owner','manager'].includes(a.role)){fail('Выберите, для кого подбираем маршрут.',$('diag-role'));return;}
  a.priority=Array.from(document.querySelectorAll('[data-priority]')).filter(p=>p.checked&&p.dataset.priorityRole===a.role).map(p=>p.dataset.priority);
  if(a.priority.length<1||a.priority.length>2){fail('Выберите одну или две приоритетные задачи.',document.querySelectorAll('[data-priority]')[a.role==='owner'?0:6]);return;}
  for(const q of OMO_DIAGNOSTICS.questions.filter(q=>!['role','priority'].includes(q.id))){const el=$('diag-'+q.id+(q.optionsByRole?'-'+a.role:''));a[q.id]=el.value;const ops=q.optionsByRole?q.optionsByRole[a.role]:q.options;if(!ops.some(o=>o.id===el.value)){fail('Ответьте на вопрос: '+q.title,el);return;}}
  const picks=Array.from(document.querySelectorAll('[data-module-id]')).filter(p=>p.checked).map(p=>p.dataset.moduleId);
  current=omoCalculate(a,picks).text;$('diag-card').textContent=current;$('diag-result').hidden=false;$('diag-export').disabled=false;$('diag-card').focus();status.textContent='Карта готова. Она остаётся в этой вкладке и не отправлена.';
 });
 $('diag-reset').addEventListener('click',()=>{fields.querySelectorAll('select').forEach(s=>s.value='');fields.querySelectorAll('input').forEach(c=>c.checked=false);sync();invalidate();status.textContent='Ответы диагностики очищены. Выбор модулей в каталоге сохранён.';});
 $('diag-export').addEventListener('click',()=>{if(!current)return;let url;try{url=URL.createObjectURL(new Blob(['\uFEFF'+current],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='OMO_learning_route.txt';document.body.appendChild(a);a.click();a.remove();status.textContent='Карта подготовлена для скачивания на устройство. На почту она не отправлена.';}catch(e){status.textContent='Скачивание недоступно. Можно выделить и скопировать текст карты вручную.';}finally{if(url)setTimeout(()=>URL.revokeObjectURL(url),1000);}});
 sync();
})();

// Optional orientation is isolated from diagnostics and uses no answer storage.
(() => {
'use strict';
const $ = id => document.getElementById(id);
const welcome=$('site-welcome'), card=$('site-tour'), restart=$('tour-restart');
if(!welcome || typeof welcome.showModal!=='function') return;
const key='omo-welcome-seen-v1';
let active=false, index=0, target=null, returnFocus=null, steps=[];
const routes={
 owner:[['owners','owner-dashboard','Панель собственника','Здесь видно отклонение от плана, ответственного и вопрос для решения. Каждый показатель раскрывает формулу.'],['companies','module-picker','Выберите нужные модули','Отметьте задачи вашей компании. Выбор предварительный, без записи и оплаты.'],['contact','diagnostics','Начните с управленческой задачи','Семь вопросов помогут наметить маршрут обучения. Результат можно скачать; отправка пока отключена.']],
 manager:[['programs','programs','Программа для руководителя','Изучите содержание и практические результаты. Выберите то, что соответствует вашей зоне ответственности.'],['companies','module-picker','Соберите программу команды','Сопоставьте модули с задачей и опытом участников. Это предварительный выбор.'],['owners','owner-dashboard','Договоритесь о формате отчёта','Панель связывает факт, причину и следующий шаг. Нажмите пояснение под показателем.'],['contact','diagnostics','Уточните задачу команды','Пройдите экспресс-карту и сохраните результат локально для обсуждения.']],
 university:[['universities','universities','Университетам: два входа в трансфер','Начните с разработки научной команды или задачи компании. Здесь описаны система трансфера технологий, модели сотрудничества и границы ответственности.'],['universities','university-cycle','От задачи до внедрения','Восемь этапов показывают вход, работу сторон, результат и условие перехода. Это маршрут проверки спроса, а не обещание покупателя или финансирования.'],['universities','university-students','Образование и связь с индустрией','Кейс-сессии, хакатоны и задачи компаний связывают учебную работу с практикой. Посмотрите отдельный маршрут для бизнеса.'],['contact','contact','Обсудим задачу университета','В брифе можно выбрать роль представителя университета и трансфер технологий. Для начала достаточно неконфиденциального описания задачи; отправка через сайт пока отключена.']],
 about:[['about','about-experience','Познакомимся: опыт и образование','Управленческая практика, преподавание в МИСИС и РЭУ им. Г.В. Плеханова, отраслевая работа в СФПП. MBA. Здесь же доступны ссылки на профессиональные профили.'],['about','about-approach','Почему этот подход может вам подойти','Если вам важно связать обучение с рабочей задачей: от фактов и альтернатив к модели решения, ответственным и проверке применения. Ниже представлены авторские подходы и примеры инструментов.'],['about','research-works','Академическая основа: что подтверждено','Кандидатская диссертация защищена в 2014 году; доступна ссылка на автореферат в РГБ. Монографии отмечены как рукописи в работе. Ниже можно перейти к опубликованной статье.'],['contact','contact','Сопоставим подход с вашей задачей','Выберите удобный способ связи или подготовьте бриф. Формат, содержание и условия обсуждаются после разбора запроса. Автоматическая отправка пока отключена.']]};
const mark=()=>{try{localStorage.setItem(key,'1');}catch(_){} };
const unmark=()=>{if(target)target.classList.remove('tour-target');target=null;};
const end=()=>{active=false;unmark();card.hidden=true;if(returnFocus && returnFocus!==document.body && !returnFocus.closest('[hidden]'))returnFocus.focus();else {const h=document.querySelector('.panel:not([hidden]) h1');if(h){h.tabIndex=-1;h.focus();}}};
const render=()=>{
 unmark(); const [page,id,title,description]=steps[index];
 const route='#'+page;
 if(location.hash!==route){location.hash=route;return;}
 target=$(id);if(!target){end();return;}
 // For a page target, frame its heading rather than wrapping the tour itself.
 if(target.classList.contains('panel'))target=target.querySelector('.pagehead')||target.querySelector('h1');
 if(!target){end();return;}
 target.parentNode.insertBefore(card,target);card.hidden=false;target.classList.add('tour-target');
 $('tour-title').textContent=title;$('tour-description').textContent=description;
 $('tour-progress').textContent='Шаг '+(index+1)+' из '+steps.length;
 $('tour-back').disabled=index===0;$('tour-next').textContent=index===steps.length-1?'Завершить':'Далее';
 card.focus({preventScroll:true});card.scrollIntoView({block:'start',behavior:'auto'});
};
const open=()=>{if(active)end();returnFocus=document.activeElement;welcome.showModal();$('tour-role').focus();};
restart.hidden=false;restart.addEventListener('click',open);
$('tour-dismiss').addEventListener('click',()=>{mark();welcome.close();});
welcome.addEventListener('cancel',()=>mark());
$('tour-start').addEventListener('click',()=>{mark();steps=routes[$('tour-role').value]||routes.owner;index=0;active=true;welcome.close();render();});
$('tour-back').addEventListener('click',()=>{if(index>0){index--;render();}});
$('tour-next').addEventListener('click',()=>{if(index===steps.length-1)end();else {index++;render();}});
$('tour-stop').addEventListener('click',end);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){e.preventDefault();end();}});
window.addEventListener('hashchange',()=>{if(!active)return;if(location.hash==='#'+steps[index][0])render();else end();});
let seen=false;try{seen=localStorage.getItem(key)==='1';}catch(_){}
if(!seen)open();
const dashboard=$('owner-dashboard');
if(dashboard && 'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){dashboard.classList.add('dashboard-visible');observer.disconnect();}},{threshold:.15});observer.observe(dashboard);}
})();

