"""Сборка сайта: data/<язык>/*.json + templates/ → dist/.

Запуск: python build.py
Контент правим только в data/ (через админку), вёрстку — в templates/.
"""
import json
import shutil
from datetime import datetime
from pathlib import Path

from jinja2 import ChainableUndefined, Environment, FileSystemLoader
from markupsafe import Markup, escape

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data'
DIST = ROOT / 'dist'

# Что копируется в dist/ как есть
STATIC = ['assets', 'styles.css', 'tokens.css', 'script.js']

# Языковые версии: куда кладём страницу и как из неё дойти до корня сайта
LANGS = {
    'ru': {'out': 'index.html', 'root': ''},
    'en': {'out': 'en/index.html', 'root': '../'},
}

# Служебные надписи (подписи для экранных дикторов и т.п.) — в админке их нет
UI = {
    'ru': {
        'menu': 'Основное меню',
        'open_menu': 'Открыть меню',
        'lang_group': 'Язык сайта',
        'telegram': 'Написать в Telegram',
        'fonts': 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600&display=swap&subset=cyrillic',
    },
    'en': {
        'menu': 'Main menu',
        'open_menu': 'Open menu',
        'lang_group': 'Site language',
        'telegram': 'Message me on Telegram',
        'fonts': 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600&display=swap',
    },
}


def br(text):
    """Перенос строки из админки → <br>, остальной текст экранируется."""
    if not text:
        return ''
    return Markup('<br>').join(escape(line) for line in str(text).split('\n'))


def num(index):
    """Номер пункта: 1 → (01)."""
    return '({:02d})'.format(index)


def accent_title(accent, rest, accent_class):
    """Заголовок с цветной частью в начале: «<span>Мои проекты</span>, которые…».
    Пробел между частями ставится сам, кроме случая, когда остаток начинается со знака препинания."""
    parts = []
    if accent:
        parts.append(Markup('<span class="{}">{}</span>').format(accent_class, accent))
    if rest:
        if accent and rest[:1] not in ',.:;!?)':
            parts.append(' ')
        parts.append(br(rest))
    return Markup('').join(parts)


def load_data(lang):
    """Все JSON языка в один словарь: data/ru/hero.json → data['hero']."""
    data = {}
    for path in sorted((DATA / lang).glob('*.json')):
        data[path.stem] = json.loads(path.read_text(encoding='utf-8'))
    return data


def make_env(root):
    env = Environment(
        loader=FileSystemLoader(ROOT / 'templates'),
        autoescape=True,          # текст из админки не ломает HTML
        trim_blocks=True,
        lstrip_blocks=True,
        keep_trailing_newline=True,
        undefined=ChainableUndefined,  # поля нет в данных — пусто, сборка не падает
    )

    def url(path):
        """Ссылка или картинка: внешние адреса как есть, файлы сайта — от корня."""
        if not path:
            return ''
        if path.startswith(('http://', 'https://', 'mailto:', 'tel:', '#')):
            return path
        return root + path.lstrip('/')

    env.filters.update(br=br, num=num, url=url)
    env.globals.update(accent_title=accent_title)
    return env


def build():
    version = datetime.now().strftime('%Y%m%d%H%M')

    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()

    for name in STATIC:
        src = ROOT / name
        if src.is_dir():
            shutil.copytree(src, DIST / name, ignore=shutil.ignore_patterns('.DS_Store'))
        else:
            shutil.copy2(src, DIST / name)

    for lang, conf in LANGS.items():
        data = load_data(lang)
        reviews = data.get('reviews', {})
        env = make_env(conf['root'])
        html = env.get_template('page.html.j2').render(
            lang=lang,
            root=conf['root'],
            version=version,
            ui=UI[lang],
            # Отзывы видны, только если стоит флажок и отзывов 3+
            reviews_on=bool(reviews.get('show')) and len(reviews.get('list', [])) >= 3,
            **data,
        )
        out = DIST / conf['out']
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html, encoding='utf-8')
        print('Собрано:', out.relative_to(ROOT))


if __name__ == '__main__':
    build()
