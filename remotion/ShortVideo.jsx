const { AbsoluteFill, OffthreadVideo, useCurrentFrame, useVideoConfig } = require("remotion");

/**
 * Shared vertical-short composition: full-bleed clip video + animated
 * caption overlay driven by the current caption for this frame.
 *
 * `captions` shape: [{ text: string, startFrame: number, endFrame: number }]
 */
function ShortVideo({ videoSrc, title, captions = [] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activeCaption = captions.find(
    (c) => frame >= c.startFrame && frame < c.endFrame
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <OffthreadVideo src={videoSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

      {title ? (
        <AbsoluteFill
          style={{
            justifyContent: "flex-start",
            alignItems: "center",
            paddingTop: 80,
          }}
        >
          <div
            style={{
              fontFamily: "sans-serif",
              fontWeight: 800,
              fontSize: 56,
              color: "white",
              textAlign: "center",
              textShadow: "0 4px 12px rgba(0,0,0,0.6)",
              maxWidth: "85%",
            }}
          >
            {title}
          </div>
        </AbsoluteFill>
      ) : null}

      {activeCaption ? (
        <AbsoluteFill
          style={{
            justifyContent: "flex-end",
            alignItems: "center",
            paddingBottom: 160,
          }}
        >
          <div
            style={{
              fontFamily: "sans-serif",
              fontWeight: 700,
              fontSize: 48,
              color: "white",
              textAlign: "center",
              background: "rgba(0,0,0,0.55)",
              padding: "12px 24px",
              borderRadius: 12,
              maxWidth: "90%",
            }}
          >
            {activeCaption.text}
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
}

module.exports = { ShortVideo };
