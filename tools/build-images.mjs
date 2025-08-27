// tools/build-images.mjs
import sharp from "sharp";
import fs from "node:fs/promises";

await fs.mkdir("covers", { recursive: true });

const THEME_BG = { r: 11, g: 15, b: 20, alpha: 1 }; // #0b0f14

function sharpFromSvg(src, density = 220) {
  return sharp(src, { density, sequentialRead: true, limitInputPixels: false });
}

async function toWebp(src, width, height, out) {
  try {
    await sharpFromSvg(src)
      .resize(width, height, { fit: "cover", kernel: sharp.kernel.lanczos3, fastShrinkOnLoad: true })
      .toColourspace("srgb")
      .webp({ quality: 82, effort: 6 })
      .toFile(out);
    console.log("webp:", out);
  } catch (err) {
    console.error("WEBP error:", out, err);
    throw err;
  }
}

async function toJpg(src, width, height, out) {
  try {
    await sharpFromSvg(src)
      .resize(width, height, { fit: "cover", kernel: sharp.kernel.lanczos3, fastShrinkOnLoad: true })
      .flatten({ background: THEME_BG })
      .toColourspace("srgb")
      .jpeg({ quality: 85, mozjpeg: true, chromaSubsampling: "4:4:4", progressive: true })
      .toFile(out);
    console.log("jpg:", out);
  } catch (err) {
    console.error("JPG error:", out, err);
    throw err;
  }
}

// Hero и OG
await toWebp("src-svg/hero.svg", 1200, 600, "hero.webp");
await toJpg("src-svg/og-image.svg", 1200, 630, "og-image.jpg");

// Covers 1200x675
await toWebp("src-svg/covers/glue.svg", 1200, 675, "covers/glue.webp");
await toWebp("src-svg/covers/fcs.svg", 1200, 675, "covers/fcs.webp");
await toWebp("src-svg/covers/weight.svg", 1200, 675, "covers/weight.webp");
await toWebp("src-svg/covers/3d.svg", 1200, 675, "covers/3d.webp");
await toWebp("src-svg/covers/lumber.svg", 1200, 675, "covers/lumber.webp");
await toWebp("src-svg/covers/fasteners.svg", 1200, 675, "covers/fasteners.webp");