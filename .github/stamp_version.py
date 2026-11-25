"""部署前把 __BUILD_VERSION__ 換成這次的版本號（sw.js、version.json、index.html、manifest 一次換完，不必手動升版）。
用法：python3 .github/stamp_version.py <資料夾> <版本號>"""
import sys
from pathlib import Path

root, version = Path(sys.argv[1]), sys.argv[2]
count = 0
for path in root.rglob("*"):
    if path.suffix.lower() not in {".html", ".js", ".json", ".webmanifest"} or not path.is_file():
        continue
    text = path.read_text(encoding="utf-8")
    if "__BUILD_VERSION__" in text:
        path.write_text(text.replace("__BUILD_VERSION__", version), encoding="utf-8")
        count += 1
        print(f"stamped {path.relative_to(root)}")
print(f"version {version}: {count} files")
if count == 0:
    sys.exit("找不到任何 __BUILD_VERSION__，蓋章失敗")
