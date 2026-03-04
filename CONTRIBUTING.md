# Contributing to Tab Time Tracker

Thanks for your interest in contributing!

## Dev Setup

```bash
git clone https://github.com/AnasNadeem/tab-tracker.git
cd tab-tracker
npm install
npm run build
```

## Project Structure

| Path | Description |
|---|---|
| `background.js` | Service worker — tab tracking, time calculation, storage |
| `popup.js` | UI logic — renders active/closed tabs, handles user interactions |
| `popup.html` | HTML template for the extension popup |
| `popup.css` | Styling — light/dark mode, responsive layout |
| `utils.js` | Helper functions — time formatting, string truncation |
| `manifest.json` | Chrome extension manifest (v3) |
| `build.js` | Build script — minification (Terser) and ZIP packaging |
| `images/` | Extension icon assets |
| `screenshots/` | Chrome Web Store and README screenshots |

## Loading the Extension Locally

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the project root directory (or `dist/` for the minified build)

## Code Style

- Vanilla JavaScript (no frameworks)
- No linter configured yet — match surrounding code style
- Use descriptive variable names and keep functions focused

## Making Changes

1. Create a branch from `main`
2. Make your changes
3. Test the extension locally in Chrome
4. Run `npm run build` to verify the build succeeds
5. Open a PR with a clear description of your changes

## Building for Distribution

```bash
npm run build
```

This minifies JS files into `dist/`, copies static assets, and creates `tab-time-tracker.zip` for Chrome Web Store submission.
