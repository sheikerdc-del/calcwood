// tools/build-icons.mjs
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import pngToIco from "png-to-ico";

const OUT_DIR = "icons";
const BG = { r: 11, g: 15, b: 20, alpha: 1 }; // #0b0f14

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function pngFromSvgBuffer(svgBuffer, size, outPath, { background = BG, contain = true } = {}) {
  const img = sharp(svgBuffer, { density: 220 })
    .resize(size, size, { fit: contain ? "contain" : "cover", background, kernel: sharp.kernel.lanczos3, fastShrinkOnLoad: true })
    .toColourspace("srgb")
    .png({ compressionLevel: 9, palette: false });
  const buf = await img.flatten({ background }).toBuffer();
  await fs.writeFile(outPath, buf);
  console.log("icon:", outPath);
}

async function main() {
  try {
    await ensureDir(OUT_DIR);

    const [logoSvg, maskableSvg, faviconSvg] = await Promise.all([
      fs.readFile("src-svg/logo.svg"),
      fs.readFile("src-svg/maskable-icon.svg"),
      fs.readFile("src-svg/favicon.svg")
    ]);

    // App icons
    await pngFromSvgBuffer(logoSvg, 32, path.join(OUT_DIR, "icon-32.png"));
    await pngFromSvgBuffer(logoSvg, 192, path.join(OUT_DIR, "icon-192.png"));
    await pngFromSvgBuffer(logoSvg, 256, path.join(OUT_DIR, "icon-256.png"));
    await pngFromSvgBuffer(logoSvg, 384, path.join(OUT_DIR, "icon-384.png"));
    await pngFromSvgBuffer(logoSvg, 512, path.join(OUT_DIR, "icon-512.png"));

    // Maskable
    await pngFromSvgBuffer(maskableSvg, 512, path.join(OUT_DIR, "icon-512-maskable.png"));

    // Apple touch icon
    await pngFromSvgBuffer(logoSvg, 180, path.join(OUT_DIR, "apple-touch-icon.png"));

    // Favicon: 16 + 32 → .ico
    const fav16 = path.join(OUT_DIR, "favicon-16.png");
    const fav32 = path.join(OUT_DIR, "favicon-32.png");
    await pngFromSvgBuffer(faviconSvg, 16, fav16);
    await pngFromSvgBuffer(faviconSvg, 32, fav32);
    const ico = await pngToIco([fav16, fav32]);
    await fs.writeFile(path.join(OUT_DIR, "favicon.ico"), ico);
    console.log("icon:", path.join(OUT_DIR, "favicon.ico"));
  } catch (err) {
    console.error("Ошибка генерации иконок:", err);
    process.exit(1);
  }
}

await main();