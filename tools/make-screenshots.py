# Uso (con la app real ya publicada o corriendo local): python3 tools/make-screenshots.py [URL]
import sys
from playwright.sync_api import sync_playwright
url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8123/"
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 360, "height": 640}, device_scale_factor=3, timezone_id="America/Argentina/Buenos_Aires")
    pg.goto(url); pg.wait_for_selector(".prog")
    pg.screenshot(path="play/graphics/shot-1-grilla.png")
    pg.get_by_role("button", name="Flow").click(); pg.wait_for_timeout(300)
    pg.select_option("#category", "sports"); pg.wait_for_timeout(300)
    pg.screenshot(path="play/graphics/shot-2-filtros.png")
    pg.select_option("#category", "all"); pg.locator(".prog.live").first.click(); pg.wait_for_selector("dialog[open]")
    pg.screenshot(path="play/graphics/shot-3-detalle.png")
    b.close()
