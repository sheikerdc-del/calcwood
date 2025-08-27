import sharp from "sharp";
import fs from "node:fs/promises";

await fs.mkdir("covers", { recursive: true });

async function toWebp(src, width, height, out) {
  await sharp(src).resize(width, height, { fit: "cover" }).webp({ quality: 78, effort: 5 }).toFile(out);
  console.log("webp:", out);
}

async function toJpg(src, width, height, out) {
  await sharp(src).resize(width, height, { fit: "cover" }).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
  console.log("jpg:", out);
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