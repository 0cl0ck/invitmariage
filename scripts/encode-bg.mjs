// Re-encode the real Dunkirk town-hall approach video to ALL-KEYFRAME H.264.
// Every frame becomes a keyframe so the scroll-scrubbed <video> can seek to any
// frame instantly and smoothly.
//
// IMPORTANT (anti-hallucination rule): this script ONLY re-encodes (and, if ever
// needed, would only crop/scale). It does NOT alter, regenerate, or reinvent the
// town hall in any way.
//
// Usage: node scripts/encode-bg.mjs [inputPath] [outputPath]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import ffmpegPath from 'ffmpeg-static';

const input =
  process.argv[2] ||
  path.resolve('assets/references/mairie-dunkerque-approach-reference.mp4');
const output = process.argv[3] || path.resolve('website/public/bg.mp4');

fs.mkdirSync(path.dirname(output), { recursive: true });

// All-keyframe (intra-only) settings:
//  -g 1 / -keyint_min 1            -> GOP of 1 => every frame is an IDR keyframe
//  -x264-params scenecut=0:open_gop=0 -> no scene-cut / open-GOP surprises
//  -crf 16                         -> higher quality, identity preserved
//  -pix_fmt yuv420p                -> universal browser playback
//  -movflags +faststart            -> moov atom up front for fast web start
//  -an                             -> drop audio (background visual only)
// NB: source is 720p; this re-encode removes encoding loss but cannot add real
// resolution. No AI upscaling (anti-hallucination rule for the town hall).
const args = [
  '-y',
  '-i', input,
  '-an',
  '-c:v', 'libx264',
  '-preset', 'slower',
  '-crf', '16',
  '-pix_fmt', 'yuv420p',
  '-g', '1',
  '-keyint_min', '1',
  '-x264-params', 'scenecut=0:open_gop=0',
  '-movflags', '+faststart',
  output,
];

console.log('ffmpeg:', ffmpegPath);
console.log('input :', input);
console.log('output:', output);
execFileSync(ffmpegPath, args, { stdio: 'inherit' });
console.log('\nDone. Wrote', output);
