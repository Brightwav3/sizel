"""Back up original PNGs, convert with ImageMagick, then update local references."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from hashlib import sha256
from pathlib import Path
import json
import sqlite3
import subprocess
import zipfile

root = Path(__file__).resolve().parents[1]
images = sorted(p for folder in ('public', 'src') for p in (root / folder).rglob('*.png'))
if not images:
    raise SystemExit('No PNG images remain to convert.')
backup = root.parent / 'rigsmith-backups' / datetime.now().strftime('%Y%m%d-%H%M%S')
backup.mkdir(parents=True, exist_ok=False)
archive = backup / 'original-png-images.zip'
manifest = {p.relative_to(root).as_posix(): {'bytes': p.stat().st_size, 'sha256': sha256(p.read_bytes()).hexdigest()} for p in images}
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_STORED) as z:
    for p in images:
        z.write(p, p.relative_to(root).as_posix())
with zipfile.ZipFile(archive) as z:
    for name, info in manifest.items():
        assert sha256(z.read(name)).hexdigest() == info['sha256'], name
(backup / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(f'BACKUP VERIFIED: {archive} ({len(images)} files)', flush=True)

def convert(p):
    output = p.with_suffix('.webp')
    if output.exists():
        raise RuntimeError(f'Refusing to overwrite {output}')
    args = ['magick', str(p), '-strip']
    if any('logo' in part.lower() for part in p.relative_to(root).parts):
        args += ['-define', 'webp:lossless=true']
    else:
        args += ['-quality', '88', '-define', 'webp:alpha-quality=100']
    subprocess.run(args + [str(output)], check=True, capture_output=True)
    def geometry(path):
        return subprocess.check_output(['magick', 'identify', '-format', '%wx%h %[opaque]', str(path)], text=True)
    assert geometry(p) == geometry(output), f'Dimensions or transparency changed: {p}'
    return output.stat().st_size

with ThreadPoolExecutor(max_workers=3) as pool:
    sizes = []
    for size in pool.map(convert, images):
        sizes.append(size)
        if len(sizes) % 30 == 0:
            print(f'CONVERTED: {len(sizes)}/{len(images)}', flush=True)

# Update assets and source, including computed paths, manifests, and SVG wrappers.
text_extensions = {'.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html', '.svg', '.md'}
for folder in ('src', 'public'):
    for p in (root / folder).rglob('*'):
        if p.is_file() and p.suffix in text_extensions:
            content = p.read_text(encoding='utf-8')
            if '.png' in content:
                p.write_text(content.replace('.png', '.webp'), encoding='utf-8')
index = root / 'index.html'
index.write_text(index.read_text(encoding='utf-8').replace('.png', '.webp'), encoding='utf-8')
database = root / 'public/catalog/products.db'
if database.exists():
    with sqlite3.connect(database) as connection:
        connection.execute("UPDATE products SET image_path=replace(image_path, '.png', '.webp') WHERE image_path LIKE '%.png'")
# Delete only the exact backed-up originals, after every conversion has passed.
for p in images:
    assert p.resolve().is_relative_to(root.resolve())
    p.unlink()
report = {'backup': str(archive), 'count': len(images), 'original_bytes': sum(x['bytes'] for x in manifest.values()), 'webp_bytes': sum(sizes)}
(backup / 'conversion-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report), flush=True)
