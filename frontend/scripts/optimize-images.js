/**
 * optimize-images.js
 *
 * Resizes + recompresses oversized raster images IN PLACE (same path, same
 * filename, same extension) so every existing reference keeps working while the
 * byte size drops dramatically. Photographic images that are saved as PNG are
 * left as PNG (no extension change) to avoid breaking references — the big win
 * comes from resizing absurdly large dimensions and recompressing.
 *
 * Run manually:   npm run optimize-images
 * Runs automatically before build via the "prebuild" script.
 *
 * Safe to re-run (idempotent): a manifest records the exact byte size produced
 * for each file, so an already-optimized file is skipped instead of being
 * recompressed again. This means it can run on every build with no progressive
 * quality loss.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Records the optimized size per file so re-runs skip already-done images.
const MANIFEST_PATH = path.join(__dirname, '.image-optim-manifest.json');
const manifest = fs.existsSync(MANIFEST_PATH)
  ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
  : {};

// Directories that are served/bundled as-is and therefore worth optimizing.
const TARGET_DIRS = [
  path.join(rootDir, 'public'),
  // The only image imported from the heavy source assets/ folder.
  path.join(rootDir, 'assets', 'deliveryboy'),
];

const RASTER = new Set(['.png', '.jpg', '.jpeg']);

// Files smaller than this are already fine — skip to keep the run idempotent.
const SKIP_BELOW_BYTES = 45 * 1024; // 45 KB

// Max display width. Icons (markers/logos) get a much smaller cap.
const MAX_WIDTH_DEFAULT = 1600;
const MAX_WIDTH_ICON = 256;

const JPEG_QUALITY = 72;
const PNG_QUALITY = 80;

function isIcon(filePath) {
  const p = filePath.toLowerCase();
  return p.includes('icon') || p.includes('deliveryboy') || p.includes('placeholder') || p.includes('logo');
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (RASTER.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

function fmt(bytes) {
  return (bytes / 1024).toFixed(0) + ' KB';
}

async function optimize(file) {
  const before = fs.statSync(file).size;
  if (before < SKIP_BELOW_BYTES) return { skipped: true, before, after: before };

  // Already optimized in a previous run? (size matches what we last produced)
  const key = path.relative(rootDir, file).replace(/\\/g, '/');
  if (manifest[key] === before) return { skipped: true, before, after: before };

  const ext = path.extname(file).toLowerCase();
  const maxWidth = isIcon(file) ? MAX_WIDTH_ICON : MAX_WIDTH_DEFAULT;

  // Read into a buffer ourselves — letting libvips open the path directly
  // triggers sporadic "UNKNOWN: open" errors on Windows (file-handle/AV locks).
  const input = fs.readFileSync(file);
  const img = sharp(input, { failOn: 'none' });
  const meta = await img.metadata();

  let pipeline = img.rotate(); // respect EXIF orientation
  if (meta.width && meta.width > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
  }

  if (ext === '.jpg' || ext === '.jpeg') {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  } else {
    // PNG: palette quantization + max compression. Keeps the .png extension so
    // no reference changes are needed.
    pipeline = pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9, palette: true });
  }

  const buf = await pipeline.toBuffer();

  // Only overwrite if we actually made it smaller.
  if (buf.length < before) {
    fs.writeFileSync(file, buf);
    manifest[key] = buf.length; // remember the result so re-runs skip it
    return { skipped: false, before, after: buf.length };
  }
  manifest[key] = before;
  return { skipped: true, before, after: before };
}

async function main() {
  const files = TARGET_DIRS.flatMap((d) => walk(d));
  console.log(`\n[optimize-images] scanning ${files.length} raster images...\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  let changed = 0;

  for (const file of files) {
    try {
      const { skipped, before, after } = await optimize(file);
      totalBefore += before;
      totalAfter += after;
      if (!skipped && after < before) {
        changed++;
        const rel = path.relative(rootDir, file);
        const pct = (100 * (1 - after / before)).toFixed(0);
        console.log(`  ${rel}: ${fmt(before)} -> ${fmt(after)} (-${pct}%)`);
      }
    } catch (err) {
      console.warn(`  ! failed: ${path.relative(rootDir, file)} (${err.message})`);
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  const savedMB = ((totalBefore - totalAfter) / (1024 * 1024)).toFixed(1);
  console.log(
    `\n[optimize-images] done. ${changed} files optimized. ` +
      `${(totalBefore / 1048576).toFixed(1)} MB -> ${(totalAfter / 1048576).toFixed(1)} MB ` +
      `(saved ${savedMB} MB)\n`
  );
}

main().catch((err) => {
  console.error('[optimize-images] fatal:', err);
  process.exit(1);
});
