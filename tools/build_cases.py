"""Build the standalone case-study pages.

Reads content/cases/<slug>.json and writes cases/<slug>.html.
Run from the repository root:  python3 tools/build_cases.py

Each JSON file holds:
  name, name_en        - case title
  meta, meta_en        - one line: niche, place, years
  lead, lead_en        - one-paragraph summary shown at the top
  cover                - image path relative to the site root
  numbers              - [[value, label_ru, label_en], ...] key results
  source               - [label, url] where the original was published
  blocks               - the case body: {"t": "h2"|"h3"|"p"|"ul"|"ol"|"img"|"quote", ...}
"""
import html
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "content" / "cases"
OUT = ROOT / "cases"

TG = "https://t.me/ais_zar"


def esc(s):
    return html.escape(s or "", quote=True)


def en(attr_text):
    """data-en attribute (HTML allowed inside, so escape for an attribute)."""
    return f' data-en="{esc(attr_text)}"' if attr_text else ""


def rel(path):
    return "../" + path if path and not path.startswith(("http", "../")) else path


def links_external(h):
    return h.replace("<a href=", '<a target="_blank" rel="noopener" href=')


def plural_shots(n):
    if n % 10 == 1 and n % 100 != 11:
        ru = "скриншот"
    elif 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14:
        ru = "скриншота"
    else:
        ru = "скриншотов"
    return f"{n} {ru}", f"{n} screenshot{'s' if n != 1 else ''}"


def shotref(caps, n, url, video=False):
    text = "".join(f"<p>{links_external(c)}</p>" for c in caps)
    if video:
        link = (f'<a class="shotref__link" href="{esc(url)}" target="_blank" rel="noopener" '
                f'data-en="Watch the video on Vimeo">Смотреть видео на Vimeo</a>')
    else:
        ru, en_ = plural_shots(n)
        link = (f'<a class="shotref__link" href="{esc(url)}" target="_blank" rel="noopener" '
                f'data-en="View {en_} in the original">Смотреть {ru} в оригинале</a>')
    kind = " shotref--video" if video else ""
    return (f'<figure class="shotref{kind}"><span class="shotref__ic" aria-hidden="true"></span>'
            f'<figcaption>{text}{link}</figcaption></figure>')


def render_blocks(blocks, src_url=None):
    out, gallery = [], []

    def flush():
        if not gallery:
            return
        tall = all(b.get("h", 1) > b.get("w", 1) * 1.15 for b in gallery)
        cls = "gallery gallery--tall" if tall else "gallery"
        if len(gallery) == 1:
            cls += " gallery--one"
        figs = "".join(
            f'<button type="button" class="shot" aria-label="Открыть изображение" data-en-aria-label="Open image">'
            f'<img src="{esc(rel(b["src"]))}" width="{b.get("w", "")}" height="{b.get("h", "")}" loading="lazy" alt=""></button>'
            for b in gallery
        )
        out.append(f'<div class="{cls}">{figs}</div>')
        gallery.clear()

    for b in blocks:
        t = b["t"]
        if t == "img":
            gallery.append(b)
            continue
        if t == "shots" and all(not x.startswith("http") for x in b["srcs"]):
            # images were copied into the site: show them in place
            for i, x in enumerate(b["srcs"]):
                gallery.append({"src": x, "w": b.get("sizes", [[0, 0]] * 99)[i][0], "h": b.get("sizes", [[0, 0]] * 99)[i][1]})
            continue
        flush()
        if t == "shots":
            out.append(shotref(b.get("caps", []), len(b["srcs"]), src_url))
            continue
        if t == "video":
            out.append(shotref([b["cap"]] if b.get("cap") else [], 1, b["url"], video=True))
            continue
        if t in ("h2", "h3"):
            out.append(f"<{t}>{links_external(b['html'])}</{t}>")
        elif t == "p":
            out.append(f"<p>{links_external(b['html'])}</p>")
        elif t == "quote":
            out.append(f"<blockquote><p>{links_external(b['html'])}</p></blockquote>")
        elif t in ("ul", "ol"):
            start = f' start="{b["start"]}"' if t == "ol" and b.get("start", 1) != 1 else ""
            items = "".join(f"<li>{links_external(i)}</li>" for i in b["items"])
            out.append(f"<{t}{start}>{items}</{t}>")
    flush()
    return "\n".join(out)


def page(slug, c, others):
    numbers = "".join(
        f'<li><b>{esc(v)}</b><span{en(l_en)}>{esc(l_ru)}</span></li>' for v, l_ru, l_en in c["numbers"]
    )
    src_label, src_url = c.get("source", [None, None])
    shots_btn = (
        f'<a class="btn btn--ghost" href="{esc(src_url)}" target="_blank" rel="noopener" data-en="View the screenshots">Ознакомиться со скриншотами</a>'
        if src_url else ""
    )
    source = (
        f'<aside class="shots-note"><div><b data-en="Screenshots and statistics">Скриншоты и статистика</b>'
        f'<p data-en="Profile screenshots, stats and ad results are in the original case on {esc(src_label)}.">Скриншоты профиля, статистика и результаты рекламы в оригинале кейса на {esc(src_label)}.</p></div>'
        f'{shots_btn}</aside>'
        if src_url else ""
    )
    more = "".join(
        f'<li><a href="{esc(o)}.html"><img src="{esc(rel(oc["cover"]))}" alt="" loading="lazy">'
        f'<b{en(oc.get("name_en"))}>{esc(oc["name"])}</b><span{en(oc.get("meta_en"))}>{esc(oc["meta"])}</span></a></li>'
        for o, oc in others
    )
    title_en = c.get("name_en") or c["name"]
    return f"""<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(c["name"])} — кейс Айсылу Зариповой</title>
<meta name="description" content="{esc(c["lead"])}">
<meta property="og:title" content="{esc(c["name"])} — кейс Айсылу Зариповой">
<meta property="og:description" content="{esc(c["lead"])}">
<meta property="og:image" content="{esc(rel(c["cover"]))}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600&family=Unbounded:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../styles.css">
</head>
<body class="cpage-body" data-title-en="{esc(title_en)} — case study by Aisylu Zaripova" data-desc-en="{esc(c.get("lead_en", ""))}">
<a class="skip" href="#main" data-en="Skip to content">К содержанию</a>
<div class="progress" aria-hidden="true"></div>
<header class="top">
  <div class="wrap top__in">
    <a class="brand" href="../" data-en="Aisylu Zaripova">Айсылу Зарипова</a>
    <nav class="nav" aria-label="Навигация">
      <a href="../#cases" data-en="All cases">Все кейсы</a>
      <a href="../#services" data-en="Services">Услуги</a>
      <a href="../#reviews" data-en="Reviews">Отзывы</a>
    </nav>
    <div class="top__act">
      <div class="lang" role="group" aria-label="Язык / Language">
        <button type="button" data-lang="ru" aria-pressed="true">RU</button>
        <button type="button" data-lang="en" aria-pressed="false">EN</button>
      </div>
      <a class="btn btn--sm" href="{TG}" target="_blank" rel="noopener" data-en="Message me">Написать</a>
    </div>
  </div>
</header>

<main id="main">
  <section class="chero">
    <div class="wrap chero__in">
      <div class="chero__text">
        <a class="back" href="../#cases" data-en="Back to all cases">Ко всем кейсам</a>
        <p class="chero__meta"{en(c.get("meta_en"))}>{esc(c["meta"])}</p>
        <h1{en(c.get("name_en"))}>{esc(c["name"])}</h1>
        <p class="chero__lead"{en(c.get("lead_en"))}>{esc(c["lead"])}</p>
        <div class="chero__cta">
          <a class="btn" href="{TG}" target="_blank" rel="noopener" data-en="Discuss a project">Обсудить проект</a>
          {shots_btn}
        </div>
      </div>
      <div class="chero__pic">
        <div class="chero__sun" aria-hidden="true"></div>
        <img src="{esc(rel(c["cover"]))}" alt="" class="{'is-logo' if c.get('cover_logo') else ''}">
      </div>
    </div>
    <div class="wrap">
      <ul class="cnums">{numbers}</ul>
    </div>
  </section>

  <article class="wrap prose">
    <p class="lang-note" data-en="The full case study below is in Russian. The key results above are translated."></p>
    {render_blocks(c["blocks"], src_url)}
    {source}
  </article>

  <section class="contact">
    <div class="wrap">
      <div class="contact__box">
        <div>
          <h2 data-en="Want results like these?">Хотите такие же результаты?</h2>
          <p data-en="Tell me about your project and I’ll suggest where to start.">Расскажите о своём проекте, и я предложу, с чего начать.</p>
        </div>
        <ul class="contact__list">
          <li><span>Telegram</span><a href="{TG}" target="_blank" rel="noopener">@ais_zar</a></li>
          <li><span data-en="WhatsApp / Calls">WhatsApp / Звонки</span><a href="https://wa.me/79872375510" target="_blank" rel="noopener">+7 (987) 237-55-10</a></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="wrap more">
    <h2 data-en="More cases">Другие кейсы</h2>
    <ul class="more__list">{more}</ul>
    <a class="btn btn--ghost" href="../#cases" data-en="All cases">Все кейсы</a>
  </section>
</main>

<dialog class="lightbox" aria-label="Изображение" data-en-aria-label="Image">
  <img src="" alt="">
  <button type="button" class="lightbox__close" aria-label="Закрыть" data-en-aria-label="Close">×</button>
</dialog>

<footer class="foot">
  <div class="wrap foot__in">
    <span data-en="Aisylu Zaripova, international marketer and SMM specialist">Айсылу Зарипова, международный маркетолог и SMM-специалист</span>
    <a href="#main" data-en="Back to top">Наверх</a>
  </div>
</footer>
<script src="../script.js"></script>
</body>
</html>
"""


def main():
    OUT.mkdir(exist_ok=True)
    cases = {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in sorted(SRC.glob("*.json"))}
    order = sorted(cases, key=lambda s: cases[s].get("order", 99))
    for i, slug in enumerate(order):
        others = [(o, cases[o]) for o in order[i + 1:] + order[:i]][:3]
        (OUT / f"{slug}.html").write_text(page(slug, cases[slug], others), encoding="utf-8")
        print("built", f"cases/{slug}.html")


if __name__ == "__main__":
    main()
