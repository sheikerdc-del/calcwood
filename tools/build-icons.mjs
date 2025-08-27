import sharp from "sharp";
import fs from "node:fs/promises";

await fs.mkdir("icons", { recursive: true });

async function pngFromSvg(svg, size, out) {
  await sharp(svg)
    .resize(size, size, { fit: "contain", background: { r: 11, g: 15, b: 20, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log("icon:", out);
}

await pngFromSvg("src-svg/logo.svg", 32, "icons/icon-32.png");
await pngFromSvg("src-svg/logo.svg", 192, "icons/icon-192.png");
await pngFromSvg("src-svg/logo.svg", 512, "icons/icon-512.png");
await pngFromSvg("src-svg/maskable-icon.svg", 512, "icons/maskable-512.png");

// favicon.ico: используем 32px PNG для широкой совместимости
await sharp("src-svg/favicon.svg").resize(32, 32).png().toFile("icons/favicon-32.png");
await sharp("icons/favicon-32.png").toFile("icons/favicon.ico");
console.log("icon: icons/favicon.ico");