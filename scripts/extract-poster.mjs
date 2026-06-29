// Extract the EXACT first frame of the real approach video as the hero poster.
// Lossless PNG, no crop / no transformation — it must match video frame 0 so the
// static arrival image and the start of the scrub are identical.
//
// Usage: node scripts/extract-poster.mjs [inputPath] [outputPath]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const input =
  process.argv[2] ||
  path.resolve("assets/references/mairie-dunkerque-approach-reference.mp4");
const output =
  process.argv[3] || path.resolve("website/public/img/mairie-dunkerque-hero.png");

fs.mkdirSync(path.dirname(output), { recursive: true });

// First decoded frame, written losslessly to PNG.
const args = ["-y", "-i", input, "-frames:v", "1", "-update", "1", output];

console.log("ffmpeg:", ffmpegPath);
console.log("input :", input);
console.log("output:", output);
execFileSync(ffmpegPath, args, { stdio: "inherit" });
console.log("\nDone. Wrote", output);
