# Personal Portfolio

Source code for the personal developer portfolio website of Saurav Mishra, hosted on GitHub Pages.

## Overview

A fast, lightweight, and responsive static website showcasing developer background, verified technical projects, and skills.

## Tech Stack

- Frontend: Semantic HTML5, CSS3 Custom Properties, Vanilla JavaScript (ES6+)
- Analytics & Visitor Logs: Firebase Cloud Firestore + Chart.js
- News Feed: Hacker News Firebase REST API
- Hosting: GitHub Pages

## Features

- Dynamic typing introduction and dark/light mode toggle with theme persistence.
- Project showcases with live demos and repository links.
- Live tech news feed dynamically fetched from Hacker News.
- **Visitor Analytics Dashboard (`/analytics.html`)**:
  - Weekly traffic aggregation and trend comparison.
  - Traffic source distribution (LinkedIn, GitHub, Google, direct).
  - Day-of-week breakdown and device/OS telemetry.
  - Detailed real-time visitor event logs with CSV export.

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/ItzSaurav/itzsaurav.github.io.git
   cd itzsaurav.github.io
   ```

2. Open `index.html` in any modern web browser or serve locally:
   ```bash
   python -m http.server 8000
   ```

3. Navigate to `http://localhost:8000`.

## License

MIT License. See `LICENSE.txt` for details.
