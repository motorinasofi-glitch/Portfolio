/* =====================================================================
   motion.js — слой «вау»-анимаций поверх script.js.
   Разметку в index.html почти не трогаем: всё нужное добавляется отсюда.
   Подключать ПОСЛЕ script.js. При «уменьшить движение» ничего не делает.
   ===================================================================== */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var root = document.documentElement;
  var en = root.lang === 'en';
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var phone = window.matchMedia('(max-width: 768px)');

  root.classList.add('m-on');

  function lerp(a, b, k) { return a + (b - a) * k; }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  // Одно «появилось в экране» на все эффекты: ставит .m-in
  var inView = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('m-in');
      e.target.dispatchEvent(new CustomEvent('m-in'));
      inView.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

  /* ---------- 1. Прелоадер ---------- */
  (function preloader() {
    var el = document.querySelector('.preloader');
    if (!el || !root.classList.contains('m-preload')) return;
    var count = el.querySelector('.preloader__num');
    var start = performance.now();
    var DURATION = 1600;
    var loaded = document.readyState === 'complete';
    window.addEventListener('load', function () { loaded = true; });

    (function tick(now) {
      // Ждём загрузку страницы, но не дольше ~4 секунд
      var k = (now - start) / DURATION;
      if (!loaded && k > 0.9 && now - start < 4000) k = 0.9;
      k = clamp(k, 0, 1);
      var eased = 1 - Math.pow(1 - k, 3);
      count.textContent = String(Math.round(eased * 100)).padStart(2, '0');
      el.style.setProperty('--p', eased);
      if (k < 1) { requestAnimationFrame(tick); return; }
      setTimeout(function () {
        root.classList.add('is-leaving');
        try { sessionStorage.setItem('m-seen', '1'); } catch (e) {}
        setTimeout(function () {
          root.classList.remove('m-preload', 'is-leaving');
          el.remove();
        }, 1400);
      }, 200);
    })(start);
  })();

  /* ---------- 2. Прогресс прокрутки ---------- */
  var bar = document.createElement('div');
  bar.className = 'm-progress';
  document.body.appendChild(bar);

  /* ---------- 3. Зерно ---------- */
  var grain = document.createElement('div');
  grain.className = 'm-grain';
  grain.setAttribute('aria-hidden', 'true');
  document.body.appendChild(grain);

  /* ---------- 4. Курсор ---------- */
  var mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  var cursor, dot;
  if (finePointer) {
    cursor = document.createElement('div');
    cursor.className = 'm-cursor';
    cursor.innerHTML = '<span>' + (en ? 'View' : 'Смотреть') + '</span>';
    dot = document.createElement('div');
    dot.className = 'm-cursor-dot';
    [cursor, dot].forEach(function (n) { n.setAttribute('aria-hidden', 'true'); document.body.appendChild(n); });

    var ring = { x: mouse.x, y: mouse.y };
    window.addEventListener('pointermove', function (e) {
      mouse.x = e.clientX; mouse.y = e.clientY;
      root.classList.add('has-cursor');
      dot.style.transform = 'translate3d(' + mouse.x + 'px,' + mouse.y + 'px,0)';
    }, { passive: true });
    document.addEventListener('pointerleave', function () { root.classList.remove('has-cursor'); });

    document.addEventListener('pointerover', function (e) {
      var t = e.target;
      var view = t.closest && t.closest('.case__media') && !t.closest('.case__btn');
      var link = t.closest && t.closest('a, button, .faq__toggle, input, textarea, label');
      cursor.classList.toggle('is-view', !!view);
      cursor.classList.toggle('is-link', !view && !!link);
    });

    (function follow() {
      ring.x = lerp(ring.x, mouse.x, 0.18);
      ring.y = lerp(ring.y, mouse.y, 0.18);
      cursor.style.transform = 'translate3d(' + ring.x + 'px,' + ring.y + 'px,0)';
      requestAnimationFrame(follow);
    })();
  }

  /* ---------- 5. Магнитные кнопки ---------- */
  if (finePointer) {
    document.querySelectorAll('.btn:not(.case__btn), .header__chat, .lang__opt').forEach(function (el) {
      var strength = el.classList.contains('btn') ? 0.3 : 0.4;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transition = 'translate 0.2s ease-out';
        el.style.translate = (dx * strength) + 'px ' + (dy * strength) + 'px';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'translate 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.translate = '0px 0px';
      });
    });
  }

  /* ---------- 6. Первый экран: искры, свет за курсором, параллакс ---------- */
  var hero = document.querySelector('.hero');
  var heroMain = hero && hero.querySelector('.hero__main');
  var heroPhoto = hero && hero.querySelector('.hero__photo-group');
  var heroTitle = hero && hero.querySelector('.hero__title');
  var spot;
  var heroMouse = { x: 0, y: 0, sx: 0, sy: 0 };

  if (hero) {
    // Свет за курсором
    spot = document.createElement('div');
    spot.className = 'hero__spot';
    spot.setAttribute('aria-hidden', 'true');

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      heroMouse.px = e.clientX - r.left;
      heroMouse.py = e.clientY - r.top;
      heroMouse.x = (e.clientX / innerWidth - 0.5) * 2;
      heroMouse.y = (e.clientY / innerHeight - 0.5) * 2;
      // След из звёзд и лун: новая фигура каждые ~34px пути курсора
      if (finePointer && heroMouse.lx != null) {
        heroMouse.trail += Math.hypot(heroMouse.px - heroMouse.lx, heroMouse.py - heroMouse.ly);
        if (heroMouse.trail > 34) { heroMouse.trail = 0; addCharm(heroMouse.px, heroMouse.py, 1); }
      }
      heroMouse.lx = heroMouse.px; heroMouse.ly = heroMouse.py;
    });
    hero.addEventListener('pointerleave', function () { heroMouse.lx = null; });
    heroMouse.trail = 0;

    // Клик по пустому месту первого экрана — маленький «салют» из звёзд и лун
    if (finePointer) {
      hero.addEventListener('click', function (e) {
        if (e.target.closest('a, button')) return;
        var r = hero.getBoundingClientRect();
        for (var k = 0; k < 9; k++) addCharm(e.clientX - r.left, e.clientY - r.top, 2.6);
      });
    }

    // Звёзды-искорки и полумесяцы, которые появляются под курсором
    var charms = [];
    function addCharm(x, y, kick) {
      if (charms.length > 40) charms.shift();
      var moon = Math.random() < 0.28;
      var color = palette[(Math.random() * palette.length) | 0];
      var ang = Math.random() * 6.283, sp = (Math.random() * 0.6 + 0.2) * kick;
      charms.push({
        x: x + (Math.random() - 0.5) * 14, y: y + (Math.random() - 0.5) * 14,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 0.25,
        moon: moon,
        r: moon ? Math.random() * 4 + 7 : Math.random() * 7 + 5,
        rot: moon ? Math.random() * 0.8 - 1.2 : Math.random() * 0.6,
        vr: (Math.random() - 0.5) * 0.03,
        life: 0, dur: Math.random() * 40 + 70,
        img: sprite(moon, color)
      });
    }
    function easeBack(k) { var s = 2.2; k -= 1; return k * k * ((s + 1) * k + s) + 1; }

    // Фигуры со свечением рисуются ОДИН раз в маленькие картинки-спрайты,
    // а в каждом кадре только копируются — свечение (shadowBlur) в кадре очень дорогое
    var SPR = 64, SPR_R = 16; // размер спрайта и радиус фигуры в нём
    var sprites = {};
    function sprite(moon, color) {
      var key = (moon ? 'm' : 's') + color;
      if (sprites[key]) return sprites[key];
      var s = document.createElement('canvas');
      s.width = s.height = SPR * 2; // двойная плотность — чётко на ретине
      var g = s.getContext('2d');
      g.scale(2, 2);
      g.translate(SPR / 2, SPR / 2);
      g.fillStyle = color;
      g.shadowColor = glowColor;
      g.shadowBlur = SPR_R * 1.4;
      g.beginPath();
      if (moon) {
        // полумесяц: левая половина круга минус половинка эллипса
        g.arc(0, 0, SPR_R, Math.PI / 2, Math.PI * 1.5, false);
        g.ellipse(0, 0, SPR_R * 0.45, SPR_R, 0, Math.PI * 1.5, Math.PI / 2, true);
      } else {
        // четырёхлучевая звезда-искорка
        g.moveTo(0, -SPR_R);
        g.quadraticCurveTo(0, 0, SPR_R, 0);
        g.quadraticCurveTo(0, 0, 0, SPR_R);
        g.quadraticCurveTo(0, 0, -SPR_R, 0);
        g.quadraticCurveTo(0, 0, 0, -SPR_R);
      }
      g.fill();
      return (sprites[key] = s);
    }

    function drawCharm(c) {
      var k = c.life / c.dur;
      var r = c.r * Math.max(0, easeBack(Math.min(1, k / 0.22))) * (1 - k * 0.35);
      if (r <= 0.2) return;
      var size = SPR * r / SPR_R;
      ctx.globalAlpha = Math.min(1, k / 0.1) * Math.pow(1 - k, 1.4);
      var cos = Math.cos(c.rot), sin = Math.sin(c.rot);
      ctx.setTransform(DPR * cos, DPR * sin, -DPR * sin, DPR * cos, DPR * c.x, DPR * c.y);
      ctx.drawImage(c.img, -size / 2, -size / 2, size, size);
    }

    // Искры: розовые частицы медленно всплывают и разлетаются от курсора
    var gradient = hero.querySelector('.hero__gradient');
    var cv = document.createElement('canvas');
    cv.className = 'hero__sparks';
    cv.setAttribute('aria-hidden', 'true');
    if (gradient) gradient.after(cv); else hero.prepend(cv);
    cv.after(spot);
    var ctx = cv.getContext('2d');
    var css = getComputedStyle(root);
    var palette = ['--c-rose-50', '--c-rose-200', '--c-accent', '--c-light'].map(function (n) {
      return css.getPropertyValue(n).trim();
    });
    var glowColor = css.getPropertyValue('--c-accent').trim();
    var W, H, DPR, parts = [];

    function sizeSparks() {
      DPR = Math.min(devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      cv.width = W * DPR; cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var n = phone.matches ? 45 : 110;
      parts = [];
      for (var i = 0; i < n; i++) parts.push(spark(true));
    }
    function spark(init) {
      return {
        x: Math.random() * W,
        y: init ? Math.random() * H : H + 10,
        r: Math.random() * 1.8 + 0.4,
        vy: Math.random() * 0.35 + 0.08,
        vx: 0, ph: Math.random() * 6.28,
        c: palette[(Math.random() * palette.length) | 0]
      };
    }
    sizeSparks();
    window.addEventListener('resize', sizeSparks);

    var heroVisible = true;
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; }).observe(hero);

    var t = 0;
    (function drawSparks() {
      requestAnimationFrame(drawSparks);
      if (!heroVisible) return;
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        // отталкивание от курсора
        if (heroMouse.px != null) {
          var dx = p.x - heroMouse.px, dy = p.y - heroMouse.py, d2 = dx * dx + dy * dy;
          if (d2 < 14400) { var d = Math.sqrt(d2) || 1, f = (1 - d / 120) * 0.9; p.vx += dx / d * f; p.y += dy / d * f; }
        }
        p.vx *= 0.92;
        p.x += p.vx + Math.sin(t + p.ph) * 0.2;
        p.y -= p.vy;
        if (p.y < -10 || p.x < -20 || p.x > W + 20) parts[i] = spark(false);
        var a = 0.35 + Math.sin(t * 2 + p.ph) * 0.3;
        ctx.globalAlpha = Math.max(0.05, a) * clamp((H - p.y) / 120, 0, 1);
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fill();
      }
      for (var j = charms.length - 1; j >= 0; j--) {
        var c = charms[j];
        c.life++;
        if (c.life >= c.dur) { charms.splice(j, 1); continue; }
        c.vx *= 0.96; c.vy = c.vy * 0.96 - 0.012;
        c.x += c.vx; c.y += c.vy; c.rot += c.vr;
        drawCharm(c);
      }
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    })();
  }

  /* ---------- 7. Кейсы: параллакс картинки и 3D-наклон ---------- */
  var cases = Array.prototype.slice.call(document.querySelectorAll('.case'));
  cases.forEach(function (c) { inView.observe(c); });

  if (finePointer) {
    document.querySelectorAll('.case__media').forEach(function (m) {
      m.addEventListener('pointermove', function (e) {
        var r = m.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        m.style.transform = 'perspective(1200px) rotateY(' + (x * 5) + 'deg) rotateX(' + (-y * 5) + 'deg)';
      });
      m.addEventListener('pointerleave', function () { m.style.transform = ''; });
    });
  }

  /* ---------- 8. Принципы: свет за курсором ---------- */
  document.querySelectorAll('.principle').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- 9. Таблица сравнения: строки по очереди ---------- */
  var table = document.querySelector('.compare__table');
  if (table) {
    table.querySelectorAll('.compare__row').forEach(function (row, i) { row.style.setProperty('--n', i); });
    inView.observe(table);
  }

  /* ---------- 10. Цены: счётчик от нуля ---------- */
  document.querySelectorAll('.service__price').forEach(function (el) {
    var node = el.firstChild;
    if (!node || node.nodeType !== 3) return;
    // Число цены: «35 000», «35,000» или «370». Разделитель тысяч сохраняем как был
    var m = node.textContent.match(/\d(?:[\d\s\u00a0,]*\d)?/);
    if (!m) return;
    var raw = m[0];
    var target = parseInt(raw.replace(/\D/g, ''), 10);
    var sep = (raw.match(/[\s\u00a0,]/) || ['\u00a0'])[0];
    var round = target >= 10000 ? 100 : target >= 1000 ? 10 : 1;
    var before = node.textContent.slice(0, m.index);
    var after = node.textContent.slice(m.index + raw.length);
    function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep); }
    el.setAttribute('aria-label', el.textContent.trim());
    el.addEventListener('m-in', function () {
      var s = performance.now();
      (function step(now) {
        var k = clamp((now - s) / 1400, 0, 1);
        var v = Math.round(target * (1 - Math.pow(1 - k, 4)) / round) * round;
        node.textContent = before + fmt(k === 1 ? target : v) + after;
        if (k < 1) requestAnimationFrame(step);
      })(s);
    });
    node.textContent = before + '0' + after;
    inView.observe(el);
  });

  /* ---------- 11. Фото «Обо мне» ---------- */
  var aboutPh = document.querySelector('.about__ph');
  if (aboutPh) inView.observe(aboutPh);

  /* ---------- 12. Финальный призыв: буквы ---------- */
  var ct = document.querySelector('.contact__title');
  if (ct) {
    var text = ct.textContent;
    ct.setAttribute('aria-label', text);
    ct.innerHTML = '';
    var c = 0;
    text.split(/(\s+)/).forEach(function (word) {
      if (/^\s+$/.test(word)) { ct.appendChild(document.createTextNode(' ')); return; }
      var w = document.createElement('span');
      w.style.whiteSpace = 'nowrap';
      w.setAttribute('aria-hidden', 'true');
      word.split('').forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'm-ch';
        s.style.setProperty('--c', c++);
        s.textContent = ch;
        w.appendChild(s);
      });
      ct.appendChild(w);
    });
    inView.observe(ct);
  }

  /* ---------- Общий цикл: прогресс, параллакс первого экрана и кейсов ---------- */
  var imgs = Array.prototype.slice.call(document.querySelectorAll('.case__img'));

  (function loop() {
    var max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';

    if (hero) {
      heroMouse.sx = lerp(heroMouse.sx, heroMouse.x, 0.06);
      heroMouse.sy = lerp(heroMouse.sy, heroMouse.y, 0.06);
      if (spot && heroMouse.px != null) {
        spot.style.transform = 'translate3d(' + heroMouse.px + 'px,' + heroMouse.py + 'px,0)';
      }
      var h = hero.offsetHeight;
      var k = clamp(scrollY / h, 0, 1);
      if (heroMain) {
        heroMain.style.translate = (heroMouse.sx * -8) + 'px ' + (k * h * 0.25 + heroMouse.sy * -6) + 'px';
        heroMain.style.scale = String(1 - k * 0.08);
        heroMain.style.opacity = String(1 - k * 1.2);
      }
      if (heroPhoto) heroPhoto.style.translate = (heroMouse.sx * 14) + 'px ' + (heroMouse.sy * 10) + 'px';
      if (heroTitle && finePointer) heroTitle.style.translate = (heroMouse.sx * 4) + 'px ' + (heroMouse.sy * 3) + 'px';
    }

    // Картинка внутри кейса едет медленнее рамки
    for (var i = 0; i < imgs.length; i++) {
      var r = imgs[i].getBoundingClientRect();
      if (r.bottom < -100 || r.top > innerHeight + 100) continue;
      var center = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      imgs[i].style.translate = '0 ' + (center * -40).toFixed(1) + 'px';
    }

    requestAnimationFrame(loop);
  })();
})();
