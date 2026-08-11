const DEFAULT_GLOW_COLORS = [
  "#BC82F3",
  "#F5B9EA",
  "#8D9FFF",
  "#FF6778",
  "#FFBA71",
  "#C686FF",
];

const DEFAULT_RING_CONFIGS = [
  { width: 2, blur: 2.5, opacity: 0.58, interval: 0.4, duration: 0.5, rotationDuration: 18 },
  { width: 4, blur: 6, opacity: 0.52, interval: 0.4, duration: 0.6, rotationDuration: 24 },
  { width: 7, blur: 12, opacity: 0.4, interval: 0.4, duration: 0.8, rotationDuration: 30 },
  { width: 11, blur: 22, opacity: 0.28, interval: 0.5, duration: 1.0, rotationDuration: 38 },
];

function clamp(value, min) {
  return Math.max(min, value);
}

function sanitizeColors(colors) {
  if (!Array.isArray(colors)) {
    return DEFAULT_GLOW_COLORS;
  }

  const validColors = colors
    .map((color) => (typeof color === "string" ? color.trim() : ""))
    .filter(Boolean);

  return validColors.length >= 2 ? validColors : DEFAULT_GLOW_COLORS;
}

function sanitizeSpeed(speed) {
  const numericSpeed = Number(speed);
  return Number.isFinite(numericSpeed) ? clamp(numericSpeed, 0.25) : 1;
}

function sanitizeDirection(direction) {
  return direction === "counterclockwise" ? "counterclockwise" : "clockwise";
}

function sanitizeRotationEnabled(rotationEnabled) {
  return rotationEnabled !== false;
}

function sanitizeRange(value, fallback, min, max) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(Math.max(numericValue, min), max);
}

function resolveAnimationSpeeds(options) {
  const fallbackSpeed = sanitizeSpeed(options.speed);

  return {
    pulseSpeed: sanitizeSpeed(options.pulseSpeed ?? fallbackSpeed),
    rotationSpeed: sanitizeSpeed(options.rotationSpeed ?? fallbackSpeed),
  };
}

function resolveGlowIntensity(glowIntensity) {
  return sanitizeRange(glowIntensity, 1, 0, 4);
}

function parseHexColor(color) {
  const normalized = color.replace("#", "").trim();

  if (normalized.length === 3) {
    const [r, g, b] = normalized.split("");
    return {
      r: Number.parseInt(`${r}${r}`, 16),
      g: Number.parseInt(`${g}${g}`, 16),
      b: Number.parseInt(`${b}${b}`, 16),
    };
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function mixColors(startColor, endColor, amount) {
  const start = parseHexColor(startColor);
  const end = parseHexColor(endColor);

  const mixChannel = (startChannel, endChannel) =>
    Math.round(startChannel + (endChannel - startChannel) * amount);

  const toHex = (value) => value.toString(16).padStart(2, "0");

  return `#${toHex(mixChannel(start.r, end.r))}${toHex(mixChannel(start.g, end.g))}${toHex(mixChannel(start.b, end.b))}`;
}

function generateConicGradientStops(colors) {
  const segmentSize = 100 / colors.length;
  const featherSize = segmentSize * 0.22;
  const stops = [];

  colors.forEach((color, index) => {
    const nextColor = colors[(index + 1) % colors.length];
    const segmentStart = index * segmentSize;
    const transitionStart = Math.max(0, segmentStart + segmentSize - featherSize);
    const midpoint = segmentStart + segmentSize / 2;
    const mixedColor = mixColors(color, nextColor, 0.5);

    stops.push(
      { color, location: segmentStart },
      { color, location: midpoint },
      { color, location: transitionStart },
      { color: mixedColor, location: segmentStart + segmentSize - featherSize / 2 }
    );
  });

  stops.push({ color: colors[0], location: 100 });

  const stopStrings = stops.map((stop) => `${stop.color} ${stop.location.toFixed(2)}%`);
  return stopStrings.join(", ");
}

class GlowRing {
  constructor(container, config) {
    this.width = config.width;
    this.blur = config.blur;
    this.interval = clamp((config.interval * 1000) / config.pulseSpeed, 120);
    this.duration = clamp(config.duration / config.pulseSpeed, 0.18);
    this.rotationDuration = clamp(config.rotationDuration / config.rotationSpeed, 4);
    this.rotationDirection = config.rotationDirection;
    this.rotationEnabled = config.rotationEnabled;
    this.colors = config.colors;
    this.opacity = Math.min(config.opacity * (0.75 + config.glowIntensity * 0.35), 1);
    this.timerId = null;

    this.el = document.createElement("div");
    this.el.className = "aie-effect-layer";
    this.el.style.opacity = String(this.opacity);

    if (this.blur > 0) {
      const intensifiedBlur = this.blur * (0.85 + config.glowIntensity * 0.3);
      const brightness = 0.94 + config.glowIntensity * 0.08;
      const saturate = 1 + config.glowIntensity * 0.2;
      this.el.style.filter = `blur(${intensifiedBlur}px) brightness(${brightness}) saturate(${saturate})`;
    }

    const ring = document.createElement("div");
    ring.className = "aie-ring-container";
    ring.style.animationDuration = `${this.rotationDuration}s`;
    ring.style.animationDirection = this.rotationDirection === "counterclockwise" ? "reverse" : "normal";

    this.buffer1 = this.createBuffer();
    this.buffer2 = this.createBuffer();
    this.activeBuffer = 1;

    this.setGradient(this.buffer1, generateConicGradientStops(this.colors));
    this.buffer1.style.opacity = 1;
    this.buffer2.style.opacity = 0;

    ring.appendChild(this.buffer1);
    ring.appendChild(this.buffer2);
    this.el.appendChild(ring);
    container.appendChild(this.el);

    this.startTimer();
  }

  createBuffer() {
    const buffer = document.createElement("div");
    buffer.className = "aie-gradient-buffer";
    buffer.style.padding = `${this.width}px`;
    buffer.style.transitionDuration = `${this.duration}s`;
    buffer.style.transitionTimingFunction = "ease-in-out";
    buffer.style.animationDuration = `${this.rotationDuration}s`;
    buffer.style.animationDirection = this.rotationDirection === "counterclockwise" ? "reverse" : "normal";
    buffer.style.animationPlayState = this.rotationEnabled ? "running" : "paused";
    return buffer;
  }

  setGradient(element, gradientStops) {
    element.style.setProperty("--aie-gradient-stops", gradientStops);
  }

  startTimer() {
    this.timerId = window.setInterval(() => {
      this.animate();
    }, this.interval);
  }

  animate() {
    const newGradient = generateConicGradientStops(this.colors);

    if (this.activeBuffer === 1) {
      this.setGradient(this.buffer2, newGradient);
      this.buffer2.style.opacity = 1;
      this.buffer1.style.opacity = 0;
      this.activeBuffer = 2;
      return;
    }

    this.setGradient(this.buffer1, newGradient);
    this.buffer1.style.opacity = 1;
    this.buffer2.style.opacity = 0;
    this.activeBuffer = 1;
  }

  destroy() {
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

export function mountGlowRings(container, options = {}) {
  const colors = sanitizeColors(options.colors);
  const { pulseSpeed, rotationSpeed } = resolveAnimationSpeeds(options);
  const rotationDirection = sanitizeDirection(options.rotationDirection);
  const rotationEnabled = sanitizeRotationEnabled(options.rotationEnabled);
  const glowIntensity = resolveGlowIntensity(options.glowIntensity);
  const ringConfigs = Array.isArray(options.ringConfigs) && options.ringConfigs.length > 0
    ? options.ringConfigs
    : DEFAULT_RING_CONFIGS;

  const rings = ringConfigs.map((config) => new GlowRing(container, {
    ...config,
    colors,
    pulseSpeed,
    rotationSpeed,
    rotationDirection,
    rotationEnabled,
    glowIntensity,
  }));

  return () => {
    rings.forEach((ring) => ring.destroy());
    container.innerHTML = "";
  };
}

export { DEFAULT_GLOW_COLORS };
