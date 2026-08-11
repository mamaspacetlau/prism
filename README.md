## @mamaspace/prism

Prism-inspired animated glow border as a reusable React component.

Original upstream repository: [Oliverrr2424/Apple-Intelligence-Effect](https://github.com/Oliverrr2424/Apple-Intelligence-Effect)

This repository now contains two related layers:

- `src/` and `dist/`: the reusable `@mamaspace/prism` package
- `prism-studio-demo/`: a forked and modified studio app for tuning and previewing the effect

The package exposes the core effect primitives, while the studio app exposes a parameter-editing UI for visual exploration.

![Glow Demo](https://raw.githubusercontent.com/Oliverrr2424/Apple-Intelligence-Effect/main/glow_demo.png)

This package exposes:

- **`PrismGlow`** – the core, reusable glow container. It only renders the animated border and lets you provide any content inside.
- **`PrismLockScreen`** – example lock screen UI built on top of the same glow logic, intended as a demo/showcase.

---

### Repository Layout

- **`src/`** – source for the reusable React components
- **`dist/`** – built package output
- **`prism-studio-demo/`** – forked and modified React/Vite demo for authoring and previewing glow presets

The studio demo currently exposes controls for:

- gradient color stops
- rotation on / off
- rotation direction
- pulse speed
- rotation speed
- glow intensity
- glow saturation
- outline width
- outline opacity
- visibility mode
- active in / out state

It also adds demo-specific controls such as preset management, JSON import/export, preview surface switching, zoom, grid, and light/dark shell themes.

---

### Installation

```bash
npm install @mamaspace/prism
```

or with yarn / pnpm:

```bash
yarn add @mamaspace/prism
# or
pnpm add @mamaspace/prism
```

---

### Quick Start (Glow Only)

The core idea is: **wrap your own UI with `PrismGlow`** and let the component handle the animated border.

```jsx
import React from "react";
import { PrismGlow } from "@mamaspace/prism";

export default function Demo() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <PrismGlow
        radius={50}
        style={{
          width: 360,
          height: 720,
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          padding: 40,
        }}
      >
        {/* Your own UI goes here: lock screen, card, panel, etc. */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", fontWeight: 600, marginBottom: 8 }}>
            My Custom
          </div>
          <div style={{ fontSize: "1.2rem", opacity: 0.8 }}>
            Lock Screen or Card
          </div>
        </div>
      </PrismGlow>
    </div>
  );
}
```

The component:

- Injects the required CSS once at runtime.
- Uses multiple blurred conic gradients to create the Prism-style animated border.
- Keeps your content fully under your control.

---

### Example Lock Screen Component

If you want a ready-made demo that looks like a Prism-style lock screen, you can also import `PrismLockScreen`:

```jsx
import React from "react";
import {
  PrismGlow,
  PrismLockScreen,
} from "@mamaspace/prism";

export default function Demo() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 48,
        padding: 40,
      }}
    >
      {/* 1. Glow + custom content */}
      <PrismGlow
        radius={50}
        style={{
          width: 360,
          height: 720,
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        <div>My custom lock screen or card</div>
      </PrismGlow>

      {/* 2. Full lock screen demo */}
      <PrismLockScreen width={360} height={720} showHelperText />
    </div>
  );
}
```

`PrismLockScreen` is built using the same glow logic and is mainly intended for demos, docs, and inspiration.

---

### API Reference

#### `PrismGlow`

Core container that renders the animated glow border around its children.

**Props**

- **`radius?: number | string`**  
  Corner radius of the glow and clipping mask.  
  - Default: `50` (pixels)  
  - You can also pass CSS values like `"3rem"` or `"32px"`.

- **`className?: string`**  
  Custom class name applied to the outer glow container.

- **`style?: React.CSSProperties`**  
  Inline style applied to the outer glow container.  
  Commonly used to define:
  - Width / height
  - Background color
  - Layout (flexbox, padding, etc.)

- **`colors?: string[]`**  
  Array of color stops used to build the animated conic gradients.  
  - Pass at least two CSS color values.
  - Falls back to the default Prism palette when omitted.

- **`rotationDirection?: "clockwise" | "counterclockwise"`**  
  Controls the direction of the rotating glow. Default: `"clockwise"`.

- **`speed?: number`**  
  Global motion multiplier for the glow animation.  
  - `1` keeps the default timing
  - Values above `1` speed the effect up
  - Values below `1` slow it down

- **`pulseSpeed?: number`**  
  Controls how quickly the glow gradients refresh and crossfade.

- **`rotationSpeed?: number`**  
  Controls how quickly the conic colors rotate around the border.

- **`glowIntensity?: number`**  
  Controls the strength of the ambient glow layers.  
  - `0` removes the glow halo
  - `1` uses the default intensity
  - Supports stronger values up to `4` for a much brighter, bloomier halo

- **`outlineWidth?: number | string`**  
  Controls the crisp border width drawn above the glow.

- **`outlineOpacity?: number`**  
  Controls the visibility of the crisp outline from `0` to `1`.

- **`outlineColor?: string`**  
  Sets the crisp outline color.

- **`outlineSoftness?: number | string`**  
  Softens the outline edge so it blends more naturally into the glow instead of reading as a hard stroke.

- **`visibilityPreset?: "scale" | "trim" | "zoom"`**  
  Controls how the glow animates in and out.  
  - `"scale"` uses the existing soft scale and fade
  - `"trim"` reveals and hides the border as if it is being drawn around the path
  - `"zoom"` animates from an oversized glow down to its resting size on enter, and back up on exit

- **`active?: boolean`**  
  Shows or hides the glow with a smooth animated transition. Default: `true`.

- **`animateOnMount?: boolean`**  
  Whether the glow animates in on first render. Default: `true`.

- **`visibilityDuration?: number`**  
  Duration of the in/out visibility animation in milliseconds. Default: `520`.

- **`children: React.ReactNode`**  
  Any React content you want to render inside the glow.

---

#### `PrismLockScreen`

Example lock screen UI that uses the same glow effect, with:

- Dynamic Island‑style notch
- Live digital clock
- Date label
- Bottom home indicator bar

**Props**

- **`width?: number | string`**  
  Width of the phone frame. Default: `360` (pixels).

- **`height?: number | string`**  
  Height of the phone frame. Default: `720` (pixels).

- **`showHelperText?: boolean`**  
  Whether to show the helper caption under the phone. Default: `true`.

- **`className?: string`**  
  Custom class name applied to the outermost container.

- **`style?: React.CSSProperties`**  
  Inline style merged onto the outermost container (in addition to internal CSS variables for width/height).

- **`glowProps?: Partial<GlowProps>`**  
  Passes customization through to the internal `PrismGlow`, including:
  - `colors`
  - `rotationDirection`
  - `speed`
  - `pulseSpeed`
  - `rotationSpeed`
  - `glowIntensity`
  - `outlineWidth`
  - `outlineOpacity`
  - `outlineColor`
  - `outlineSoftness`
  - `visibilityPreset`
  - `active`
  - `animateOnMount`
  - `visibilityDuration`

---

### Publishing / Local Development

This repository is already configured to be published as an npm package:

- `main` and `module` both point to `src/index.js`.
- Only `src` and `README.md` are included in the published tarball via the `"files"` field.

If you want to publish under your own npm account:

1. **Login to npm**

   ```bash
   npm login
   ```

2. **Adjust the package name (optional)**

   Update the `"name"` field in `package.json` if you want a different public name.

3. **Bump the version**

   ```bash
   npm version patch   # or minor / major
   ```

4. **Publish**

   ```bash
   npm publish --access public
   ```

Once published, consumers can install it with:

```bash
npm install @mamaspace/prism
```

and use it as shown in the examples above.

For the modified studio demo:

```bash
cd prism-studio-demo
npm install
npm run dev
```

---

### License

MIT

