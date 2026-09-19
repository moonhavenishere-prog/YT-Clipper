#!/usr/bin/env node
/**
 * Node script triggering Remotion (per CLAUDE.md responsibility split:
 * infrastructure only — no clip-selection reasoning here).
 *
 * Reads data/clips.json + the cut clips in assets/, generates one Remotion
 * project entry per clip under projects/, bundles the shared remotion/
 * entry point, and renders final vertical shorts into Outputs/.
 *
 * Usage:
 *   node scripts/render.js [--clips data/clips.json] [--assets assets] [--outputs Outputs]
 */

const fs = require("node:fs");
const path = require("node:path");
const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");

function parseArgs(argv) {
  const opts = {
    clips: "data/clips.json",
    assets: "assets",
    outputs: "Outputs",
  };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "");
    if (key in opts) opts[key] = argv[i + 1];
  }
  return opts;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const { clips: clipsPath, assets: assetsDir, outputs: outputsDir } = parseArgs(
    process.argv.slice(2)
  );

  const { clips } = JSON.parse(fs.readFileSync(clipsPath, "utf-8"));
  if (!clips || clips.length === 0) {
    console.error(`No clips found in ${clipsPath}`);
    process.exit(1);
  }

  fs.mkdirSync(outputsDir, { recursive: true });
  fs.mkdirSync("projects", { recursive: true });

  console.log("Bundling Remotion project (remotion/index.js)...");
  const bundleLocation = await bundle({
    entryPoint: path.resolve("remotion/index.js"),
  });

  for (const [index, clip] of clips.entries()) {
    const slug = slugify(clip.title);
    const clipFilename = `${String(index + 1).padStart(2, "0")}-${slug}.mp4`;
    const clipPath = path.resolve(assetsDir, clipFilename);

    if (!fs.existsSync(clipPath)) {
      console.warn(`Skipping "${clip.title}": expected cut clip not found at ${clipPath}`);
      continue;
    }

    // Per-clip project record kept under projects/ so each render is
    // reproducible/inspectable independently of the others.
    const projectDir = path.join("projects", slug);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(
      path.join(projectDir, "project.json"),
      JSON.stringify(clip, null, 2)
    );

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "ShortVideo",
      inputProps: {
        videoSrc: clipPath,
        title: clip.title,
        captions: clip.captions || [],
      },
    });

    const outputPath = path.join(outputsDir, `${slug}.mp4`);
    console.log(`Rendering "${clip.title}" -> ${outputPath}`);

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: outputPath,
      inputProps: {
        videoSrc: clipPath,
        title: clip.title,
        captions: clip.captions || [],
      },
    });
  }

  console.log(`Done. Rendered shorts written to ${outputsDir}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
