const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const DIST_DIR = path.join(__dirname, 'dist');
const IMG_DIR = path.join(__dirname, 'assets', 'img');
const ADMIN_CONFIG = path.join(__dirname, 'admin-config.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'sofi-portfolio-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));

const upload = multer({
  storage: multer.diskStorage({
    destination: IMG_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext)
        .replace(/[^a-zA-Zа-яА-Я0-9_-]/g, '-')
        .toLowerCase();
      cb(null, name + ext);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

function getConfig() {
  if (!fs.existsSync(ADMIN_CONFIG)) return null;
  return JSON.parse(fs.readFileSync(ADMIN_CONFIG, 'utf-8'));
}

function requireAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.redirect('/admin/login');
}

function rebuild() {
  try {
    const py = fs.existsSync(path.join(__dirname, '.venv', 'bin', 'python'))
      ? path.join(__dirname, '.venv', 'bin', 'python')
      : 'python3';
    execSync(`${py} build.py`, { cwd: __dirname, timeout: 30000 });
    return true;
  } catch (e) {
    console.error('Ошибка сборки:', e.message);
    return false;
  }
}

// --- Страницы админки ---

app.get('/admin/login', (req, res) => {
  if (req.session && req.session.admin) return res.redirect('/admin');
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.post('/admin/login', (req, res) => {
  const config = getConfig();
  if (!config) return res.redirect('/admin/setup');

  const { email, password } = req.body;
  if (email === config.email && bcrypt.compareSync(password, config.password)) {
    req.session.admin = true;
    return res.redirect('/admin');
  }
  res.redirect('/admin/login?error=1');
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

app.get('/admin/setup', (req, res) => {
  if (getConfig()) return res.redirect('/admin/login');
  res.sendFile(path.join(__dirname, 'admin', 'setup.html'));
});

app.post('/admin/setup', (req, res) => {
  if (getConfig()) return res.redirect('/admin/login');
  const { email, password } = req.body;
  if (!email || !password || password.length < 6) {
    return res.redirect('/admin/setup?error=1');
  }
  const config = {
    email,
    password: bcrypt.hashSync(password, 10),
  };
  fs.writeFileSync(ADMIN_CONFIG, JSON.stringify(config, null, 2));
  req.session.admin = true;
  res.redirect('/admin');
});

app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// --- API ---

app.get('/api/layout', requireAuth, (req, res) => {
  const file = path.join(DATA_DIR, 'layout.json');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Не найден' });
  res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
});

app.put('/api/layout', requireAuth, (req, res) => {
  const file = path.join(DATA_DIR, 'layout.json');
  fs.writeFileSync(file, JSON.stringify(req.body, null, 2) + '\n', 'utf-8');
  const ok = rebuild();
  res.json({ ok, message: ok ? 'Сохранено и опубликовано' : 'Сохранено, но сборка не удалась' });
});

app.get('/api/data/:lang/:section', requireAuth, (req, res) => {
  const { lang, section } = req.params;
  if (!/^(ru|en)$/.test(lang) || !/^[a-z]+$/.test(section)) {
    return res.status(400).json({ error: 'Неверные параметры' });
  }
  const file = path.join(DATA_DIR, lang, section + '.json');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Не найден' });
  res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
});

app.put('/api/data/:lang/:section', requireAuth, (req, res) => {
  const { lang, section } = req.params;
  if (!/^(ru|en)$/.test(lang) || !/^[a-z]+$/.test(section)) {
    return res.status(400).json({ error: 'Неверные параметры' });
  }
  const file = path.join(DATA_DIR, lang, section + '.json');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Не найден' });

  fs.writeFileSync(file, JSON.stringify(req.body, null, 2) + '\n', 'utf-8');

  const ok = rebuild();
  res.json({ ok, message: ok ? 'Сохранено и опубликовано' : 'Сохранено, но сборка не удалась' });
});

app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
  res.json({ path: 'assets/img/' + req.file.filename });
});

app.get('/api/images', requireAuth, (req, res) => {
  const files = fs.readdirSync(IMG_DIR)
    .filter(f => /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(f))
    .sort();
  res.json(files.map(f => 'assets/img/' + f));
});

// --- Статика админки и сайта ---

app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(DIST_DIR));

// Fallback для SPA-роутов сайта
app.get('*', (req, res) => {
  const file = path.join(DIST_DIR, req.path === '/' ? 'index.html' : req.path);
  if (fs.existsSync(file)) return res.sendFile(file);
  res.status(404).sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Сайт: http://localhost:${PORT}`);
  console.log(`Админка: http://localhost:${PORT}/admin`);
});
