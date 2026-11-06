(() => {
  'use strict';
  const root = document.getElementById('growth-explorer');
  if (!root) return;
  const routes = {
    owner: {
      label: 'Для собственника',
      strategy: ['Стратегия и управляемость', 'Связать следующий этап компании с ролью владельца, системой контроля и работой команды.', 'Приоритеты собственника и план решений.', '#owners', 'Открыть программу собственника'],
      market: ['Стратегический маркетинг с ИИ', 'Разобрать рынок, клиента и продуктовый портфель, чтобы выбрать обоснованные направления роста.', 'Карта рынка и маркетинговые приоритеты.', '#programs/marketing', 'Посмотреть программу маркетинга'],
      economy: ['Экономика FMCG-бизнеса', 'Связать решения о продукте и продажах с бюджетом, ограничениями и экономикой компании.', 'Финансовая модель и контроль ключевых отклонений.', '#programs/management', 'Посмотреть программу управления'],
      team: ['Собственник и команда', 'Разделить решения владельца и CEO, определить ответственность и порядок контроля исполнения.', 'Роли, ответственность и ритм рабочих встреч.', '#owners/owner-tools', 'Посмотреть инструменты собственника']
    },
    leader: {
      label: 'Для руководителя и команды',
      strategy: ['Управление FMCG-бизнесом', 'Согласовать цели функций и перевести стратегию в управленческие решения на материале компании.', 'План действий и критерии контроля.', '#programs/management', 'Посмотреть программу управления'],
      market: ['Стратегический маркетинг с ИИ', 'Связать аналитику рынка, позиционирование и решения о портфеле с задачами бизнеса.', 'Аргументированные маркетинговые решения.', '#programs/marketing', 'Посмотреть программу маркетинга'],
      economy: ['Модули по задачам компании', 'Выбрать нужные блоки по экономике, бюджетированию и управлению без прохождения лишних тем.', 'Состав программы под конкретную задачу.', '#companies/module-picker', 'Подобрать модули'],
      team: ['Общие решения команды', 'Разобрать одну рабочую задачу вместе и договориться об инструментах, ответственности и применении.', 'Рабочая модель и согласованный план действий.', '#companies', 'Посмотреть форматы для компаний']
    },
    university: {
      label: 'Для университета',
      strategy: ['От разработки к применению', 'Выстроить последовательность от отбора разработки до проверки спроса и работы с индустриальным партнёром.', 'Маршрут трансфера с результатом каждого этапа.', '#universities/university-cycle', 'Открыть этапы трансфера'],
      market: ['Разработка и задача индустрии', 'Начать с потребности предприятия и проверить, кому и для чего нужна университетская разработка.', 'Основания для выбора проекта и партнёра.', '#universities', 'Посмотреть университетский маршрут'],
      economy: ['Модель коммерциализации', 'Сравнить форматы НИОКР, пилота, лицензирования и отдельной компании применительно к проекту.', 'Обоснованный формат взаимодействия.', '#universities/world-practices', 'Посмотреть модели трансфера'],
      team: ['Студенты и бизнес', 'Соединить задачи компаний со студенческими кейсами, сессиями и проектной работой.', 'Формат совместной работы и ожидаемый результат.', '#universities/university-students', 'Посмотреть работу со студентами']
    }
  };
  let role = 'owner', topic = 'strategy';
  const roleButtons = Array.from(root.querySelectorAll('[data-growth-role]'));
  const topicButtons = Array.from(root.querySelectorAll('[data-growth-topic]'));
  const set = (id, value) => { document.getElementById(id).textContent = value; };
  function render() {
    const r = routes[role][topic];
    set('growth-kicker', routes[role].label);
    set('growth-result-title', r[0]); set('growth-result-text', r[1]); set('growth-result-output', r[2]);
    const link = document.getElementById('growth-result-link'); link.setAttribute('href', r[3]); link.textContent = r[4];
    roleButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.growthRole === role)));
    topicButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.growthTopic === topic)));
    root.querySelectorAll('[data-growth-branch]').forEach(b => b.classList.toggle('is-active', b.dataset.growthBranch === topic));
  }
  roleButtons.forEach(b => b.addEventListener('click', () => { role = b.dataset.growthRole; render(); }));
  topicButtons.forEach(b => b.addEventListener('click', () => { topic = b.dataset.growthTopic; render(); }));
  render();
  root.querySelector('.growth-role').hidden = false;
  root.querySelector('.growth-choices').hidden = false;
  document.documentElement.classList.add('growth-ready');
})();
