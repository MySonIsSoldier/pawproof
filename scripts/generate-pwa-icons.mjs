import { createRequire } from "node:module";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
// Reuse Next's image processor; the vector icon remains the editable source.
const sharp = require(
  require.resolve("sharp", { paths: [require.resolve("next")] }),
);
const source = await readFile(new URL("../src/app/icon.svg", import.meta.url));
const directory = new URL("../public/pwa/", import.meta.url);
await mkdir(directory, { recursive: true });
for (const size of [192, 512, 180]) {
  await sharp(source)
    .resize(size)
    .png()
    .toFile(
      new URL(
        size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`,
        directory,
      ).pathname,
    );
}
await sharp({
  create: { width: 512, height: 512, channels: 4, background: "#2f6b50" },
})
  .composite([
    {
      input: await sharp(source).resize(358).png().toBuffer(),
      gravity: "centre",
    },
  ])
  .png()
  .toFile(new URL("icon-maskable-512.png", directory).pathname);

// Keep a conventional favicon.ico alongside the App Router's SVG icon route.
// ICO entries may contain PNG payloads, which preserves the source logo's edges.
const faviconSizes = [16, 32, 48];
const faviconPngs = await Promise.all(
  faviconSizes.map((size) => sharp(source).resize(size).png().toBuffer()),
);
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(faviconSizes.length, 4);
const entries = [];
let offset = 6 + faviconSizes.length * 16;
for (const [index, size] of faviconSizes.entries()) {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0);
  entry.writeUInt8(size === 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(faviconPngs[index].length, 8);
  entry.writeUInt32LE(offset, 12);
  entries.push(entry);
  offset += faviconPngs[index].length;
}
await writeFile(
  new URL("../public/favicon.ico", import.meta.url),
  Buffer.concat([header, ...entries, ...faviconPngs]),
);
console.log("Generated PWA icons and favicon.ico from src/app/icon.svg.");
