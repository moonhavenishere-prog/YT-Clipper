#!/usr/bin/env node
/**
 * App orchestrator. Drives the pipeline described in CLAUDE.md:
 *   1. Input (YouTube URL)
 *   2. Transcript generation (python/transcript.py)
 *   3. AI clip selection -> data/clips.json (done by Claude, outside this script)
 *   4. CRITICAL: mandatory user review .md file + explicit approval gate
 *   5. Download & extraction (scripts/extract.js) -- only after approval
 *   6. Rendering (scripts/render.js)
 *
 * This orchestrator NEVER calls extract.js/render.js unless the user has
 * approved the review file for the current data/clips.json (see
 * data/.approved marker written by `node main.js approve`).
 *
 * Usage:
 *   node main.js transcript <youtube_url>   # Step 2
 *   node main.js review                     # Step 4a: write review .md from data/clips.json
 *   node main.js approve                    # Step 4b: user confirms -> writes data/.approved
 *   node main.js extract <youtube_url>       # Step 5 (blocked until approved)
 *   node main.js render                      # Step 6
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const CLIPS_PATH = "data/clips.json";
const APPROVAL_MARKER = "data/.approved";
const REVIEW_DIR = "data";

function readClips() {
  if (!fs.existsSync(CLIPS_PATH)) {
    console.error(`Missing ${CLIPS_PATH}. Run clip selection (Claude step) first.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CLIPS_PATH, "utf-8")).clips || [];
}

function hashClips(clips) {
  const { createHash } = require("node:crypto");
  return createHash("sha256").update(JSON.stringify(clips)).digest("hex");
}

function stepTranscript(url) {
  const result = spawnSync("python3", ["python/transcript.py", url], { stdio: "inherit" });
  process.exit(result.status ?? 1);
}

function stepReview() {
  const clips = readClips();
  const lines = [
    "# Clip Review — approve before download/extraction",
    "",
    "Check every clip below. Run `node main.js approve` only once you accept",
    "all timestamps, hooks, and titles as-is.",
    "",
  ];

  clips.forEach((clip, i) => {
    lines.push(`## ${i + 1}. ${clip.title}`);
    lines.push(`- **Start:** ${clip.start}s`);
    lines.push(`- **End:** ${clip.end}s`);
    lines.push(`- **Hook:** ${clip.hook}`);
    if (clip.reason) lines.push(`- **Why it works:** ${clip.reason}`);
    if (clip.excerpt) lines.push(`- **Excerpt:** ${clip.excerpt}`);
    lines.push("");
  });

  fs.mkdirSync(REVIEW_DIR, { recursive: true });
  const reviewPath = path.join(REVIEW_DIR, "clip-review.md");
  fs.writeFileSync(reviewPath, lines.join("\n"));
  console.log(`Wrote review file: ${reviewPath}`);
  console.log("Review it, then run `node main.js approve` to unlock download/extraction.");
}

function stepApprove() {
  const clips = readClips();
  fs.writeFileSync(APPROVAL_MARKER, hashClips(clips));
  console.log(`Approved ${clips.length} clip(s). Extraction is now unlocked.`);
}

function assertApproved() {
  const clips = readClips();
  if (!fs.existsSync(APPROVAL_MARKER)) {
    console.error(
      "Blocked: clips have not been approved yet. Run `node main.js review` then `node main.js approve` first."
    );
    process.exit(1);
  }
  const approvedHash = fs.readFileSync(APPROVAL_MARKER, "utf-8").trim();
  if (approvedHash !== hashClips(clips)) {
    console.error(
      `Blocked: ${CLIPS_PATH} changed since approval. Re-run \`node main.js review\` then \`node main.js approve\`.`
    );
    process.exit(1);
  }
}

function stepExtract(url) {
  assertApproved();
  const result = spawnSync("node", ["scripts/extract.js", url], { stdio: "inherit" });
  process.exit(result.status ?? 1);
}

function stepRender() {
  assertApproved();
  const result = spawnSync("node", ["scripts/render.js"], { stdio: "inherit" });
  process.exit(result.status ?? 1);
}

function main() {
  const [command, arg] = process.argv.slice(2);

  switch (command) {
    case "transcript":
      if (!arg) {
        console.error("Usage: node main.js transcript <youtube_url>");
        process.exit(1);
      }
      return stepTranscript(arg);
    case "review":
      return stepReview();
    case "approve":
      return stepApprove();
    case "extract":
      if (!arg) {
        console.error("Usage: node main.js extract <youtube_url>");
        process.exit(1);
      }
      return stepExtract(arg);
    case "render":
      return stepRender();
    default:
      console.error(
        "Usage: node main.js <transcript|review|approve|extract|render> [args]"
      );
      process.exit(1);
  }
}

main();
