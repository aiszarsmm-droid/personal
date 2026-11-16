(function () {
  var doc = document.documentElement;
  doc.classList.add('js');

  /* ---------- Language switch ---------- */
  var META = {
    ru: {
      title: document.title,
      desc: document.querySelector('meta[name="description"]').content
    },
    en: {
      title: 'Aisylu Zaripova — international marketer and SMM specialist',
      desc: 'Portfolio of Aisylu Zaripova: 6+ years in SMM, brands from the USA, the UAE, Europe and the CIS. Cases, services, reviews and contacts.'
    }
  };
  var textNodes = document.querySelectorAll('[data-en]');
  var altNodes = document.querySelectorAll('[data-en-alt]');
  var ariaNodes = document.querySelectorAll('[data-en-aria-label]');
  textNodes.forEach(function (el) { el.setAttribute('data-ru', el.innerHTML); });
  altNodes.forEach(function (el) { el.setAttribute('data-ru-alt', el.alt); });
  ariaNodes.forEach(function (el) { el.setAttribute('data-ru-aria-label', el.getAttribute('aria-label')); });

  function setLang(lang) {
    textNodes.forEach(function (el) { el.innerHTML = el.getAttribute('data-' + lang); });
    altNodes.forEach(function (el) { el.alt = el.getAttribute('data-' + lang + '-alt'); });
    ariaNodes.forEach(function (el) { el.setAttribute('aria-label', el.getAttribute('data-' + lang + '-aria-label')); });
    doc.lang = lang;
    document.title = META[lang].title;
    document.querySelector('meta[name="description"]').content = META[lang].desc;
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
    try { localStorage.setItem('lang', lang); } catch (e) {}
  }

  var saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) {}
  var fromUrl = /[?&]lang=(ru|en)/.exec(location.search);
  var initial = fromUrl ? fromUrl[1]
    : saved ? saved
    : /^(ru|be|uk|kk|tt)/i.test(navigator.language || 'ru') ? 'ru' : 'en';
  if (initial === 'en') setLang('en');

  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.dataset.lang); });
  });

  /* ---------- Case tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') select(tabs[(i + 1) % tabs.length], true);
      if (e.key === 'ArrowLeft') select(tabs[(i - 1 + tabs.length) % tabs.length], true);
    });
  });
  if (tabs.length) select(tabs[0]);
})();
