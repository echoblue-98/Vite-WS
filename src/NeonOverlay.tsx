import React from 'react';

// Lightweight CSS-only neon scanlines + vignette overlay
// Sits behind other backgrounds; no events, no logic.
const NeonOverlay: React.FC<{ opacity?: number }>= ({ opacity = 0.8 }) => {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity,
        backgroundImage: `
          radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%),
          repeating-linear-gradient(
            to bottom,
            rgba(0, 255, 247, 0.045) 0px,
            rgba(0, 255, 247, 0.045) 1px,
            rgba(0, 0, 0, 0) 1px,
            rgba(0, 0, 0, 0) 3px
          )
        `,
        backgroundBlendMode: 'normal, screen',
        filter: 'saturate(1.15)',
      }}
    />
  );
};

export default NeonOverlay;
