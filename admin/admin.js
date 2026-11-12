/* Админка: загрузка и редактирование разделов сайта */

let currentLang = 'ru';
let currentSection = 'site';
let currentData = null;

const SECTIONS = {
  site: {
    title: 'Общее',
    desc: 'Шапка, меню и контакты',
    fields: [
      { key: 'title', label: 'Название страницы', type: 'text', hint: 'Видно во вкладке браузера' },
      { key: 'description', label: 'Описание для поисковиков', type: 'textarea' },
      { key: 'handle', label: 'Ник', type: 'text', hint: 'Например @monatory' },
      { key: 'nav', label: 'Пункты меню', type: 'object', fields: [
        { key: 'approach', label: 'Мой подход', type: 'text' },
        { key: 'cases', label: 'Кейсы', type: 'text' },
        { key: 'pricing', label: 'Тарифы', type: 'text' },
        { key: 'about', label: 'Обо мне', type: 'text' },
        { key: 'reviews', label: 'Отзывы', type: 'text' },
      ]},
      { key: 'telegram', label: 'Telegram', type: 'url' },
      { key: 'behance', label: 'Behance', type: 'url' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'city', label: 'Город и копирайт', type: 'text' },
    ],
  },
  hero: {
    title: 'Первый экран',
    desc: 'Заголовок, подзаголовок и фото',
    fields: [
      { key: 'photo', label: 'Фото', type: 'image' },
      { key: 'photo_alt', label: 'Описание фото', type: 'text' },
      { key: 'caption', label: 'Приветствие', type: 'textarea', hint: 'Перенос строки = <br>' },
      { key: 'title', label: 'Подзаголовок', type: 'textarea' },
      { key: 'button', label: 'Текст кнопки', type: 'text' },
    ],
  },
  principles: {
    title: 'Мой подход',
    desc: 'Принципы работы',
    fields: [
      { key: 'label', label: 'Метка секции', type: 'text' },
      { key: 'title', label: 'Заголовок', type: 'textarea' },
      { key: 'list', label: 'Принципы', type: 'list', itemFields: [
        { key: 'title', label: 'Заголовок', type: 'text' },
        { key: 'text', label: 'Описание', type: 'textarea' },
      ]},
    ],
  },
  cases: {
    title: 'Кейсы',
    desc: 'Портфолио проектов',
    fields: [
      { key: 'label', label: 'Метка секции', type: 'text' },
      { key: 'title_accent', label: 'Заголовок (цветная часть)', type: 'text' },
      { key: 'title', label: 'Заголовок (остаток)', type: 'textarea' },
      { key: 'button', label: 'Текст кнопки', type: 'text' },
      { key: 'list', label: 'Проекты', type: 'list', itemFields: [
        { key: 'image', label: 'Картинка', type: 'image' },
        { key: 'alt', label: 'Описание картинки', type: 'text' },
        { key: 'title', label: 'Название', type: 'text' },
        { key: 'tags', label: 'Теги', type: 'tags' },
        { key: 'text', label: 'Описание', type: 'textarea' },
        { key: 'link', label: 'Ссылка', type: 'url' },
        { key: 'wide', label: 'Широкий кейс', type: 'checkbox' },
      ]},
    ],
  },
  compare: {
    title: 'Почему не шаблон',
    desc: 'Таблица сравнения',
    fields: [
      { key: 'label', label: 'Метка секции', type: 'text' },
      { key: 'title_accent', label: 'Заголовок (цветная часть)', type: 'text' },
      { key: 'title', label: 'Заголовок (остаток)', type: 'textarea' },
      { key: 'col_template', label: 'Колонка «Шаблон»', type: 'text' },
      { key: 'col_custom', label: 'Колонка «Под ключ»', type: 'text' },
      { key: 'table_label', label: 'Заголовок таблицы (для SEO)', type: 'text' },
      { key: 'rows', label: 'Строки сравнения', type: 'list', itemFields: [
        { key: 'name', label: 'Критерий', type: 'text' },
        { key: 'template', label: 'Шаблон', type: 'text' },
        { key: 'custom', label: 'Под ключ', type: 'text' },
      ]},
    ],
  },
  services: {
    title: 'Услуги',
    desc: 'Тарифы и стоимость',
    fields: [
      { key: 'label', label: 'Метка секции', type: 'text' },
      { key: 'title', label: 'Заголовок', type: 'textarea' },
      { key: 'title_soft', label: 'Подзаголовок', type: 'textarea' },
      { key: 'table_label', label: 'Заголовок таблицы (для SEO)', type: 'text' },
      { key: 'demo', label: 'Плашка под таблицей (пусто — нет плашки)', type: 'text' },
      { key: 'cols', label: 'Названия колонок', type: 'object', fields: [
        { key: 'name', label: 'Услуга', type: 'text' },
        { key: 'text', label: 'Что входит', type: 'text' },
        { key: 'time', label: 'Сроки', type: 'text' },
        { key: 'price', label: 'Стоимость', type: 'text' },
      ]},
      { key: 'list', label: 'Услуги', type: 'list', itemFields: [
        { key: 'title', label: 'Название', type: 'text' },
        { key: 'text', label: 'Описание', type: 'textarea' },
        { key: 'time', label: 'Сроки', type: 'text' },
        { key: 'price', label: 'Стоимость', type: 'text' },
        { key: 'note', label: 'Сноска', type: 'text' },
      ]},
    ],
  },
  about: {
    title: 'Обо мне',
    desc: 'Фото и факты',
    fields: [
      { key: 'label', label: 'Метка секции', type: 'text' },
      { key: 'title', label: 'Заголовок', type: 'textarea' },
      { key: 'photo', label: 'Фото', type: 'image' },
      { key: 'photo_alt', label: 'Описание фото', type: 'text' },
      { key: 'personal', label: 'Личная строка', type: 'text' },
      { key: 'list', label: 'Факты', type: 'list', itemFields: [
        { key: 'title', label: 'Заголовок', type: 'text' },
        { key: 'text', label: 'Текст', type: 'textarea' },
      ]},
    ],
  },
  reviews: {
    title: 'Отзывы',
    desc: 'Включение и содержимое',
    fields: [
      { key: 'show', label: 'Показывать отзывы', type: 'checkbox' },
      { key: 'label', label: 'Метка секции', type: 'text' },
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'list', label: 'Отзывы', type: 'list', itemFields: [
        { key: 'photo', label: 'Фото', type: 'image' },
        { key: 'name', label: 'Имя', type: 'text' },
        { key: 'company', label: 'Компания', type: 'text' },
        { key: 'text', label: 'Текст', type: 'textarea' },
        { key: 'link', label: 'Ссылка', type: 'url' },
        { key: 'link_text', label: 'Текст ссылки', type: 'text' },
      ]},
    ],
  },
  faq: {
    title: 'Вопросы',
    desc: 'FAQ-аккордеон',
    fields: [
      { key: 'label', label: 'Метка секции', type: 'text' },
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'cta_text', label: 'Текст призыва', type: 'textarea' },
      { key: 'cta_button', label: 'Текст кнопки', type: 'text' },
      { key: 'list', label: 'Вопросы и ответы', type: 'list', itemFields: [
        { key: 'question', label: 'Вопрос', type: 'text' },
        { key: 'answer', label: 'Ответ', type: 'textarea' },
      ]},
    ],
  },
  layout: {
    title: 'Оформление',
    desc: 'Отступы между блоками и внутри блоков',
    isLayout: true,
    fields: [
      { key: 'section_gap', label: 'Отступ между блоками (px)', type: 'number', hint: 'По умолчанию 150' },
      { key: 'sections', label: 'Отступы внутри блоков', type: 'section-spacing', items: [
        { key: 'hero', label: 'Первый экран' },
        { key: 'principles', label: 'Мой подход' },
        { key: 'cases', label: 'Кейсы' },
        { key: 'compare', label: 'Почему не шаблон' },
        { key: 'services', label: 'Услуги' },
        { key: 'about', label: 'Обо мне' },
        { key: 'reviews', label: 'Отзывы' },
        { key: 'faq', label: 'Вопросы' },
        { key: 'contact', label: 'Призыв и подвал' },
      ]},
    ],
  },
  contact: {
    title: 'Призыв и подвал',
    desc: 'Форма обратной связи',
    fields: [
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'lead', label: 'Подзаголовок', type: 'textarea' },
      { key: 'hint', label: 'Подсказка', type: 'text' },
      { key: 'button', label: 'Кнопка Telegram', type: 'text' },
      { key: 'form', label: 'Поля формы', type: 'object', fields: [
        { key: 'name_label', label: 'Метка: Имя', type: 'text' },
        { key: 'name_placeholder', label: 'Плейсхолдер: Имя', type: 'text' },
        { key: 'contact_label', label: 'Метка: Контакт', type: 'text' },
        { key: 'contact_placeholder', label: 'Плейсхолдер: Контакт', type: 'text' },
        { key: 'task_label', label: 'Метка: Задача', type: 'text' },
        { key: 'task_placeholder', label: 'Плейсхолдер: Задача', type: 'text' },
        { key: 'submit', label: 'Кнопка отправки', type: 'text' },
        { key: 'after', label: 'Текст после отправки', type: 'textarea' },
      ]},
    ],
  },
};

// --- Навигация ---

document.querySelectorAll('#nav a').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    switchSection(a.dataset.section);
    closeSidebar();
  });
});

function switchSection(section) {
  currentSection = section;
  document.querySelectorAll('#nav a').forEach(a =>
    a.classList.toggle('active', a.dataset.section === section)
  );
  loadSection();
}

function switchLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.sidebar-lang button').forEach(b =>
    b.classList.toggle('active', b.dataset.lang === lang)
  );
  loadSection();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('visible');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('visible');
}

// --- Загрузка раздела ---

async function loadSection() {
  const cfg = SECTIONS[currentSection];
  document.getElementById('page-title').textContent = cfg.title;
  document.getElementById('page-desc').textContent = cfg.desc;
  document.getElementById('save-status').textContent = '';

  // Скрыть/показать переключатель языка
  document.querySelector('.sidebar-lang').style.display = cfg.isLayout ? 'none' : 'flex';

  try {
    const url = cfg.isLayout
      ? '/api/layout'
      : `/api/data/${currentLang}/${currentSection}`;
    const res = await fetch(url);
    currentData = await res.json();
    renderForm(cfg.fields, currentData, document.getElementById('form-container'));
  } catch (e) {
    document.getElementById('form-container').innerHTML =
      '<p style="color:var(--c-wine)">Ошибка загрузки данных</p>';
  }
}

// --- Рендер формы ---

function renderForm(fields, data, container) {
  container.innerHTML = '';

  fields.forEach(field => {
    const val = data[field.key];

    if (field.type === 'section-spacing') {
      const group = el('div', { className: 'form-group' });
      group.appendChild(el('label', {}, field.label));
      const editor = el('div', { className: 'list-editor' });
      const sections = data[field.key] || {};

      field.items.forEach(item => {
        if (!sections[item.key]) sections[item.key] = { padding_top: 0, padding_bottom: 0 };
        const sec = sections[item.key];

        const li = el('div', { className: 'list-item' });
        const header = el('div', { className: 'list-item-header' });
        header.appendChild(el('span', { className: 'title' }, item.label));
        header.appendChild(el('span', { className: 'arrow' }, '▼'));
        header.addEventListener('click', () => li.classList.toggle('collapsed'));
        li.appendChild(header);

        const body = el('div', { className: 'list-item-body' });

        const topGroup = el('div', { className: 'form-group' });
        topGroup.appendChild(el('label', {}, 'Отступ сверху (px)'));
        const topHint = el('div', { className: 'hint' }, '0 = по умолчанию');
        topGroup.appendChild(topHint);
        const topInput = el('input', { type: 'number', value: sec.padding_top || 0, min: 0, style: 'width:120px' });
        topInput.addEventListener('input', () => { sec.padding_top = parseInt(topInput.value) || 0; });
        topGroup.appendChild(topInput);
        body.appendChild(topGroup);

        const botGroup = el('div', { className: 'form-group' });
        botGroup.appendChild(el('label', {}, 'Отступ снизу (px)'));
        const botHint = el('div', { className: 'hint' }, '0 = по умолчанию');
        botGroup.appendChild(botHint);
        const botInput = el('input', { type: 'number', value: sec.padding_bottom || 0, min: 0, style: 'width:120px' });
        botInput.addEventListener('input', () => { sec.padding_bottom = parseInt(botInput.value) || 0; });
        botGroup.appendChild(botInput);
        body.appendChild(botGroup);

        li.appendChild(body);
        li.classList.add('collapsed');
        editor.appendChild(li);
      });

      data[field.key] = sections;
      group.appendChild(editor);
      container.appendChild(group);
      return;
    }

    if (field.type === 'object') {
      const fieldset = el('div', { className: 'form-group' });
      fieldset.appendChild(el('label', {}, field.label));
      const inner = el('div', { style: 'padding-left:16px;border-left:2px solid var(--border);margin-top:8px' });
      field.fields.forEach(sub => {
        inner.appendChild(buildField(sub, (val || {})[sub.key], (v) => {
          if (!data[field.key]) data[field.key] = {};
          data[field.key][sub.key] = v;
        }));
      });
      fieldset.appendChild(inner);
      container.appendChild(fieldset);
    } else if (field.type === 'list') {
      container.appendChild(buildList(field, data));
    } else {
      container.appendChild(buildField(field, val, (v) => { data[field.key] = v; }));
    }
  });
}

function buildField(field, value, onChange) {
  const group = el('div', { className: 'form-group' });

  if (field.type === 'checkbox') {
    const wrap = el('div', { className: 'form-check' });
    const cb = el('input', { type: 'checkbox', checked: !!value });
    cb.addEventListener('change', () => onChange(cb.checked));
    wrap.appendChild(cb);
    wrap.appendChild(el('label', {}, field.label));
    group.appendChild(wrap);
    return group;
  }

  group.appendChild(el('label', {}, field.label));
  if (field.hint) group.appendChild(el('div', { className: 'hint' }, field.hint));

  if (field.type === 'image') {
    group.appendChild(buildImageField(value || '', onChange));
  } else if (field.type === 'tags') {
    group.appendChild(buildTagsField(value || [], onChange));
  } else if (field.type === 'textarea') {
    const ta = el('textarea', { rows: 3 });
    ta.value = value || '';
    ta.addEventListener('input', () => onChange(ta.value));
    group.appendChild(ta);
  } else {
    const input = el('input', { type: field.type === 'url' ? 'url' : 'text' });
    input.value = value || '';
    input.addEventListener('input', () => onChange(input.value));
    group.appendChild(input);
  }

  return group;
}

function buildImageField(value, onChange) {
  const wrap = el('div', { className: 'image-field' });

  const img = el('img', { className: 'image-preview', src: value ? '/' + value : '' });
  img.onerror = () => { img.style.display = 'none'; };
  if (value) img.style.display = 'block';

  const input = el('input', { type: 'text', value: value, placeholder: 'assets/img/...' });
  input.addEventListener('input', () => {
    onChange(input.value);
    img.src = '/' + input.value;
    img.style.display = input.value ? 'block' : 'none';
  });

  const uploadBtn = el('button', { className: 'btn-upload', type: 'button' }, 'Загрузить');
  const fileInput = el('input', { type: 'file', accept: 'image/*', style: 'display:none' });

  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    if (!fileInput.files[0]) return;
    const fd = new FormData();
    fd.append('image', fileInput.files[0]);
    uploadBtn.textContent = '...';
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.path) {
        input.value = data.path;
        onChange(data.path);
        img.src = '/' + data.path;
        img.style.display = 'block';
        toast('Картинка загружена');
      }
    } catch (e) {
      toast('Ошибка загрузки', true);
    }
    uploadBtn.textContent = 'Загрузить';
  });

  wrap.append(img, input, uploadBtn, fileInput);
  return wrap;
}

function buildTagsField(tags, onChange) {
  const wrap = el('div', { className: 'tags-editor' });
  let list = [...tags];

  function render() {
    wrap.querySelectorAll('.tag').forEach(t => t.remove());
    const input = wrap.querySelector('input');
    list.forEach((tag, i) => {
      const t = el('span', { className: 'tag' });
      t.textContent = tag;
      const rm = el('button', { type: 'button' }, '×');
      rm.addEventListener('click', () => { list.splice(i, 1); onChange(list); render(); });
      t.appendChild(rm);
      wrap.insertBefore(t, input);
    });
  }

  const input = el('input', { type: 'text', placeholder: 'Enter — добавить' });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && input.value.trim()) {
      e.preventDefault();
      list.push(input.value.trim());
      input.value = '';
      onChange(list);
      render();
    }
  });
  wrap.appendChild(input);
  wrap.addEventListener('click', () => input.focus());
  render();
  return wrap;
}

// --- Список (repeatable items) ---

function buildList(field, data) {
  const group = el('div', { className: 'form-group' });
  group.appendChild(el('label', {}, field.label));

  const editor = el('div', { className: 'list-editor' });

  function render() {
    editor.innerHTML = '';
    const list = data[field.key] || [];

    list.forEach((item, index) => {
      const li = el('div', { className: 'list-item' });

      const header = el('div', { className: 'list-item-header' });
      header.appendChild(el('span', { className: 'num' }, String(index + 1)));
      header.appendChild(el('span', { className: 'title' },
        item.title || item.question || item.name || item.key || `Элемент ${index + 1}`));

      const actions = el('div', { className: 'list-item-actions' });
      if (index > 0) {
        const upBtn = el('button', { type: 'button' }, '↑');
        upBtn.addEventListener('click', e => { e.stopPropagation(); swap(list, index, index - 1); render(); });
        actions.appendChild(upBtn);
      }
      if (index < list.length - 1) {
        const downBtn = el('button', { type: 'button' }, '↓');
        downBtn.addEventListener('click', e => { e.stopPropagation(); swap(list, index, index + 1); render(); });
        actions.appendChild(downBtn);
      }
      const delBtn = el('button', { type: 'button', className: 'danger' }, '×');
      delBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm('Удалить этот элемент?')) { list.splice(index, 1); render(); }
      });
      actions.appendChild(delBtn);
      header.appendChild(actions);

      header.appendChild(el('span', { className: 'arrow' }, '▼'));
      header.addEventListener('click', () => li.classList.toggle('collapsed'));

      const body = el('div', { className: 'list-item-body' });
      field.itemFields.forEach(sub => {
        body.appendChild(buildField(sub, item[sub.key], (v) => { item[sub.key] = v; }));
      });

      li.append(header, body);
      editor.appendChild(li);
    });

    const addBtn = el('button', { type: 'button', className: 'list-add' }, '+ Добавить');
    addBtn.addEventListener('click', () => {
      const newItem = {};
      field.itemFields.forEach(f => {
        if (f.type === 'checkbox') newItem[f.key] = false;
        else if (f.type === 'tags') newItem[f.key] = [];
        else newItem[f.key] = '';
      });
      list.push(newItem);
      data[field.key] = list;
      render();
    });
    editor.appendChild(addBtn);
  }

  render();
  group.appendChild(editor);
  return group;
}

// --- Сохранение ---

async function save() {
  const btn = document.getElementById('btn-save');
  const status = document.getElementById('save-status');
  btn.disabled = true;
  status.textContent = 'Сохранение...';
  status.className = 'save-status';

  try {
    const cfg = SECTIONS[currentSection];
    const url = cfg.isLayout
      ? '/api/layout'
      : `/api/data/${currentLang}/${currentSection}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentData),
    });
    const result = await res.json();
    if (result.ok) {
      toast('Сохранено и опубликовано');
      status.textContent = 'Сохранено';
      status.className = 'save-status ok';
    } else {
      toast(result.message || 'Ошибка сборки', true);
      status.textContent = result.message;
      status.className = 'save-status error';
    }
  } catch (e) {
    toast('Ошибка сохранения', true);
    status.textContent = 'Ошибка';
    status.className = 'save-status error';
  }
  btn.disabled = false;
}

// --- Утилиты ---

function el(tag, attrs, text) {
  const e = document.createElement(tag);
  if (attrs) Object.assign(e, attrs);
  if (text) e.textContent = text;
  return e;
}

function swap(arr, i, j) {
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

function toast(msg, isError) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast visible' + (isError ? ' error' : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = 'toast'; }, 3000);
}

// --- Старт ---

loadSection();
