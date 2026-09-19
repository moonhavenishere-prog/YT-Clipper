const { Composition } = require("remotion");
const { ShortVideo } = require("./ShortVideo");

const FPS = 30;

/**
 * Global Remotion entry point (per CLAUDE.md: shared components live here,
 * individual rendered projects live under projects/).
 *
 * render.js passes `videoSrc`, `captions`, and `durationInFrames` as
 * `defaultProps`/`inputProps` per clip.
 */
function RemotionRoot() {
  return (
    <Composition
      id="ShortVideo"
      component={ShortVideo}
      durationInFrames={FPS * 15}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{
        videoSrc: "",
        title: "",
        captions: [],
      }}
    />
  );
}

module.exports = { RemotionRoot };
