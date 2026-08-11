import React, { useEffect, useRef, useState } from "react";

import { mountGlowRings } from "./glowRuntime.js";

// Styles injection for the Prism glow container.

const STYLE_ID = "prism-glow-styles";

const CSS = String.raw`
@property --aie-spin-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

@property --aie-trim-progress {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

.aie-glow-root {
  position: relative;
  display: inline-block;
  border-radius: var(--aie-radius, 32px);
  overflow: hidden;
}

.aie-glow-rings {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
  opacity: var(--aie-glow-opacity, 1);
  transform: scale(var(--aie-glow-scale, 1));
  filter:
    saturate(calc(var(--aie-glow-saturation, 1) * (1 + var(--aie-glow-intensity, 1) * 0.32)))
    brightness(calc(0.84 + var(--aie-glow-intensity, 1) * 0.12))
    contrast(calc(0.98 + var(--aie-glow-intensity, 1) * 0.04));
  transform-origin: center;
  transition:
    opacity var(--aie-visibility-opacity-duration, var(--aie-visibility-duration, 520ms)) var(--aie-visibility-opacity-easing, var(--aie-visibility-easing, cubic-bezier(0.22, 1, 0.36, 1))),
    transform var(--aie-visibility-transform-duration, var(--aie-visibility-duration, 520ms)) var(--aie-visibility-transform-easing, var(--aie-visibility-easing, cubic-bezier(0.22, 1, 0.36, 1))),
    filter var(--aie-visibility-opacity-duration, var(--aie-visibility-duration, 520ms)) var(--aie-visibility-opacity-easing, ease),
    --aie-trim-progress var(--aie-visibility-duration, 520ms) var(--aie-visibility-easing, cubic-bezier(0.22, 1, 0.36, 1));
}

.aie-glow-visual {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  transition:
    --aie-trim-progress var(--aie-visibility-duration, 520ms) var(--aie-visibility-easing, cubic-bezier(0.22, 1, 0.36, 1));
}

.aie-glow-outline {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  border-radius: var(--aie-radius, 32px);
  padding: var(--aie-outline-width, 0px);
  background: linear-gradient(var(--aie-outline-color, rgba(255, 255, 255, 0.4)), var(--aie-outline-color, rgba(255, 255, 255, 0.4)));
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  filter:
    blur(var(--aie-outline-softness, 1.75px))
    saturate(0.9);
  opacity: var(--aie-outline-opacity, 1);
  transition:
    opacity var(--aie-visibility-opacity-duration, var(--aie-visibility-duration, 520ms)) var(--aie-visibility-opacity-easing, var(--aie-visibility-easing, cubic-bezier(0.22, 1, 0.36, 1))),
    filter 180ms ease,
    --aie-trim-progress var(--aie-visibility-duration, 520ms) var(--aie-visibility-easing, cubic-bezier(0.22, 1, 0.36, 1));
}

.aie-glow-content {
  position: relative;
  z-index: 2;
}

.aie-glow-root[data-visibility-preset="trim"] .aie-glow-rings,
.aie-glow-root[data-visibility-preset="trim"] .aie-glow-outline {
  opacity: 1;
  transform: none;
}

.aie-glow-root[data-visibility-preset="trim"] .aie-glow-visual {
  opacity: clamp(0, calc(var(--aie-trim-progress, 0) * 18), 1);
  -webkit-mask-image: conic-gradient(
    from -90deg,
    #000 0turn,
    #000 calc(var(--aie-trim-progress, 0) * 1turn),
    transparent calc(var(--aie-trim-progress, 0) * 1turn),
    transparent 1turn
  );
  mask-image: conic-gradient(
    from -90deg,
    #000 0turn,
    #000 calc(var(--aie-trim-progress, 0) * 1turn),
    transparent calc(var(--aie-trim-progress, 0) * 1turn),
    transparent 1turn
  );
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}

.aie-effect-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.aie-ring-container {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--aie-radius, 32px);
}

.aie-gradient-buffer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: var(--aie-radius, 32px);
  background-repeat: no-repeat;
  background-image: conic-gradient(from var(--aie-spin-angle, 0deg), var(--aie-gradient-stops));
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  transition-property: opacity;
  animation-name: aie-gradient-spin;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: opacity;
}

@keyframes aie-gradient-spin {
  from {
    --aie-spin-angle: 0deg;
  }

  to {
    --aie-spin-angle: 360deg;
  }
}
`;

function injectStylesOnce() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;

  const styleTag = document.createElement("style");
  styleTag.id = STYLE_ID;
  styleTag.innerHTML = CSS;
  document.head.appendChild(styleTag);
}

/**
 * Renders the Prism glow border around arbitrary content.
 */
export function PrismGlow({
  radius = 50,
  className = "",
  style = {},
  colors,
  rotationDirection = "clockwise",
  rotationEnabled = true,
  speed = 1,
  pulseSpeed,
  rotationSpeed,
  glowIntensity = 1,
  glowSaturation = 1,
  outlineWidth = 1,
  outlineOpacity = 0.42,
  outlineColor = "rgba(255, 255, 255, 0.4)",
  outlineSoftness = 1.75,
  visibilityPreset = "scale",
  active = true,
  animateOnMount = true,
  visibilityDuration = 520,
  children,
}) {
  const glowContainerRef = useRef(null);
  const [hasEntered, setHasEntered] = useState(!animateOnMount);

  useEffect(() => {
    injectStylesOnce();
  }, []);

  useEffect(() => {
    const container = glowContainerRef.current;
    if (!container) return;

    return mountGlowRings(container, {
      colors,
      rotationDirection,
      rotationEnabled,
      speed,
      pulseSpeed,
      rotationSpeed,
      glowIntensity,
    });
  }, [colors, rotationDirection, rotationEnabled, speed, pulseSpeed, rotationSpeed, glowIntensity]);

  useEffect(() => {
    if (!animateOnMount) {
      setHasEntered(true);
      return undefined;
    }

    setHasEntered(false);
    const frameId = window.requestAnimationFrame(() => {
      setHasEntered(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [animateOnMount]);

  const isVisible = active && hasEntered;
  const useTrimVisibility = visibilityPreset === "trim";
  const useZoomVisibility = visibilityPreset === "zoom";
  const useZoomExitVisibility = useZoomVisibility && !isVisible;
  const parsedGlowSaturation = Number(glowSaturation);
  const resolvedGlowSaturation = Number.isFinite(parsedGlowSaturation)
    ? Math.max(0, parsedGlowSaturation)
    : 1;
  const resolvedVisibilityDuration = useZoomExitVisibility
    ? Math.round(visibilityDuration * 2.1)
    : visibilityDuration;
  const resolvedVisibilityEasing = useZoomExitVisibility
    ? "cubic-bezier(0.28, 0, 0.18, 1)"
    : "cubic-bezier(0.22, 1, 0.36, 1)";
  const resolvedTransformDuration = useZoomExitVisibility
    ? Math.round(visibilityDuration * 2.75)
    : resolvedVisibilityDuration;
  const resolvedOpacityDuration = useZoomExitVisibility
    ? Math.round(visibilityDuration * 3.1)
    : resolvedVisibilityDuration;
  const resolvedTransformEasing = useZoomExitVisibility
    ? "cubic-bezier(0.35, 0, 0.12, 1)"
    : resolvedVisibilityEasing;
  const resolvedOpacityEasing = useZoomExitVisibility
    ? "cubic-bezier(0.42, 0, 0.2, 1)"
    : resolvedVisibilityEasing;

  const mergedStyle = {
    "--aie-radius": typeof radius === "number" ? `${radius}px` : radius,
    "--aie-glow-opacity": useTrimVisibility ? 1 : isVisible ? 1 : 0,
    "--aie-glow-scale":
      useTrimVisibility
        ? 1
        : useZoomVisibility
          ? isVisible ? 1 : 1.5
          : isVisible ? 1 : 0.9,
    "--aie-glow-saturation": resolvedGlowSaturation * (isVisible ? 1 : 0.75),
    "--aie-glow-intensity": glowIntensity,
    "--aie-trim-progress": useTrimVisibility ? (isVisible ? 1 : 0) : 1,
    "--aie-outline-width": typeof outlineWidth === "number" ? `${outlineWidth}px` : outlineWidth,
    "--aie-outline-opacity": outlineOpacity,
    "--aie-outline-color": outlineColor,
    "--aie-outline-softness": typeof outlineSoftness === "number" ? `${outlineSoftness}px` : outlineSoftness,
    "--aie-visibility-duration": `${resolvedVisibilityDuration}ms`,
    "--aie-visibility-easing": resolvedVisibilityEasing,
    "--aie-visibility-transform-duration": `${resolvedTransformDuration}ms`,
    "--aie-visibility-opacity-duration": `${resolvedOpacityDuration}ms`,
    "--aie-visibility-transform-easing": resolvedTransformEasing,
    "--aie-visibility-opacity-easing": resolvedOpacityEasing,
    ...style,
  };

  return (
    <div
      className={`aie-glow-root ${className}`}
      style={mergedStyle}
      data-visibility-preset={visibilityPreset}
    >
      <div className="aie-glow-visual">
        <div ref={glowContainerRef} className="aie-glow-rings" />
        <div className="aie-glow-outline" />
      </div>
      <div className="aie-glow-content">{children}</div>
    </div>
  );
}
