(function () {
  var doc = document.documentElement;
  doc.classList.add('js');

  /* ---------- Language switch ---------- */
  var descTag = document.querySelector('meta[name="description"]');
  var META = {
    ru: {
      title: document.title,
      desc: descTag ? descTag.content : ''
    },
    en: {
      title: document.body.dataset.titleEn || 'Aisylu Zaripova — international marketer and SMM specialist',
      desc: document.body.dataset.descEn || 'Portfolio of Aisylu Zaripova: 6+ years in SMM, brands from the USA, the UAE, Europe and the CIS. Cases, services, reviews and contacts.'
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
    if (descTag) descTag.content = META[lang].desc;
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

  /* ---------- Case preview modal ---------- */
  var modal = document.querySelector('.cmodal');
  if (modal && modal.showModal) {
    var mImg = modal.querySelector('.cmodal__media img');
    var opener = null;
    function fill(card) {
      var img = card.querySelector('img');
      mImg.src = img.getAttribute('src');
      modal.querySelector('.cmodal__media').classList.toggle('is-logo', img.classList.contains('is-logo'));
      modal.querySelector('.cmodal__meta').textContent = card.querySelector('.case__meta').textContent;
      modal.querySelector('#cmodal-title').textContent = card.querySelector('h4').textContent;
      modal.querySelector('.cmodal__desc').textContent = card.querySelector(':scope > p:not([class])').textContent;
      var extra = card.querySelector('.case__extra');
      var hasHl = extra.querySelector('.case__hl');
      var list = card.querySelector(':scope > ul');
      modal.querySelector('.cmodal__list').innerHTML = hasHl ? '' : (list ? '<ul>' + list.innerHTML + '</ul>' : '');
      modal.querySelector('.cmodal__extra').innerHTML = extra.innerHTML;
    }
    document.querySelectorAll('.case__open, .best__open').forEach(function (b) {
      b.addEventListener('click', function () {
        opener = b;
        fill(b.dataset.case ? document.getElementById(b.dataset.case) : b.closest('.case'));
        modal.showModal();
        modal.querySelector('.cmodal__in').scrollTop = 0;
        doc.classList.add('is-modal');
      });
    });
    document.querySelectorAll('.case img').forEach(function (img) {
      img.addEventListener('click', function () { img.closest('.case').querySelector('.case__open').click(); });
    });
    document.querySelectorAll('.best__media').forEach(function (m) {
      m.addEventListener('click', function () { m.closest('.best__card').querySelector('.best__open').click(); });
    });
    modal.querySelector('.cmodal__close').addEventListener('click', function () { modal.close(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.close(); });
    modal.addEventListener('close', function () {
      doc.classList.remove('is-modal');
      if (opener) opener.focus();
    });
  }

  /* ---------- Image lightbox (case pages) ---------- */
  var lb = document.querySelector('.lightbox');
  if (lb && lb.showModal) {
    document.querySelectorAll('.shot').forEach(function (b) {
      b.addEventListener('click', function () {
        lb.querySelector('img').src = b.querySelector('img').getAttribute('src');
        lb.showModal();
      });
    });
    lb.addEventListener('click', function () { lb.close(); });
  }

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
    '.services li', '.ai__list li', '.best__card', '.tabs', '.rev', '.contact__box', '.cnums li', '.more__list li', '.shots-note'];
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

