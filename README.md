# Saurav Mishra — Personal Portfolio

Live site: [itzsaurav.github.io](https://itzsaurav.github.io)

Source code for my personal developer portfolio hosted on GitHub Pages. Built from the ground up with pure vanilla web standards — zero heavy framework bloat, zero massive node_modules folders, and zero tracking scripts. Just clean, fast, accessible code that loads instantly.

---

## The Philosophy

A lot of modern portfolio templates ship 50MB of JavaScript just to render a couple of text blocks and some links. Tbh that never sat right with me.

I wanted a portfolio that:
- Loads in milliseconds on any network connection.
- Is 100% static with zero external trackers, analytics, or surveillance cookies.
- Looks clean in both dark and light modes with persistent theme state.
- Uses native browser APIs, clean Lucide SVG icons, and zero-dependency vanilla JavaScript.

---

## What Is Inside

### 1. Core Portfolio Experience (`index.html`)
- Clean, responsive layout with custom CSS design tokens and fluid typography.
- Interactive hero section with typewriter dynamic text rotation and Lucide-enhanced action buttons.
- Showcase cards for all my core active projects with direct GitHub and live demo links.
- Verified skills breakdown covering backend development, systems, and automation.
- Live tech news feed dynamically pulled from the official Hacker News Firebase REST API.
- Quick contact endpoints and direct links to my verified PDF resume.

### 2. Styling & Iconography (`style.css`)
- Light and dark theme palettes with smooth CSS transitions.
- Native Lucide stroke SVG icons (ISC license) integrated directly for GitHub, LinkedIn, categories, external links, and contact channels.
- Fully responsive navigation with animated mobile drawer and accessible ARIA attributes.

---

## Tech Stack

- **Markup & Layout**: Semantic HTML5, CSS3 Custom Properties (Variables), Flexbox, CSS Grid.
- **Scripting**: Vanilla JavaScript (ES6+), async/await fetch pipelines.
- **Iconography**: Lucide Icons (pure inline SVGs, zero AI generation, zero font files).
- **External Feeds**: Hacker News public REST API.
- **Hosting & CI/CD**: GitHub Pages with automatic branch deployment.

---

## File Structure

```text
itzsaurav.github.io/
├── index.html              # Main portfolio landing page
├── style.css               # Core styling, design tokens, and theme definitions
├── script.js               # Theme toggling, typewriter effect, HN feed logic
├── Saurav_Mishra_Resume.pdf# Current verified resume
├── sitemap.xml             # Search engine index map
├── robots.txt              # Crawler access definitions
└── README.md               # Project documentation
```

---

## Local Development Quickstart

Running this locally takes literally five seconds bro since there are no build steps, compilers, or bundlers required.

### 1. Clone the Repo
```bash
git clone https://github.com/ItzSaurav/itzsaurav.github.io.git
cd itzsaurav.github.io
```

### 2. Start a Local Static Server
You can use Python's built-in HTTP server:
```bash
python -m http.server 8000
```
Or if you prefer Node:
```bash
npx serve .
```

### 3. Open in Your Browser
Hit `http://localhost:8000` in your browser and you are good to go.

---

## License

MIT License. Feel free to use the structure as inspiration for your own portfolio, just swap out my personal details and projects with your own.
