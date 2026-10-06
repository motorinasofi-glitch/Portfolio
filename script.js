// Шапка при скролле: закрепляется сверху отдельными плашками, как на lessestudio.com.
(function () {
  var header = document.querySelector('.header');
  var list = header && header.querySelector('.nav__list');
  if (!header || !list) return;

  // Порог берём из tokens.css (--header-stick-after)
  var stickAfter = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--header-stick-after')
  ) || 80;

  function update() {
    header.classList.toggle('is-stuck', window.scrollY > stickAfter);
  }
  window.addEventListener('scroll', update, { passive: true });
  update();

  // Подложка, которая переезжает за пунктом меню под курсором
  var pill = document.createElement('li');
  pill.className = 'nav__pill';
  pill.setAttribute('aria-hidden', 'true');
  list.appendChild(pill);

  var shown = false;
  var hideTimer;

  list.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('mouseenter', function () {
      clearTimeout(hideTimer);
      var box = list.getBoundingClientRect();
      var r = link.getBoundingClientRect();
      // Первый раз подложка просто проявляется на месте, дальше — едет к пункту
      pill.classList.toggle('is-moving', shown);
      pill.style.left = (r.left - box.left) + 'px';
      pill.style.width = r.width + 'px';
      pill.style.opacity = 1;
      shown = true;
    });
  });

  list.addEventListener('mouseleave', function () {
    pill.classList.remove('is-moving');
    pill.style.opacity = 0;
    shown = false;
    hideTimer = setTimeout(function () { pill.style.width = 0; }, 150);
  });
})();

// Анимации по образцу lessestudio.com.
// Если у пользователя в системе включено «уменьшить движение» — ничего не анимируем.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  // 1. Плавный инерционный скролл (библиотека Lenis, те же настройки, что на lessestudio).
  if (typeof Lenis !== 'undefined') {
    new Lenis({
      lerp: 0.1,        // чем меньше, тем «тягучее» скролл
      smoothWheel: true,
      anchors: true,    // ссылки из меню (#cases, #contact…) тоже едут плавно
      autoRaf: true
    });
  }

  // 2. Что анимируем. Разметку не трогаем — отмечаем элементы отсюда.
  var SPLIT = '.hero__title, .section-head__title';           // слова выезжают снизу
  var REVEAL = [                                              // блоки проявляются
    '.header',
    '.hero__photo-group', '.hero__caption', '.hero .btn',
    '.section-head__label',
    '.principle',
    '.case',
    '.services__cols', '.service'
  ].join(', ');

  // Разбиваем текст заголовка на слова, сохраняя <br> и вложенные <span>.
  function splitWords(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 1) { walk(child); return; }
        if (child.nodeType !== 3 || !child.textContent.trim()) return;

        var frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var word = document.createElement('span');
          var inner = document.createElement('span');
          word.className = 'word';
          inner.className = 'word__in';
          inner.style.setProperty('--i', i++);
          inner.textContent = part;
          word.appendChild(inner);
          frag.appendChild(word);
        });
        child.parentNode.replaceChild(frag, child);
      });
    })(el);
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  }

  document.querySelectorAll(SPLIT).forEach(function (el) {
    el.setAttribute('data-split', '');
    splitWords(el);
  });

  // Соседние блоки в одном контейнере появляются по очереди.
  document.querySelectorAll(REVEAL).forEach(function (el) {
    el.setAttribute('data-reveal', '');
    var index = Array.prototype.indexOf.call(
      el.parentNode.querySelectorAll(':scope > [data-reveal]'), el
    );
    el.style.setProperty('--delay', 'calc(' + index + ' * var(--reveal-stagger))');
  });

  // Показываем элемент, когда он заходит в экран (один раз).
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });

  document.querySelectorAll('[data-split], [data-reveal]').forEach(function (el) {
    observer.observe(el);
  });
})();
