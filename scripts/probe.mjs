// Probe a video file (codec, resolution, fps, duration, frame count) using ffprobe-static.
// Usage: node scripts/probe.mjs [inputPath]
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import ffprobe from 'ffprobe-static';

const input =
  process.argv[2] ||
  path.resolve('assets/references/mairie-dunkerque-approach-reference.mp4');

const out = execFileSync(ffprobe.path, [
  '-v', 'error',
  '-select_streams', 'v:0',
  '-show_entries',
  'stream=width,height,codec_name,r_frame_rate,avg_frame_rate,nb_frames,duration,bit_rate',
  '-show_entries', 'format=duration,size,bit_rate',
  '-of', 'json',
  input,
]);

console.log('input:', input);
console.log(out.toString());
