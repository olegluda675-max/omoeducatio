(function () {
  'use strict';
  const query = document.getElementById('materials-query');
  const kind = document.getElementById('materials-kind');
  const reset = document.getElementById('materials-reset');
  const count = document.getElementById('materials-count');
  const empty = document.getElementById('materials-empty');
  const entries = Array.from(document.querySelectorAll('[data-material-id]'));
  if (!query || !kind || !reset || !count || !empty || !entries.length) return;
  const normalize = value => String(value).toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, ' ').trim();
  const searchable = entries.map(entry => ({
    element: entry,
    kind: entry.getAttribute('data-material-kind'),
    text: normalize(entry.textContent + ' ' + (entry.getAttribute('data-keywords') || ''))
  }));
  function apply() {
    const words = normalize(query.value).split(/\s+/).filter(Boolean);
    const selected = kind.value;
    let visible = 0;
    searchable.forEach(item => {
      const matches = (selected === 'all' || item.kind === selected) && words.every(word => item.text.includes(word));
      item.element.hidden = !matches;
      if (matches) visible += 1;
    });
    count.textContent = 'Найдено материалов: ' + visible + ' из ' + entries.length + '.';
    empty.hidden = visible !== 0;
  }
  query.addEventListener('input', apply);
  query.addEventListener('search', apply);
  kind.addEventListener('change', apply);
  reset.addEventListener('click', function () {
    query.value = '';
    kind.value = 'all';
    apply();
    query.focus();
  });
  query.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      query.value = '';
      apply();
    }
  });
  apply();
  query.disabled = false;
  kind.disabled = false;
  reset.disabled = false;
  document.documentElement.classList.add('materials-search-ready');
})();
