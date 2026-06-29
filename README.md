# Banana News — International Edition

A satirical broadsheet-style news prototype built as a single `index.html` file. No build step, no framework — open it in a browser and it works.

## Features

- **10 editorial sections** navigable via a slide-out sidebar: Front Page, Banana Desk, Marine & Culinary, Tundra & Wildlife, Tech & Cyber Watch, World & Global Affairs, Local Economy, Science Desk, Fashion & Lifestyle, Puzzles & Leisure
- **⚽ World Cup 2026 section** with satirical match coverage, quarter-final results, semi-final schedule, and a live group standings panel (all 12 groups, 48 teams)
- **Quick-switch tile banner** for jumping between featured stories
- **Article modal popups** — click any headline to read the full piece
- **Interactive puzzles** — Sudoku and Word Jumble in the right column
- **Financial ticker** and weather strip
- **Responsive layout** — 3-column on desktop, stacks on mobile

## Running locally

A local server is required (the app fetches section data via `fetch()`):

```bash
python3 -m http.server 4321
# then open http://localhost:4321
```

## Keeping World Cup standings current

Group standings are scraped from Wikipedia and patched into `sections/worldcup/data.json`. Run the update script manually:

```bash
python3 scripts/update_standings.py
```

Or set up a cron job to run it automatically (every 3 hours):

```bash
crontab -e
# add this line:
0 */3 * * * /usr/bin/python3 /path/to/banana-news-prototype/scripts/update_standings.py
```

Logs are written to `scripts/update.log`. The script requires no external dependencies — Python stdlib only.

## Project structure

```
banana-news-prototype/
├── index.html               # Slim HTML shell — markup only
├── css/
│   └── styles.css           # All styles
├── js/
│   ├── app.js               # Navigation, section loader, modal
│   └── puzzles.js           # Sudoku + Word Jumble logic and data
├── sections/                # One folder per editorial section
│   ├── front/data.json
│   ├── banana/data.json
│   ├── marine/data.json
│   ├── tech/data.json
│   ├── tundra/data.json
│   ├── world/data.json
│   ├── local/data.json
│   ├── science/data.json
│   ├── fashion/data.json
│   ├── worldcup/data.json   ← standings HTML lives here
│   └── puzzles/data.json
├── scripts/
│   ├── update_standings.py  # Scrapes Wikipedia → patches worldcup/data.json
│   └── update.log           # Auto-generated run log
└── *.jpeg                   # Local images referenced by articles
```
