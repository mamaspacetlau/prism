# prism-studio-demo

`prism-studio-demo` is a forked and modified demo app built around the reusable components from the root package:

- `PrismGlow`
- `PrismLockScreen`

Original upstream repository: [Oliverrr2424/Apple-Intelligence-Effect](https://github.com/Oliverrr2424/Apple-Intelligence-Effect)

Instead of a static showcase, this app turns the effect into a small authoring studio that exposes a set of glow parameters through a React UI.

## What This Demo Is

This demo is:

- a fork of the original upstream repo: `Oliverrr2424/Apple-Intelligence-Effect`
- modified into a parameter playground / preset editor
- useful for tuning glow behavior before wiring the same values into product UI

The reusable component source lives in the repository root under `src/`. This demo lives in `prism-studio-demo/`.

## Exposed Parameters

The UI currently exposes these Prism-related controls:

- gradient color stops
- rotation on / off
- rotation direction
- pulse speed
- rotation speed
- glow intensity
- glow saturation
- outline width
- outline opacity
- visibility preset: `scale`, `trim`, `zoom`
- active visibility state for animate in / out

It also includes a few demo-shell controls:

- built-in preset selection
- custom preset save / delete
- import / export of settings as JSON
- dark / light UI theme
- phone / card preview surface
- zoom controls
- preview grid toggle

## Run Locally

From `prism-studio-demo/`:

```bash
npm install
npm run dev
```

Other commands:

```bash
npm run lint
npm run build
npm run preview
```

## Relationship To The Package

This app is only the demo/editor layer.

If you want the reusable glow components themselves, look at the root package README in `../README.md`, which documents:

- `PrismGlow`
- `PrismLockScreen`
- the component API for production usage

## Notes

- Branding and favicon use `public/icon.svg`.
- Custom presets are stored in local storage in the browser.
- The demo is intended for exploration, tuning, and visual QA of the exposed Prism parameters.
