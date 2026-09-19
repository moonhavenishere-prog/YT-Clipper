# Clip Selection Criteria (Step 3 — AI Selection)

Reference for the "Claude reads transcript JSON → outputs clips.json" step
of the pipeline. Load this when actually selecting/scoring clips from a
transcript; SKILL.md only needs the summary.

## Purpose

Transform long-form transcript content (podcasts, interviews, lectures)
into short, high-impact clips optimized for vertical platforms (TikTok,
Reels, YouTube Shorts).

## Core Objective

Pick clips that:
- Capture attention within the first 1–3 seconds
- Deliver a complete, self-contained idea
- Emphasize emotional, controversial, or insight-driven moments
- Work standalone as short-form content

## Clip Constraints

- Each clip: **10–25 seconds** (ideal ~15s)
- Must have a **strong hook in the first sentence**
- Must be **contextually complete** — no missing setup from earlier in the video
- Avoid clips that depend heavily on prior context

## Selection Criteria — prioritize clips containing:

1. **Strong Hooks** — bold statements, surprising claims, contrarian opinions
2. **Emotional Peaks** — passion, frustration, excitement, personal stories/turning points
3. **Insight Density** — clear, valuable takeaways, advice, frameworks
4. **Controversy / Tension** — disagreement, challenging common beliefs

## Avoid

- Long explanations without payoff
- Low-energy or filler dialogue
- Segments requiring prior context
- Generic or obvious statements

## Hook Optimization

For each clip, extract or rewrite the first line to be direct, clear, and
emotionally charged.

- Original: "I think consistency is important"
- Optimized: "Most people fail because they're not consistent"

## Reasoning Requirement

Every clip **must** include a short `reason` explaining why it would
perform well / what makes it engaging. This proves intent, not just
mechanical extraction — never omit it.

## Output Schema

Strict JSON, no markdown, no comments — must be directly consumable by
`scripts/extract.js` (FFmpeg) and `scripts/render.js` (Remotion):

```json
{
  "clips": [
    {
      "title": "Short descriptive title",
      "start": 123,
      "end": 138,
      "hook": "Compelling opening line",
      "reason": "Why this clip works for retention"
    }
  ]
}
```

Write this to `data/clips.json`. This still feeds Step 4 (mandatory
human-readable `.md` review) before any download/cut happens.
