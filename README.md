# 能源知識王線上競賽

桃園市能源教育學校系列活動（桃園市龍潭國民小學辦理）的活動說明網站。

- 線上網址：https://cagoooo.github.io/energy-knowledge-king/
- 活動期間：115 年 11 月 23 日（一）～ 12 月 7 日（一）
- 能源知識題庫：https://ea01.moeaea.gov.tw/e0802/2024game/index.php
- 通關截圖上傳區：https://forms.gle/5JKyZ5D77dZJDfK99

## 檔案說明

| 檔案 | 用途 |
|---|---|
| `index.html`、`css/`、`js/app.js` | 網站本體（RWD：桌機／平板／手機） |
| `sw.js`、`js/sw-register.js`、`version.json` | Service Worker 與「有新版本」更新提示 |
| `favicon.*`、`apple-touch-icon.png`、`icons/`、`manifest.webmanifest` | 網站圖示 |
| `og-image.jpg` | LINE／Facebook 分享卡片圖（1200×630） |
| `scripts/make_assets.py` | 重新產生圖示與分享圖（需要 Python Playwright） |
| `scripts/make_qr.py` | 重新產生 QR Code 並解碼驗證 |
| `.github/workflows/deploy.yml` | 推到 main 後自動部署到 GitHub Pages |

## 版本號

不用手動升版。部署時 `.github/stamp_version.py` 會把所有 `__BUILD_VERSION__` 換成「提交時間＋提交編號」，
`sw.js` 內容因此每次都不同，已開著網站的人會在畫面下方看到「網站有新版本」提示。

---

Made with ❤️ by [阿凱老師](https://cagoooo.github.io/Akai/)
