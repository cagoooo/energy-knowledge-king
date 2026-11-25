"""產生兩個 QR Code（SVG 給網頁、PNG 給解碼驗證），並用 OpenCV 解碼確認真的指向正確網址。
用法：python scripts/make_qr.py（在專案根目錄執行）"""
import sys
from pathlib import Path

import cv2
import numpy as np
import qrcode
import qrcode.image.svg

ROOT = Path(__file__).resolve().parent.parent
TARGETS = {
    "qr-quiz": "https://ea01.moeaea.gov.tw/e0802/2024game/index.php",
    "qr-form": "https://forms.gle/5JKyZ5D77dZJDfK99",
}

ok = True
for name, url in TARGETS.items():
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=2, box_size=10)
    qr.add_data(url)
    qr.make(fit=True)
    # SVG（單一路徑，縮放不糊）
    svg = qr.make_image(image_factory=qrcode.image.svg.SvgPathImage)
    svg_path = ROOT / "assets" / f"{name}.svg"
    svg.save(str(svg_path))
    # PNG 只用來驗證
    png = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    arr = cv2.cvtColor(np.array(png), cv2.COLOR_RGB2BGR)
    data, _, _ = cv2.QRCodeDetector().detectAndDecode(arr)
    status = "OK" if data == url else "FAIL"
    ok &= data == url
    print(f"{status} {name}: {data}")

sys.exit(0 if ok else 1)
