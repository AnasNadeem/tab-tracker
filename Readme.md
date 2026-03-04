# Tab Time Tracker

Track the time you spend on every browser tab — active time, total time, and per-URL breakdowns.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/nmopfbobjebfhkhnlkemgpjkncbenihj)](https://chrome.google.com/webstore/detail/tab-time-tracker/nmopfbobjebfhkhnlkemgpjkncbenihj)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Install

[**Download from Chrome Web Store**](https://chrome.google.com/webstore/detail/tab-time-tracker/nmopfbobjebfhkhnlkemgpjkncbenihj)

## Features

- Track active time vs total time on each tab
- Persistent tracking — keeps running even after tabs are closed
- Clear history for closed tabs
- Switch between active and closed tab views
- In-depth breakdown of time spent on each URL visited within a tab
- Dark mode support

## Screenshots

![Light Mode - Active Tab](https://github.com/AnasNadeem/tab-tracker/blob/main/screenshots/v3/light%20mode%20active%20tab%20ss.jpeg?raw=true)

![Light Mode - Active Tab on Dark Background](https://github.com/AnasNadeem/tab-tracker/blob/main/screenshots/v3/light%20mode%20active%20tab%20on%20dark%20bg%20ss.jpeg?raw=true)

![Light Mode - Closed Tab](https://github.com/AnasNadeem/tab-tracker/blob/main/screenshots/v3/light%20mode%20close%20tab%20ss.jpeg?raw=true)

![Light Mode - History Tab on Dark Background](https://github.com/AnasNadeem/tab-tracker/blob/main/screenshots/v3/light%20mode%20history%20tab%20on%20dark%20bg.jpeg?raw=true)

![Dark Mode - Active Tab](https://github.com/AnasNadeem/tab-tracker/blob/main/screenshots/v3/dark%20mode%20active%20tab%20no%20bg.jpeg?raw=true)

![Dark Mode - Active Tab on Dark Background](https://github.com/AnasNadeem/tab-tracker/blob/main/screenshots/v3/dark%20mode%20active%20tab%20on%20dark%20bg.jpeg?raw=true)

![Full Page on Dark Background](https://github.com/AnasNadeem/tab-tracker/blob/main/screenshots/v3/full%20page%20ss%20with%20dark%20bg.jpeg?raw=true)

## Development

```bash
git clone https://github.com/AnasNadeem/tab-tracker.git
cd tab-tracker
npm install
```

Load the extension in Chrome:

1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the project directory

Build for distribution:

```bash
npm run build
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
