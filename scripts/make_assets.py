"""一次產出網站圖示全套與社群分享圖（OG 圖）。
用法：python scripts/make_assets.py（在專案根目錄執行，需要 Python Playwright＋Pillow）
產出：
  favicon.ico（16/32/48）、apple-touch-icon.png（180，滿版底色）
  icons/icon-192.png、icons/icon-512.png、icons/icon-192-maskable.png、icons/icon-512-maskable.png
  og-image.jpg（1200×630，給 LINE／Facebook 分享卡片）
"""
from io import BytesIO
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SVG = (ROOT / "favicon.svg").read_text(encoding="utf-8")
BG = "linear-gradient(180deg,#56AEEA,#2C78BC)"


def icon_html(size: int, mode: str) -> str:
    """mode: plain＝原本圓角圖示；full＝滿版底色（apple-touch、maskable 用），主視覺縮小置中"""
    if mode == "plain":
        inner = f'<div style="width:{size}px;height:{size}px">{SVG}</div>'
        bg = "transparent"
    else:
        scale = 0.92 if mode == "full" else 0.66  # maskable 要留安全區
        s = round(size * scale)
        # 去掉 SVG 本身的圓角底，改由外層滿版底色
        svg = SVG.replace('<rect width="64" height="64" rx="14" fill="url(#bg)"/>', "")
        inner = f'<div style="width:{s}px;height:{s}px">{svg}</div>'
        bg = BG
    return f"""<html><body style="margin:0;width:{size}px;height:{size}px;display:grid;place-items:center;background:{bg}">
    <style>svg{{width:100%;height:100%;display:block}}</style>{inner}</body></html>"""


def shot(page, html: str, size: int) -> Image.Image:
    page.set_viewport_size({"width": size, "height": size})
    page.set_content(html)
    png = page.screenshot(omit_background=True, clip={"x": 0, "y": 0, "width": size, "height": size})
    return Image.open(BytesIO(png)).convert("RGBA")


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(device_scale_factor=1)

    # favicon.ico：16 用較小圓角的同一張圖（瀏覽器分頁很小，主體要大）
    icos = [shot(page, icon_html(s, "plain"), s) for s in (16, 32, 48)]
    icos[2].save(ROOT / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)], append_images=icos[:2])

    shot(page, icon_html(180, "full"), 180).convert("RGB").save(ROOT / "apple-touch-icon.png")
    for s in (192, 512):
        shot(page, icon_html(s, "plain"), s).save(ROOT / "icons" / f"icon-{s}.png")
        shot(page, icon_html(s, "maskable"), s).convert("RGB").save(ROOT / "icons" / f"icon-{s}-maskable.png")

    # OG 圖：用 HTML 排版後截圖（Google Fonts 思源黑體，等字型載入完）
    og = browser.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
    og.goto((ROOT / "scripts" / "og.html").as_uri())
    og.wait_for_load_state("networkidle")
    og.evaluate("document.fonts.ready")
    og.wait_for_timeout(400)
    img = Image.open(BytesIO(og.screenshot())).convert("RGB")
    img.save(ROOT / "og-image.jpg", quality=88, optimize=True, progressive=True)
    browser.close()

for f in ["favicon.ico", "apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png",
          "icons/icon-192-maskable.png", "icons/icon-512-maskable.png", "og-image.jpg"]:
    path = ROOT / f
    print(f"{f}: {Image.open(path).size} {path.stat().st_size // 1024} KB")
