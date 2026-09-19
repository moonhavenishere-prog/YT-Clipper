#!/usr/bin/env node
/**
 * Node wrapper calling yt-dlp & FFmpeg (per CLAUDE.md responsibility split:
 * Node.js side only runs infrastructure — no transcript or clip-selection
 * logic lives here).
 *
 * MUST only be run after the user has approved the review .md file
 * generated in Step 4 of the pipeline. This script does not itself
 * enforce that approval — the orchestrator (main.js) is responsible for
 * gating this call on approval.
 *
 * Usage:
 *   node scripts/extract.js <youtube_url> [--clips data/clips.json] [--video video/full.mp4] [--assets assets]
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function parseArgs(argv) {
  const [url, ...rest] = argv;
  const opts = {
    clips: "data/clips.json",
    video: "video/full.mp4",
    assets: "assets",
  };
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i].replace(/^--/, "");
    if (key in opts) opts[key] = rest[i + 1];
  }
  return { url, ...opts };
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${cmd} exited with code ${result.status}`);
  }
}

function downloadVideo(url, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  run("yt-dlp", ["-f", "mp4", "-o", outputPath, url]);
}

function cutClip(videoPath, clip, outputPath) {
  const duration = clip.end - clip.start;
  run("ffmpeg", [
    "-y",
    "-ss", String(clip.start),
    "-i", videoPath,
    "-t", String(duration),
    "-c", "copy",
    outputPath,
  ]);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function main() {
  const { url, clips: clipsPath, video: videoPath, assets: assetsDir } = parseArgs(
    process.argv.slice(2)
  );

  if (!url) {
    console.error("Usage: node scripts/extract.js <youtube_url> [--clips path] [--video path] [--assets dir]");
    process.exit(1);
  }

  const { clips } = JSON.parse(fs.readFileSync(clipsPath, "utf-8"));
  if (!clips || clips.length === 0) {
    console.error(`No clips found in ${clipsPath}`);
    process.exit(1);
  }

  console.log(`Downloading full video via yt-dlp -> ${videoPath}`);
  downloadVideo(url, videoPath);

  fs.mkdirSync(assetsDir, { recursive: true });

  clips.forEach((clip, index) => {
    const filename = `${String(index + 1).padStart(2, "0")}-${slugify(clip.title)}.mp4`;
    const outputPath = path.join(assetsDir, filename);
    console.log(`Cutting clip ${index + 1}/${clips.length}: ${clip.title} (${clip.start}s-${clip.end}s)`);
    cutClip(videoPath, clip, outputPath);
  });

  console.log(`Done. ${clips.length} clip(s) written to ${assetsDir}/`);
}

main();
