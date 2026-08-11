import { useEffect, useMemo, useRef, useState } from "react";

import { PrismGlow, PrismLockScreen } from "../../src/index.js";
import {
  DownloadIcon,
  GridIcon,
  HistoryIcon,
  MinusIcon,
  MoonIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  SaveIcon,
  ScanIcon,
  SearchIcon,
  SmartphoneIcon,
  SquareIcon,
  StarIcon,
  SunIcon,
  TrashIcon,
  UploadIcon,
  XIcon,
} from "./icons.jsx";
import "./App.css";

const PRESETS = {
  aurora: ["#8B5CF6", "#C084FC", "#F472B6", "#FB7185", "#FDBA74", "#60A5FA"],
  sunrise: ["#FB7185", "#F97316", "#FACC15", "#FDE68A", "#FDBA74", "#F9A8D4"],
  arctic: ["#67E8F9", "#22D3EE", "#60A5FA", "#A78BFA", "#C4B5FD", "#E0F2FE"],
  prism: ["#7C3AED", "#2563EB", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"],
  rainbow: ["#FF003C", "#FF8A00", "#FFD500", "#00C853", "#00B0FF", "#7C4DFF"],
};

const PRESET_LABELS = {
  aurora: "Aurora Bloom",
  sunrise: "Solar Drift",
  arctic: "Arctic Signal",
  prism: "Prism Shift",
  rainbow: "Rainbow Arc",
};

const DEFAULT_PRESET = "prism";
const BRAND_ICON_SRC = "/icon.svg";
const CUSTOM_PRESETS_STORAGE_KEY = "prism-studio-demo.custom-presets";
const THEME_STORAGE_KEY = "prism-studio-demo.theme";
const SETTINGS_FILE_VERSION = 1;
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const MIN_STOPS = 2;
const MAX_STOPS = 12;
const ZOOM_STEPS = [0.5, 0.75, 0.9, 1, 1.25, 1.5, 2];
const DEFAULT_SETTINGS = {
  colors: PRESETS[DEFAULT_PRESET],
  rotationDirection: "clockwise",
  rotationEnabled: true,
  pulseSpeed: 1,
  rotationSpeed: 1,
  glowIntensity: 1,
  glowSaturation: 1,
  outlineWidth: 1.25,
  outlineOpacity: 0.55,
  visibilityPreset: "scale",
  active: true,
};

function clampNumber(value, min, max, fallback) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(Math.max(numericValue, min), max);
}

function sanitizeColors(colors) {
  if (!Array.isArray(colors)) {
    return DEFAULT_SETTINGS.colors;
  }

  const validColors = colors
    .map((color) => (typeof color === "string" ? color.trim() : ""))
    .filter((color) => HEX_COLOR_PATTERN.test(color));

  return validColors.length >= MIN_STOPS ? validColors : DEFAULT_SETTINGS.colors;
}

function sanitizeSettings(source = {}) {
  return {
    colors: sanitizeColors(source.colors),
    rotationDirection: source.rotationDirection === "counterclockwise" ? "counterclockwise" : "clockwise",
    rotationEnabled: source.rotationEnabled !== false,
    pulseSpeed: clampNumber(source.pulseSpeed, 0.35, 2.5, DEFAULT_SETTINGS.pulseSpeed),
    rotationSpeed: clampNumber(source.rotationSpeed, 0.35, 2.5, DEFAULT_SETTINGS.rotationSpeed),
    glowIntensity: clampNumber(source.glowIntensity, 0, 4, DEFAULT_SETTINGS.glowIntensity),
    glowSaturation: clampNumber(source.glowSaturation, 0, 2.5, DEFAULT_SETTINGS.glowSaturation),
    outlineWidth: clampNumber(source.outlineWidth, 0, 6, DEFAULT_SETTINGS.outlineWidth),
    outlineOpacity: clampNumber(source.outlineOpacity, 0, 1, DEFAULT_SETTINGS.outlineOpacity),
    visibilityPreset:
      source.visibilityPreset === "trim"
        ? "trim"
        : source.visibilityPreset === "zoom"
          ? "zoom"
          : "scale",
    active: source.active !== false,
  };
}

function createSettingsSnapshot(settings) {
  return {
    colors: [...settings.colors],
    rotationDirection: settings.rotationDirection,
    rotationEnabled: settings.rotationEnabled,
    pulseSpeed: settings.pulseSpeed,
    rotationSpeed: settings.rotationSpeed,
    glowIntensity: settings.glowIntensity,
    glowSaturation: settings.glowSaturation,
    outlineWidth: settings.outlineWidth,
    outlineOpacity: settings.outlineOpacity,
    visibilityPreset: settings.visibilityPreset,
    active: settings.active,
  };
}

function sanitizePresetName(name, index) {
  if (typeof name !== "string") {
    return `Custom Preset ${index + 1}`;
  }

  const trimmedName = name.trim();
  return trimmedName ? trimmedName.slice(0, 40) : `Custom Preset ${index + 1}`;
}

function sanitizeCustomPresets(source) {
  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      return {
        id: typeof entry.id === "string" && entry.id.trim() ? entry.id : `custom-preset-${index + 1}`,
        name: sanitizePresetName(entry.name, index),
        settings: sanitizeSettings(entry.settings),
      };
    })
    .filter(Boolean);
}

function buildPresetId(name) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `custom-${slug || "preset"}-${Date.now().toString(36)}`;
}

function toFileSafeName(name) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "prism-settings";
}

function downloadJsonFile(fileName, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName;
  link.click();

  window.URL.revokeObjectURL(objectUrl);
}

function buildSwatchGradient(colors) {
  return `linear-gradient(90deg, ${colors.join(", ")})`;
}

function readStoredCustomPresets() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedPresets = window.localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
    return storedPresets ? sanitizeCustomPresets(JSON.parse(storedPresets)) : [];
  } catch {
    return [];
  }
}

function readStoredTheme() {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark";
}

/** Label + value header over a native range input painted with the accent fill. */
function Slider({ label, value, displayValue, min, max, step, disabled = false, onChange }) {
  const fillPercent = ((value - min) / (max - min)) * 100;

  return (
    <label className={disabled ? "ps-slider is-disabled" : "ps-slider"}>
      <span className="ps-slider-head">
        <span>{label}</span>
        <strong>{displayValue}</strong>
      </span>
      <input
        className="ps-range"
        style={{ "--ps-fill": `${fillPercent}%` }}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function PillGroup({ options, value, disabled = false, onSelect }) {
  return (
    <div className="ps-pill-row">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "ps-pill is-active" : "ps-pill"}
          disabled={disabled}
          onClick={() => onSelect(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="ps-stat-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function App() {
  const [preset, setPreset] = useState(DEFAULT_PRESET);
  const [colors, setColors] = useState(DEFAULT_SETTINGS.colors);
  const [colorDrafts, setColorDrafts] = useState(DEFAULT_SETTINGS.colors.map((color) => color.toUpperCase()));
  const [rotationDirection, setRotationDirection] = useState(DEFAULT_SETTINGS.rotationDirection);
  const [rotationEnabled, setRotationEnabled] = useState(DEFAULT_SETTINGS.rotationEnabled);
  const [pulseSpeed, setPulseSpeed] = useState(DEFAULT_SETTINGS.pulseSpeed);
  const [rotationSpeed, setRotationSpeed] = useState(DEFAULT_SETTINGS.rotationSpeed);
  const [glowIntensity, setGlowIntensity] = useState(DEFAULT_SETTINGS.glowIntensity);
  const [glowSaturation, setGlowSaturation] = useState(DEFAULT_SETTINGS.glowSaturation);
  const [outlineWidth, setOutlineWidth] = useState(DEFAULT_SETTINGS.outlineWidth);
  const [outlineOpacity, setOutlineOpacity] = useState(DEFAULT_SETTINGS.outlineOpacity);
  const [visibilityPreset, setVisibilityPreset] = useState(DEFAULT_SETTINGS.visibilityPreset);
  const [active, setActive] = useState(DEFAULT_SETTINGS.active);
  const [customPresets, setCustomPresets] = useState(readStoredCustomPresets);
  const [customPresetName, setCustomPresetName] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");

  // Shell state — theme, panels and the preview viewport.
  const [theme, setTheme] = useState(readStoredTheme);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [presetQuery, setPresetQuery] = useState("");
  const [surface, setSurface] = useState("phone");
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);

  const importInputRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(customPresets));
  }, [customPresets]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const currentSettings = useMemo(() => createSettingsSnapshot({
    colors,
    rotationDirection,
    rotationEnabled,
    pulseSpeed,
    rotationSpeed,
    glowIntensity,
    glowSaturation,
    outlineWidth,
    outlineOpacity,
    visibilityPreset,
    active,
  }), [
    active,
    colors,
    rotationDirection,
    rotationEnabled,
    pulseSpeed,
    rotationSpeed,
    glowIntensity,
    glowSaturation,
    outlineWidth,
    outlineOpacity,
    visibilityPreset,
  ]);

  const glowProps = useMemo(() => ({
    ...currentSettings,
    animateOnMount: true,
  }), [currentSettings]);

  const pulseSpeedLabel = `${pulseSpeed.toFixed(2)}x`;
  const rotationSpeedLabel = `${rotationSpeed.toFixed(2)}x`;
  const glowIntensityLabel = `${glowIntensity.toFixed(2)}x`;
  const glowSaturationLabel = `${glowSaturation.toFixed(2)}x`;
  const outlineWidthLabel = `${outlineWidth.toFixed(1)}px`;
  const outlineOpacityLabel = `${Math.round(outlineOpacity * 100)}%`;
  const directionLabel = rotationDirection === "clockwise" ? "Clockwise" : "Counterclockwise";
  const rotationLabel = rotationEnabled ? directionLabel : "Off";
  const visibilityLabel = visibilityPreset === "trim"
    ? "Trim Path"
    : visibilityPreset === "zoom"
      ? "Scale Down"
      : "Scale";
  const currentPresetLabel = PRESET_LABELS[preset]
    ?? customPresets.find((customPreset) => customPreset.id === preset)?.name
    ?? "Unsaved draft";
  const isDraft = !PRESET_LABELS[preset] && !customPresets.some((entry) => entry.id === preset);

  const presetRows = useMemo(() => {
    const builtInRows = Object.keys(PRESETS).map((presetKey) => ({
      id: presetKey,
      name: PRESET_LABELS[presetKey],
      colors: PRESETS[presetKey],
      removable: false,
    }));

    const customRows = customPresets.map((customPreset) => ({
      id: customPreset.id,
      name: customPreset.name,
      colors: customPreset.settings.colors,
      removable: true,
      source: customPreset,
    }));

    const query = presetQuery.trim().toLowerCase();
    const allRows = [...builtInRows, ...customRows];

    return query ? allRows.filter((row) => row.name.toLowerCase().includes(query)) : allRows;
  }, [customPresets, presetQuery]);

  function applySettings(nextSettings, nextPreset = "custom") {
    const sanitizedSettings = sanitizeSettings(nextSettings);

    setPreset(nextPreset);
    setColors(sanitizedSettings.colors);
    setColorDrafts(sanitizedSettings.colors.map((color) => color.toUpperCase()));
    setRotationDirection(sanitizedSettings.rotationDirection);
    setRotationEnabled(sanitizedSettings.rotationEnabled);
    setPulseSpeed(sanitizedSettings.pulseSpeed);
    setRotationSpeed(sanitizedSettings.rotationSpeed);
    setGlowIntensity(sanitizedSettings.glowIntensity);
    setGlowSaturation(sanitizedSettings.glowSaturation);
    setOutlineWidth(sanitizedSettings.outlineWidth);
    setOutlineOpacity(sanitizedSettings.outlineOpacity);
    setVisibilityPreset(sanitizedSettings.visibilityPreset);
    setActive(sanitizedSettings.active);
  }

  function applyPreset(nextPreset) {
    setPreset(nextPreset);
    setColors(PRESETS[nextPreset]);
    setColorDrafts(PRESETS[nextPreset].map((color) => color.toUpperCase()));
    setSettingsMessage("");
  }

  function applyCustomPreset(customPreset) {
    applySettings(customPreset.settings, customPreset.id);
    setCustomPresetName(customPreset.name);
    setSettingsMessage(`Loaded preset "${customPreset.name}".`);
  }

  function selectPresetRow(row) {
    if (row.removable) {
      applyCustomPreset(row.source);
      return;
    }

    applyPreset(row.id);
  }

  function updateColor(index, nextColor) {
    setPreset("custom");
    setColors((currentColors) =>
      currentColors.map((color, colorIndex) => (colorIndex === index ? nextColor : color))
    );
    setColorDrafts((currentDrafts) =>
      currentDrafts.map((color, colorIndex) => (colorIndex === index ? nextColor.toUpperCase() : color))
    );
  }

  function updateColorDraft(index, nextValue) {
    setColorDrafts((currentDrafts) =>
      currentDrafts.map((color, colorIndex) => (colorIndex === index ? nextValue.toUpperCase() : color))
    );

    if (HEX_COLOR_PATTERN.test(nextValue)) {
      setPreset("custom");
      setColors((currentColors) =>
        currentColors.map((color, colorIndex) => (colorIndex === index ? nextValue : color))
      );
    }
  }

  function syncColorDraft(index) {
    setColorDrafts((currentDrafts) =>
      currentDrafts.map((draft, colorIndex) => (colorIndex === index ? colors[index].toUpperCase() : draft))
    );
  }

  function addColorStop() {
    if (colors.length >= MAX_STOPS) {
      return;
    }

    const nextColor = colors[colors.length - 1] ?? DEFAULT_SETTINGS.colors[0];

    setPreset("custom");
    setColors((currentColors) => [...currentColors, nextColor]);
    setColorDrafts((currentDrafts) => [...currentDrafts, nextColor.toUpperCase()]);
  }

  function removeColorStop(index) {
    if (colors.length <= MIN_STOPS) {
      return;
    }

    setPreset("custom");
    setColors((currentColors) => currentColors.filter((_, colorIndex) => colorIndex !== index));
    setColorDrafts((currentDrafts) => currentDrafts.filter((_, colorIndex) => colorIndex !== index));
  }

  function replayAnimation() {
    setPreset("custom");
    setActive(false);
    window.setTimeout(() => {
      setActive(true);
    }, 180);
  }

  function saveCustomPreset() {
    const nextName = customPresetName.trim();

    if (!nextName) {
      setSettingsMessage("Enter a preset name before saving.");
      return;
    }

    const existingPreset = customPresets.find(
      (customPreset) => customPreset.name.toLowerCase() === nextName.toLowerCase()
    );
    const nextSnapshot = createSettingsSnapshot(currentSettings);

    if (existingPreset) {
      setCustomPresets((currentPresets) =>
        currentPresets.map((customPreset) =>
          customPreset.id === existingPreset.id
            ? { ...customPreset, name: nextName, settings: nextSnapshot }
            : customPreset
        )
      );
      setPreset(existingPreset.id);
      setSettingsMessage(`Updated preset "${nextName}".`);
      return;
    }

    const nextPreset = {
      id: buildPresetId(nextName),
      name: nextName,
      settings: nextSnapshot,
    };

    setCustomPresets((currentPresets) => [...currentPresets, nextPreset]);
    setPreset(nextPreset.id);
    setSettingsMessage(`Saved preset "${nextName}".`);
  }

  function deleteCustomPreset(presetId) {
    const presetToDelete = customPresets.find((customPreset) => customPreset.id === presetId);
    if (!presetToDelete) {
      return;
    }

    setCustomPresets((currentPresets) =>
      currentPresets.filter((customPreset) => customPreset.id !== presetId)
    );

    if (preset === presetId) {
      setPreset("custom");
    }

    setSettingsMessage(`Removed preset "${presetToDelete.name}".`);
  }

  function exportCurrentSettings() {
    const payload = {
      version: SETTINGS_FILE_VERSION,
      name: customPresetName.trim() || currentPresetLabel,
      exportedAt: new Date().toISOString(),
      settings: currentSettings,
    };

    const fileName = `${toFileSafeName(payload.name)}.json`;
    downloadJsonFile(fileName, payload);
    setSettingsMessage(`Exported ${fileName}.`);
  }

  async function importSettings(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const fileContents = await file.text();
      const parsedPayload = JSON.parse(fileContents);
      const importedSettings = sanitizeSettings(parsedPayload.settings ?? parsedPayload);
      const importedName = sanitizePresetName(
        parsedPayload.name ?? file.name.replace(/\.json$/i, ""),
        customPresets.length
      );

      applySettings(importedSettings, "imported");
      setCustomPresetName(importedName);
      setSettingsMessage(`Imported settings from ${file.name}.`);
    } catch {
      setSettingsMessage("Could not import that JSON file.");
    } finally {
      event.target.value = "";
    }
  }

  function stepZoom(direction) {
    const currentIndex = ZOOM_STEPS.indexOf(zoom);
    const baseIndex = currentIndex === -1 ? ZOOM_STEPS.indexOf(1) : currentIndex;
    const nextIndex = Math.min(Math.max(baseIndex + direction, 0), ZOOM_STEPS.length - 1);

    setZoom(ZOOM_STEPS[nextIndex]);
  }

  return (
    <div className="ps-app" data-theme={theme}>
      {sidebarOpen ? (
        <aside className="ps-sidebar">
          <header className="ps-sidebar-head">
            <div className="ps-brand">
              <span className="ps-app-mark">
                <img className="ps-app-mark-image" src={BRAND_ICON_SRC} alt="" />
              </span>
              <span className="ps-wordmark">
                <strong>Prism Studio</strong>
                <span>Preset authoring</span>
              </span>
            </div>

            <button
              type="button"
              className="ps-icon-btn"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              type="button"
              className="ps-icon-btn"
              onClick={() => setSidebarOpen(false)}
              title="Hide preset rail"
              aria-label="Hide preset rail"
            >
              <PanelLeftCloseIcon />
            </button>
          </header>

          <div className="ps-search-row">
            <div className="ps-search">
              <SearchIcon size={15} />
              <input
                type="text"
                value={presetQuery}
                onChange={(event) => setPresetQuery(event.target.value)}
                placeholder="Filter presets"
                aria-label="Filter presets"
              />
              {presetQuery ? (
                <button
                  type="button"
                  className="ps-icon-btn"
                  style={{ width: 22, height: 22 }}
                  onClick={() => setPresetQuery("")}
                  aria-label="Clear preset filter"
                >
                  <XIcon size={13} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="ps-sidebar-body">
            <div className="ps-presets-head">
              <h2 className="ps-section-title">Saved presets</h2>
              {isDraft ? <span className="ps-chip ps-chip--accent">Unsaved</span> : null}
            </div>

            <div className="ps-preset-list">
              {presetRows.map((row) => (
                <div key={row.id} style={{ position: "relative" }}>
                  <button
                    type="button"
                    className={preset === row.id ? "ps-preset-row is-active" : "ps-preset-row"}
                    onClick={() => selectPresetRow(row)}
                  >
                    <span className="ps-preset-row-top">
                      <span className="ps-preset-name">{row.name}</span>
                      {row.removable ? (
                        <StarIcon size={13} />
                      ) : null}
                    </span>
                    <span className="ps-preset-row-meta">
                      <span
                        className="ps-swatch-strip"
                        style={{ background: buildSwatchGradient(row.colors) }}
                      />
                      <span className="ps-preset-meta">
                        {row.colors.length} stops · {row.removable ? "custom" : "built-in"}
                      </span>
                    </span>
                  </button>

                  {row.removable ? (
                    <button
                      type="button"
                      className="ps-icon-btn ps-preset-delete"
                      onClick={() => deleteCustomPreset(row.id)}
                      title={`Remove ${row.name}`}
                      aria-label={`Remove ${row.name}`}
                    >
                      <TrashIcon size={14} />
                    </button>
                  ) : null}
                </div>
              ))}

              {presetRows.length === 0 ? (
                <p className="ps-empty-note">No presets match “{presetQuery}”.</p>
              ) : null}
            </div>
          </div>

          <div className="ps-preset-actions">
            <label className="ps-name-field">
              <span className="ps-visually-hidden">Preset name</span>
              <input
                type="text"
                value={customPresetName}
                onChange={(event) => setCustomPresetName(event.target.value)}
                maxLength={40}
                placeholder="Preset name"
              />
            </label>

            <button type="button" className="ps-btn ps-btn--primary" onClick={saveCustomPreset}>
              <SaveIcon />
              Save preset
            </button>

            <div className="ps-transfer-row">
              <button
                type="button"
                className="ps-btn ps-btn--outline"
                onClick={() => importInputRef.current?.click()}
              >
                <UploadIcon />
                Import JSON
              </button>
              <button type="button" className="ps-btn ps-btn--outline" onClick={exportCurrentSettings}>
                <DownloadIcon />
                Export JSON
              </button>
            </div>

            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              className="ps-visually-hidden"
              onChange={importSettings}
            />

            {settingsMessage ? <p className="ps-helper">{settingsMessage}</p> : null}
          </div>
        </aside>
      ) : null}

      <section className="ps-stage">
        <div className="ps-stage-toolbar">
          {!sidebarOpen ? (
            <button
              type="button"
              className="ps-icon-btn"
              onClick={() => setSidebarOpen(true)}
              title="Show preset rail"
              aria-label="Show preset rail"
            >
              <PanelLeftOpenIcon />
            </button>
          ) : null}

          <div className="ps-canvas-selector">
            <button
              type="button"
              className={surface === "phone" ? "ps-canvas-chip is-active" : "ps-canvas-chip"}
              onClick={() => setSurface("phone")}
            >
              <SmartphoneIcon size={13} />
              Phone
            </button>
            <button
              type="button"
              className={surface === "card" ? "ps-canvas-chip is-active" : "ps-canvas-chip"}
              onClick={() => setSurface("card")}
            >
              <SquareIcon size={13} />
              Card
            </button>
          </div>

          <span className="ps-toolbar-divider" />
          <span className="ps-chip">{currentPresetLabel}</span>

          <span className="ps-toolbar-spacer" />

          <div className="ps-zoom">
            <button
              type="button"
              className="ps-icon-btn"
              onClick={() => stepZoom(-1)}
              disabled={zoom === ZOOM_STEPS[0]}
              title="Zoom out"
              aria-label="Zoom out"
            >
              <MinusIcon />
            </button>
            <span className="ps-zoom-value">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className="ps-icon-btn"
              onClick={() => stepZoom(1)}
              disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]}
              title="Zoom in"
              aria-label="Zoom in"
            >
              <PlusIcon />
            </button>
          </div>

          <span className="ps-toolbar-divider" />

          <div className="ps-viewport-actions">
            <button
              type="button"
              className={showGrid ? "ps-icon-btn is-on" : "ps-icon-btn"}
              onClick={() => setShowGrid((current) => !current)}
              title="Toggle grid"
              aria-label="Toggle grid"
              aria-pressed={showGrid}
            >
              <GridIcon />
            </button>
            <button
              type="button"
              className="ps-icon-btn"
              onClick={() => setZoom(1)}
              title="Reset zoom"
              aria-label="Reset zoom"
            >
              <ScanIcon />
            </button>
          </div>
        </div>

        <div className={showGrid ? "ps-artboard has-grid" : "ps-artboard"}>
          <div className="ps-artboard-inner" style={{ transform: `scale(${zoom})` }}>
            <span className="ps-artboard-label">
              {surface === "phone" ? "Device preview · 320 × 640" : "Assistant surface · 380 × 380"}
            </span>

            {surface === "phone" ? (
              <PrismLockScreen
                className="ps-phone"
                width={320}
                height={640}
                showHelperText={false}
                glowProps={glowProps}
              />
            ) : (
              <PrismGlow
                radius={36}
                style={{
                  width: 380,
                  minHeight: 380,
                  background: "var(--ps-preview-card-bg)",
                  color: "var(--ps-preview-card-fg)",
                  padding: "32px",
                }}
                {...glowProps}
              >
                <div className="ps-card-preview">
                  <div className="ps-card-copy">
                    <div className="ps-card-brand">
                      <img src={BRAND_ICON_SRC} alt="" className="ps-card-brand-icon" />
                      <span>Prism Studio</span>
                    </div>

                    <div>
                      <h3>Prism assistant card</h3>
                      <p>
                        Apply the same Prism glow engine to a richer product surface without
                        rebuilding the animation from scratch.
                      </p>
                    </div>
                  </div>

                  <div className="ps-card-stats">
                    <StatPill label="State" value={active ? "Visible" : "Hidden"} />
                    <StatPill label="Rotation" value={rotationLabel} />
                    <StatPill label="Saturation" value={glowSaturationLabel} />
                    <StatPill label="Outline" value={outlineWidthLabel} />
                    <StatPill label="Enter" value={visibilityLabel} />
                  </div>
                </div>
              </PrismGlow>
            )}
          </div>
        </div>
      </section>

      <aside className="ps-inspector">
        <header className="ps-inspector-head">
          <div className="ps-inspector-titles">
            <strong>Inspector</strong>
            <span>{currentPresetLabel} · {colors.length} stops</span>
          </div>

          <button
            type="button"
            className="ps-icon-btn"
            onClick={() => {
              applySettings(DEFAULT_SETTINGS, DEFAULT_PRESET);
              setSettingsMessage("Reverted to the default Prism Shift settings.");
            }}
            title="Revert to defaults"
            aria-label="Revert to defaults"
          >
            <HistoryIcon />
          </button>
        </header>

        <div className="ps-inspector-body">
          <section className="ps-section">
            <div className="ps-section-head">
              <h2 className="ps-section-title">Gradient stops</h2>
              <button
                type="button"
                className="ps-icon-btn"
                onClick={addColorStop}
                disabled={colors.length >= MAX_STOPS}
                title="Add stop"
                aria-label="Add stop"
              >
                <PlusIcon />
              </button>
            </div>

            <div className="ps-stop-list">
              {colors.map((color, index) => (
                <div key={index} className="ps-stop">
                  <span className="ps-stop-label">Stop {index + 1}</span>
                  <div className="ps-stop-field">
                    <input
                      type="color"
                      className="ps-stop-swatch"
                      value={color}
                      onChange={(event) => updateColor(index, event.target.value)}
                      aria-label={`Prism color stop ${index + 1}`}
                    />
                    <input
                      type="text"
                      className="ps-stop-hex"
                      value={colorDrafts[index]}
                      onChange={(event) => updateColorDraft(index, event.target.value)}
                      onBlur={() => syncColorDraft(index)}
                      spellCheck="false"
                      maxLength={7}
                      aria-label={`Hex value for Prism color stop ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="ps-icon-btn ps-stop-remove"
                      onClick={() => removeColorStop(index)}
                      disabled={colors.length <= MIN_STOPS}
                      title="Remove stop"
                      aria-label={`Remove color stop ${index + 1}`}
                    >
                      <XIcon size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="ps-section">
            <h2 className="ps-section-title">Motion</h2>
            <div className="ps-section-body">
              <PillGroup
                value={rotationEnabled ? "on" : "off"}
                options={[
                  { value: "on", label: "Rotation On" },
                  { value: "off", label: "Rotation Off" },
                ]}
                onSelect={(nextValue) => {
                  setPreset("custom");
                  setRotationEnabled(nextValue === "on");
                }}
              />

              <Slider
                label="Pulse speed"
                value={pulseSpeed}
                displayValue={pulseSpeedLabel}
                min={0.35}
                max={2.5}
                step={0.05}
                onChange={(nextValue) => {
                  setPreset("custom");
                  setPulseSpeed(nextValue);
                }}
              />

              <Slider
                label="Rotation speed"
                value={rotationSpeed}
                displayValue={rotationSpeedLabel}
                min={0.35}
                max={2.5}
                step={0.05}
                disabled={!rotationEnabled}
                onChange={(nextValue) => {
                  setPreset("custom");
                  setRotationSpeed(nextValue);
                }}
              />

              <PillGroup
                value={rotationDirection}
                disabled={!rotationEnabled}
                options={[
                  { value: "clockwise", label: "Clockwise" },
                  { value: "counterclockwise", label: "Counterclockwise" },
                ]}
                onSelect={(nextValue) => {
                  setPreset("custom");
                  setRotationDirection(nextValue);
                }}
              />
            </div>
          </section>

          <section className="ps-section">
            <h2 className="ps-section-title">Visibility</h2>
            <div className="ps-section-body">
              <PillGroup
                value={visibilityPreset}
                options={[
                  { value: "scale", label: "Scale" },
                  { value: "trim", label: "Trim Path" },
                  { value: "zoom", label: "Scale Down" },
                ]}
                onSelect={(nextValue) => {
                  setPreset("custom");
                  setVisibilityPreset(nextValue);
                }}
              />

              <div className="ps-pill-row">
                <button
                  type="button"
                  className={active ? "ps-pill is-active" : "ps-pill"}
                  onClick={() => {
                    setPreset("custom");
                    setActive((currentValue) => !currentValue);
                  }}
                >
                  {active ? "Animate Out" : "Animate In"}
                </button>
                <button type="button" className="ps-pill" onClick={replayAnimation}>
                  Replay Intro
                </button>
              </div>
            </div>
          </section>

          <section className="ps-section">
            <h2 className="ps-section-title">Frame</h2>
            <div className="ps-section-body">
              <Slider
                label="Outline width"
                value={outlineWidth}
                displayValue={outlineWidthLabel}
                min={0}
                max={6}
                step={0.25}
                onChange={(nextValue) => {
                  setPreset("custom");
                  setOutlineWidth(nextValue);
                }}
              />
              <Slider
                label="Outline opacity"
                value={outlineOpacity}
                displayValue={outlineOpacityLabel}
                min={0}
                max={1}
                step={0.05}
                onChange={(nextValue) => {
                  setPreset("custom");
                  setOutlineOpacity(nextValue);
                }}
              />
              <Slider
                label="Glow intensity"
                value={glowIntensity}
                displayValue={glowIntensityLabel}
                min={0}
                max={4}
                step={0.05}
                onChange={(nextValue) => {
                  setPreset("custom");
                  setGlowIntensity(nextValue);
                }}
              />
              <Slider
                label="Glow saturation"
                value={glowSaturation}
                displayValue={glowSaturationLabel}
                min={0}
                max={2.5}
                step={0.05}
                onChange={(nextValue) => {
                  setPreset("custom");
                  setGlowSaturation(nextValue);
                }}
              />
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

export default App;
