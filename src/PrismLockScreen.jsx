import React, { useEffect, useState } from "react";

import { PrismGlow } from "./PrismGlow.jsx";

// Styles injection so consumers do not need a separate stylesheet.

const STYLE_ID = "prism-lock-screen-styles";

const CSS = String.raw`
.aie-root {
  --phone-width: 360px;
  --phone-height: 720px;
  --phone-radius: 50px;

  display: inline-flex;
  flex-direction: column;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
}

.aie-iphone-screen {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #000;
  overflow: hidden;
  border-radius: var(--phone-radius);
}

.aie-wallpaper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #000000 0%, #1a1a1a 100%);
  z-index: 0;
  opacity: 0.9;
}

.aie-ui-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 20px;
  color: white;
  pointer-events: none;
}

.aie-dynamic-island {
  width: 120px;
  height: 35px;
  background-color: black;
  border-radius: 20px;
  margin-top: 8px;
  z-index: 30;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.aie-island-sensors {
  width: 40%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
}

.aie-island-dot {
  width: 8px;
  height: 8px;
  background: #1a1a1a;
  border-radius: 50%;
  box-shadow: 0 0 2px rgba(255, 255, 255, 0.1);
}

.aie-lock-header {
  margin-top: 35px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.aie-date {
  font-size: 1.3rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 0;
}

.aie-time {
  font-size: 5.8rem;
  font-weight: 600;
  line-height: 1;
  margin: 0;
  color: rgba(255, 255, 255, 1);
  letter-spacing: -1px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.aie-bottom-bar {
  width: 130px;
  height: 5px;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  margin-bottom: 8px;
  margin-top: auto;
}

.aie-helper-text {
  margin-top: 8px;
  color: #666;
  font-size: 0.9rem;
  text-align: center;
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

function getDateTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return {
    time: `${hours}:${minutes}`,
    date: dateFormatter.format(now),
  };
}

/**
 * Prism lock screen showcase built on the reusable glow wrapper.
 */
export function PrismLockScreen({
  width = 360,
  height = 720,
  showHelperText = true,
  className = "",
  style = {},
  glowProps = {},
}) {
  const [{ time, date }, setDateTime] = useState(() => getDateTime());

  useEffect(() => {
    injectStylesOnce();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setDateTime(getDateTime());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const wrapperStyle = {
    "--phone-width": typeof width === "number" ? `${width}px` : width,
    "--phone-height": typeof height === "number" ? `${height}px` : height,
    ...style,
  };

  return (
    <div className={`aie-root ${className}`} style={wrapperStyle}>
      <PrismGlow
        radius="var(--phone-radius)"
        style={{
          width: "var(--phone-width)",
          height: "var(--phone-height)",
          boxShadow: "0 0 0 6px #333, 0 0 0 7px #000, 0 20px 50px rgba(0, 0, 0, 0.5)",
        }}
        {...glowProps}
      >
        <div className="aie-iphone-screen">
          <div className="aie-wallpaper" />

          <div className="aie-ui-layer">
            <div className="aie-dynamic-island">
              <div className="aie-island-sensors">
                <div className="aie-island-dot" />
              </div>
            </div>

            <div className="aie-lock-header">
              <div className="aie-date">{date}</div>
              <div className="aie-time">{time}</div>
            </div>

            <div className="aie-bottom-bar" />
          </div>
        </div>
      </PrismGlow>

      {showHelperText && (
        <div className="aie-helper-text">CSS + JS re-creation of Prism Glow</div>
      )}
    </div>
  );
}
