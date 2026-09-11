import { createRequire } from "node:module";
import { readFile, mkdir } from "node:fs/promises";
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
console.log("Generated four PWA icons from src/app/icon.svg.");
