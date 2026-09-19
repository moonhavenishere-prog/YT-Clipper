---
name: yt-clipper
description: >
  Builds and operates the YT Clipper pipeline: turning a YouTube video into
  vertical short clips via transcript fetch, AI clip selection, mandatory
  user approval, automated download/cut, and Remotion rendering. Use when
  the user asks to clip a YouTube video into shorts, fetch/generate a
  YouTube transcript, select or approve clip timestamps, build or edit
  clips.json, run yt-dlp/FFmpeg extraction, render vertical captioned
  videos with Remotion, or scaffold/modify this project's python/,
  scripts/, data/, video/, assets/, Outputs/, projects/, or remotion/
  folders and main.js orchestrator.
---

# YT Clipper

Reusable, modular, cheap content engine that turns a YouTube URL into rendered vertical shorts.

## When to Use This Skill

- User pastes a YouTube URL and wants shorts/clips made from it
- User asks to fetch or parse a YouTube transcript
- User asks Claude to pick clip timestamps/hooks from a transcript
- User asks to review, edit, or approve clip timestamps before download
- User asks to run yt-dlp, cut clips with FFmpeg, or render with Remotion
- User is scaffolding, editing, or debugging any file under `python/`,
  `scripts/`, `data/`, `video/`, `assets/`, `Outputs/`, `projects/`,
  `remotion/`, or `main.js` in this project

## Stack

- **Intelligence Layer**: Claude — clip selection, reasoning, hooks
- **Transcript Layer**: `youtube-transcript-api` — YouTube URL → timestamped transcript JSON
- **Extraction Layer**: `yt-dlp` + FFmpeg — download full video + cut clips
- **Rendering Layer**: Remotion + Node.js — captions, motion, vertical formatting

## Pipeline (Sequential Workflow — follow in order)

### Step 1: Input
Collect the YouTube URL from the user.

### Step 2: Transcript Generation
Run `python/transcript.py` (`youtube-transcript-api`) against the URL.
Output: clean timestamped JSON at `data/transcript.json`.

### Step 3: AI Clip Selection
Read `data/transcript.json` and select the best clips. Output structured
`data/clips.json` — see schema in "Critical Design Decisions" below.

### Step 4: CRITICAL — Mandatory User Review
Before touching yt-dlp or FFmpeg, write an `.md` file listing every
candidate clip's timestamps, hook, title, and transcript excerpt. Present
it to the user and get explicit approval. **Never skip this step and never
proceed to Step 5 without approval** — this is a hard requirement, not a
suggestion.

### Step 5: Download & Extraction
Only after approval: `scripts/extract.js` calls `yt-dlp` to download the
full video to `video/full.mp4`, then FFmpeg cuts each approved clip from
`data/clips.json` into `assets/`.

### Step 6: Rendering
`scripts/render.js` passes clips to Remotion, which renders final vertical
shorts (captions + motion graphics) into `Outputs/`, using per-clip
projects under `projects/` and shared components in `remotion/`.

## Project Structure

Keep it clean and minimal — create these if missing:

```text
project_root/
├── python/
│   └── transcript.py       # Fetches transcript, outputs clean JSON
├── data/
│   ├── transcript.json     # Raw transcript output from Python
│   └── clips.json          # Structured clips JSON from Claude
├── video/
│   └── full.mp4             # Full video downloaded by yt-dlp
├── assets/                  # Clipped video segments cut by FFmpeg
├── Outputs/                 # Final rendered Remotion videos
├── projects/                # Individual Remotion projects
├── remotion/                # Global Remotion components
├── scripts/
│   ├── extract.js           # Node wrapper calling yt-dlp & FFmpeg
│   └── render.js            # Node script triggering Remotion
└── main.js                  # App orchestrator
```

## Responsibility Split

- **Python side**: exclusively fetches transcripts and outputs clean JSON — no clip selection, no rendering.
- **Claude step**: takes the transcript JSON as input and outputs `clips.json` — no direct file downloads or FFmpeg calls.
- **Node.js side**: runs infrastructure only (yt-dlp, FFmpeg, Remotion) — no transcript logic or clip-selection reasoning.

## Critical Design Decisions

- **No Markdown for timestamps in the final pipeline.** Markdown is only for the Step 4 human-review file. Everything FFmpeg/Remotion consume must be structured JSON.
- **`clips.json` schema:**

```json
{
  "clips": [
    {
      "start": 120,
      "end": 135,
      "hook": "This is why most people fail",
      "title": "Discipline Truth"
    }
  ]
}
```

## Environment Variables & API Keys

Store all secrets in a root `.env` (must be gitignored):

```env
# ElevenLabs Configuration (Optional)
ELEVENLABS_API_KEY=your_api_key_here
```

The ElevenLabs Voice ID is not a secret — keep it in `config.json` instead
of `.env` so it's easy to reference from any script.

## Rules & Constraints

- Do **not** use Playwright anywhere in this pipeline.
- Do **not** build manual upload/download steps — yt-dlp + FFmpeg + Remotion handle it end-to-end after approval.
- Always ensure `Outputs/`, `projects/`, and `assets/` exist and are used strictly for their stated purpose — don't mix concerns across folders.
- ElevenLabs voiceover integration is optional; if used, pull `ELEVENLABS_API_KEY` from `.env` and the Voice ID from `config.json`, never hardcode either.

## Quality Checklist

Before finishing any pipeline run, verify:

- [ ] `data/transcript.json` produced and clean (no malformed timestamps)
- [ ] `data/clips.json` matches the schema above
- [ ] Review `.md` file generated and **explicitly approved by the user** before any download/cut happened
- [ ] `video/full.mp4` downloaded and clips correctly cut into `assets/`
- [ ] Remotion render completed into `Outputs/` with captions and motion
- [ ] No secrets committed — `.env` gitignored, only `ELEVENLABS_API_KEY` lives there
- [ ] Folder structure respected (`Outputs/`, `projects/`, `assets/` used correctly)
