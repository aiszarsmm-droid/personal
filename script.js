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
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var p = document.getElementById(t.getAttribute('aria-controls'));
      p.querySelectorAll('.case').forEach(function (c, i) { c.style.setProperty('--i', i); });
      p.classList.remove('is-switch'); void p.offsetWidth; p.classList.add('is-switch');
    });
  });

  /* ---------- Ticker: duplicate the row for a seamless loop ---------- */
  var row = document.querySelector('.ticker__row');
  if (row) {
    for (var k = 0; k < 2; k++) {
      var clone = row.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      row.parentNode.appendChild(clone);
    }
  }

  /* ---------- Scroll progress ---------- */
  var bar = document.querySelector('.progress');
  function progress() {
    var max = doc.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
  }
  addEventListener('scroll', progress, { passive: true });
  progress();

  /* ---------- Reveal on scroll + number count-up ---------- */
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm || !('IntersectionObserver' in window)) return;

  function countUp(el) {
    var m = /^(\D*)([\d\s ]+)(\D*)$/.exec(el.textContent.trim());
    if (!m) return;
    var target = parseInt(m[2].replace(/\D/g, ''), 10), start = null, dur = 1300;
    function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - t, 4);
      el.textContent = m[1] + fmt(Math.round(target * e)) + m[3];
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var groups = ['.about__pic', '.about__text', '.sec h2', '.sec__lead', '.res', '.tools > div', '.chips--lg li',
    '.services li', '.ai__list li', '.tabs', '.rev', '.contact__box'];
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      io.unobserve(el);
      el.classList.add('is-in');
      if (el.matches('.res')) el.querySelectorAll('dt').forEach(countUp);
      setTimeout(function () { el.classList.add('is-done'); }, 1500);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  groups.forEach(function (sel) {
    var prevParent = null, n = 0;
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.getBoundingClientRect().top < innerHeight * 0.9) return; /* already on screen: stays visible */
      if (el.parentNode !== prevParent) { prevParent = el.parentNode; n = 0; }
      el.style.setProperty('--d', Math.min(n++, 8) * 70 + 'ms');
      el.classList.add('reveal');
      io.observe(el);
    });
  });
})();

