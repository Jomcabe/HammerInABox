"""Copy only public classroom files to the preview directory."""
from pathlib import Path
import shutil
root = Path(__file__).resolve().parents[1]
dest = root / "dist"
dest.mkdir(exist_ok=True)
for name in ("index.html", "assets", "content"):
    src = root / name
    if src.is_dir():
        shutil.copytree(src, dest / name, dirs_exist_ok=True)
    else:
        shutil.copy2(src, dest / name)
print("Built public classroom in dist/")
