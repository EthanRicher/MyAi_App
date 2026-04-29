// Pads Logo_No_Text.png onto a 1024x1024 transparent canvas at ~70% size
// so the logo fits inside iOS/Android/Expo Go icon masks (circle, squircle,
// rounded square) without getting clipped at the corners.
//
// Run once whenever the logo changes:  node scripts/make-icon.js

const path = require("path");
const sharp = require("sharp");

const SRC = path.join(__dirname, "..", "src", "assets", "Logo_No_Text.png");
const OUT_ICON = path.join(__dirname, "..", "src", "assets", "icon.png");
const OUT_ADAPTIVE = path.join(__dirname, "..", "src", "assets", "icon-adaptive.png");

const CANVAS = 1024;
const SAFE = 0.7; // logo occupies inner 70% of the canvas
const ADAPTIVE_SAFE = 0.55; // adaptive icons get cropped harder; pad more

const buildIcon = async (safe, output, label) => {
  const target = Math.round(CANVAS * safe);
  const resized = await sharp(SRC)
    .resize({ width: target, height: target, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, gravity: "center" }])
    .png()
    .toFile(output);

  console.log(`✓ ${label} → ${output}`);
};

(async () => {
  await buildIcon(SAFE, OUT_ICON, "icon (iOS / generic)");
  await buildIcon(ADAPTIVE_SAFE, OUT_ADAPTIVE, "adaptive (Android foreground)");
})();
