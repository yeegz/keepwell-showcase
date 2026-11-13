"""Turns the captured PNGs into the published WebP screens, the device trio and the hero.
Usage: python3 -I tools/make_screens.py
"""
import pathlib
from PIL import Image, ImageDraw, ImageFilter

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / "out" / "stills"
DEST = HERE.parent / "assets" / "screens"
DEST.mkdir(parents=True, exist_ok=True)
THEME = {
    "light": {"canvas": (242, 240, 234), "edge": (214, 211, 203)},
    "dark": {"canvas": (11, 12, 15), "edge": (52, 54, 60)},
}


def save(im, name, width=None, q=82):
    if width and im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.convert("RGB").save(DEST / f"{name}.webp", "WEBP", quality=q, method=6)


def framed(img, h, radius, theme):
    w = round(img.width * h / img.height)
    img = img.resize((w, h), Image.LANCZOS).convert("RGB")
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius, fill=255)
    out = Image.new("RGBA", (w, h))
    out.paste(img, (0, 0), mask)
    ImageDraw.Draw(out).rounded_rectangle((0, 0, w - 1, h - 1), radius, outline=THEME[theme]["edge"] + (255,), width=3)
    return out


def drop(canvas, piece, xy, theme):
    a = 70 if theme == "light" else 150
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    m = Image.new("RGBA", piece.size, (0, 0, 0, a))
    sh.paste(m, (xy[0], xy[1] + 18), piece.split()[3])
    sh = sh.filter(ImageFilter.GaussianBlur(28))
    canvas.alpha_composite(sh)
    canvas.alpha_composite(piece, xy)


def trio(theme):
    c = Image.new("RGBA", (2560, 1300), THEME[theme]["canvas"] + (255,))
    desk = framed(Image.open(SRC / f"overview-{theme}.png"), 1060, 14, theme)
    tab = framed(Image.open(SRC / f"tablet-dispatch-{theme}.png"), 980, 30, theme)
    phone = framed(Image.open(SRC / f"tech-today-{theme}.png"), 860, 46, theme)
    drop(c, desk, (90, 80), theme)
    drop(c, tab, (1560, 190), theme)
    drop(c, phone, (2120, 360), theme)
    save(c, f"trio-{theme}", width=2400)


pairs = ["landing", "overview", "overview-drawing", "dispatch", "permit", "factory-overview",
         "factory-drawing", "tech-today", "tech-procedure"]
for name in pairs:
    for theme in ("light", "dark"):
        im = Image.open(SRC / f"{name}-{theme}.png")
        save(im, f"{name}-{theme}", width=2400 if im.width > im.height else 1170)
for theme in ("light", "dark"):
    trio(theme)
for f in sorted(DEST.glob("*.webp")):
    print(f"{f.name:34} {f.stat().st_size / 1e3:7.0f} kB")
