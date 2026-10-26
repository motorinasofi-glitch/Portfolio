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

// Бургер-меню на телефоне: открывает меню на весь экран, закрывается крестиком,
// пунктом меню или клавишей Esc. Как выглядит — в styles.css, раздел «Адаптив».
(function () {
  var header = document.querySelector('.header');
  var burger = header && header.querySelector('.burger');
  if (!burger) return;

  var en = document.documentElement.lang === 'en';
  var labels = en ? ['Open menu', 'Close menu'] : ['Открыть меню', 'Закрыть меню'];

  function setOpen(open) {
    header.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', labels[open ? 1 : 0]);
  }

  burger.addEventListener('click', function () {
    setOpen(!header.classList.contains('is-open'));
  });

  header.querySelectorAll('.nav a, .header__end a').forEach(function (link) {
    link.addEventListener('click', function () { setOpen(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('is-open')) {
      setOpen(false);
      burger.focus();
    }
  });
})();

// Форма заявки в подвале: только проверка полей, отправка пока не подключена.
(function () {
  var form = document.querySelector('.form');
  if (!form) return;

  var status = form.querySelector('.form__status');
  // Тексты сообщений по языку страницы (<html lang="ru"> или "en")
  var t = document.documentElement.lang === 'en' ? {
    name: 'Please tell me what to call you',
    contact: 'Enter your Telegram @username or phone number',
    sent: 'Sending requests isn’t set up yet. Please message me on Telegram.'
  } : {
    name: 'Напишите, как к вам обращаться',
    contact: 'Укажите @username в Telegram или номер телефона',
    sent: 'Отправка заявок пока не подключена. Напишите мне в Telegram.'
  };
  // @username (5–32 символа) или телефон: от 7 цифр, можно +, пробелы, скобки, дефисы
  var contactOk = /^(@[A-Za-z0-9_]{5,32}|\+?[\d\s()-]{7,20})$/;
  var checks = [
    { el: form.elements.name, test: function (v) { return v.length >= 2; }, msg: t.name },
    { el: form.elements.contact, test: function (v) { return contactOk.test(v); }, msg: t.contact }
  ];

  function check(item) {
    var ok = item.test(item.el.value.trim());
    var error = document.getElementById(item.el.id + '-error');
    item.el.setAttribute('aria-invalid', ok ? 'false' : 'true');
    item.el.setAttribute('aria-describedby', error.id);
    error.textContent = ok ? '' : item.msg;
    return ok;
  }

  checks.forEach(function (item) {
    item.el.addEventListener('blur', function () { if (item.el.value) check(item); });
    item.el.addEventListener('input', function () {
      if (item.el.getAttribute('aria-invalid') === 'true') check(item);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    checks.forEach(function (item) {
      if (!check(item) && !firstBad) firstBad = item.el;
    });
    if (firstBad) { firstBad.focus(); return; }
    // [отправку подключим позже: Telegram-бот, почта или CRM]
    status.textContent = t.sent;
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
    '.compare__table',
    '.principle',
    '.case',
    '.services__cols', '.service',
    '.about__ph', '.about__item',
    '.review',
    '.faq__item', '.faq__cta',
    '.contact__txt', '.form'
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

// Первый экран: живой градиент на WebGL, как на wearebarbarian.com.
// Две волны на местах свечения из макета (фиолетовая и светлая под кнопкой) медленно текут.
// Без WebGL или при «уменьшить движение» остаётся статичное свечение из макета.
(function () {
  var hero = document.querySelector('.hero');
  var canvas = hero && hero.querySelector('.hero__gradient');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) return;

  // Цвета из tokens.css
  var css = getComputedStyle(document.documentElement);
  function color(name) {
    var hex = css.getPropertyValue(name).trim().slice(1);
    return [0, 2, 4].map(function (i) { return parseInt(hex.substr(i, 2), 16) / 255; });
  }

  var vert = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';
  var frag = [
    'precision mediump float;',
    'uniform vec2 u_res; uniform float u_t;',
    'uniform vec3 u_night, u_glow, u_accent, u_light;',
    'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float noise(vec2 p) {',
    '  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);',
    '}',
    'void main() {',
    '  vec2 uv = vec2(gl_FragCoord.x / u_res.x, 1.0 - gl_FragCoord.y / u_res.y);',
    '  float t = u_t;',
    // Фиолетовая волна — середина экрана
    '  float y1 = 0.60 + 0.10 * sin(uv.x * 2.4 + t * 0.20) + 0.16 * (noise(vec2(uv.x * 1.5 + t * 0.06, t * 0.04)) - 0.5);',
    '  float glow = exp(-pow((uv.y - y1) / 0.22, 2.0));',
    // Светлая волна — ниже, под кнопкой
    '  float y2 = 0.80 + 0.07 * sin(uv.x * 3.1 - t * 0.27 + 1.0) + 0.12 * (noise(vec2(uv.x * 2.5 - t * 0.05, 3.0 + t * 0.05)) - 0.5);',
    '  float light = exp(-pow((uv.y - y2) / 0.09, 2.0)) * mix(0.55, 1.0, smoothstep(0.0, 0.5, uv.x));',
    // Розовое пятно бродит внутри фиолетовой волны
    '  vec2 c = vec2(0.3 + 0.25 * sin(t * 0.11), 0.62 + 0.08 * cos(t * 0.15));',
    '  vec2 d = (uv - c) * vec2(u_res.x / u_res.y, 1.0);',
    '  float pink = exp(-dot(d, d) / 0.15) * glow;',
    '  vec3 col = mix(u_night, u_glow, glow * 0.85);',
    '  col = mix(col, u_accent, pink * 0.45);',
    '  col += u_light * light * 0.75;',
    '  col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;',   // шум против полос на переходах
    '  gl_FragColor = vec4(min(col, 1.0), 1.0);',
    '}'
  ].join('\n');

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  var prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  // Один прямоугольник на весь canvas
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  function uniform(name) { return gl.getUniformLocation(prog, name); }
  gl.uniform3fv(uniform('u_night'), color('--c-night'));
  gl.uniform3fv(uniform('u_glow'), color('--c-glow'));
  gl.uniform3fv(uniform('u_accent'), color('--c-accent'));
  gl.uniform3fv(uniform('u_light'), color('--c-rose-50'));
  var uRes = uniform('u_res');
  var uT = uniform('u_t');

  // Градиент размытый, поэтому рисуем в половинном разрешении — так легче для телефона
  function resize() {
    canvas.width = Math.max(1, Math.round(canvas.clientWidth / 2));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight / 2));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }

  var start = performance.now();
  var frame = 0;
  function draw(now) {
    gl.uniform1f(uT, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    frame = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);

  // Рисуем, только пока первый экран виден
  new IntersectionObserver(function (entries) {
    cancelAnimationFrame(frame);
    if (entries[0].isIntersecting) frame = requestAnimationFrame(draw);
  }).observe(hero);

  hero.classList.add('has-gradient');
})();

// «Мой подход»: секция закрепляется, и вертикальный скролл двигает ленту карточек влево,
// как на irinakhachatryan.ru. При «уменьшить движение» и на телефоне (≤768px)
// лента просто листается вбок пальцем.
(function () {
  var section = document.querySelector('.principles');
  var rail = section && section.querySelector('.principles__rail');
  var list = rail && rail.querySelector('.principles__list');
  if (!list) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var phone = window.matchMedia('(max-width: 768px)'); // как точка в styles.css
  var distance = 0;

  // Сколько ленте ехать влево = на столько секция выше экрана
  function measure() {
    var pinned = !phone.matches;
    section.classList.toggle('is-pinned', pinned);
    if (!pinned) {
      section.style.height = '';
      list.style.transform = '';
      return;
    }
    distance = Math.max(0, list.scrollWidth - rail.clientWidth);
    section.style.height = window.innerHeight + distance + 'px';
    update();
  }

  function update() {
    if (phone.matches) return;
    var passed = -section.getBoundingClientRect().top;
    var shift = Math.min(Math.max(passed, 0), distance);
    list.style.transform = 'translate3d(' + -shift + 'px, 0, 0)';
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  measure();
})();

// «Вопросы»: клик по вопросу открывает ответ, остальные закрываются (как на viennesechair.ru).
(function () {
  var items = document.querySelectorAll('.faq__item');

  function setOpen(item, open) {
    item.classList.toggle('is-open', open);
    item.querySelector('.faq__toggle').setAttribute('aria-expanded', open);
  }

  items.forEach(function (item) {
    item.querySelector('.faq__toggle').addEventListener('click', function () {
      var open = !item.classList.contains('is-open');
      items.forEach(function (other) { setOpen(other, false); });
      setOpen(item, open);
    });
  });
})();
