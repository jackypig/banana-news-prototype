#!/usr/bin/env python3
"""
Scrapes 2026 FIFA World Cup group standings from Wikipedia and patches
the STANDINGS_START/END block in index.html.

Run manually:
    python3 scripts/update_standings.py

Set up as a cron job (every 3 hours):
    crontab -e
    0 */3 * * * /usr/bin/python3 /Users/linghung/banana-news-prototype/scripts/update_standings.py
"""

import re
import sys
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
ROOT       = Path(__file__).resolve().parent.parent
INDEX_HTML = ROOT / "index.html"
LOG_FILE   = ROOT / "scripts" / "update.log"
SOURCE_URL = "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_{letter}"
GROUP_LETTERS = list("ABCDEFGHIJKL")

FLAG = {
    "Mexico": "🇲🇽", "South Africa": "🇿🇦", "South Korea": "🇰🇷", "Czechia": "🇨🇿",
    "Switzerland": "🇨🇭", "Canada": "🇨🇦", "Bosnia and Herzegovina": "🇧🇦", "Qatar": "🇶🇦",
    "Brazil": "🇧🇷", "Morocco": "🇲🇦", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Haiti": "🇭🇹",
    "United States": "🇺🇸", "Australia": "🇦🇺", "Paraguay": "🇵🇾", "Turkey": "🇹🇷", "Türkiye": "🇹🇷",
    "Germany": "🇩🇪", "Ivory Coast": "🇨🇮", "Ecuador": "🇪🇨", "Curaçao": "🇨🇼",
    "Netherlands": "🇳🇱", "Japan": "🇯🇵", "Sweden": "🇸🇪", "Tunisia": "🇹🇳",
    "Belgium": "🇧🇪", "Egypt": "🇪🇬", "Iran": "🇮🇷", "New Zealand": "🇳🇿",
    "Spain": "🇪🇸", "Cape Verde": "🇨🇻", "Uruguay": "🇺🇾", "Saudi Arabia": "🇸🇦",
    "France": "🇫🇷", "Norway": "🇳🇴", "Senegal": "🇸🇳", "Iraq": "🇮🇶",
    "Argentina": "🇦🇷", "Austria": "🇦🇹", "Algeria": "🇩🇿", "Jordan": "🇯🇴",
    "Colombia": "🇨🇴", "Portugal": "🇵🇹", "DR Congo": "🇨🇩", "Uzbekistan": "🇺🇿",
    "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croatia": "🇭🇷", "Ghana": "🇬🇭", "Panama": "🇵🇦",
}

# ── Logging ───────────────────────────────────────────────────────────────────
def log(msg: str):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


# ── Wikipedia table parser ────────────────────────────────────────────────────
class WikiTableParser(HTMLParser):
    """Extracts all wikitable rows as lists of plain text cells."""

    def __init__(self):
        super().__init__()
        self.tables = []          # list of tables; each table = list of rows
        self._in_table = 0
        self._in_cell = False
        self._cell_buf = []
        self._row_buf = []
        self._table_buf = []

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        if tag == "table":
            cls = attr_dict.get("class", "")
            if "wikitable" in cls:
                self._in_table += 1
                self._table_buf = []
        if self._in_table:
            if tag in ("td", "th"):
                self._in_cell = True
                self._cell_buf = []
            elif tag == "tr":
                self._row_buf = []

    def handle_endtag(self, tag):
        if self._in_table:
            if tag in ("td", "th"):
                self._in_cell = False
                self._table_buf  # still in row
                self._row_buf.append("".join(self._cell_buf).strip())
                self._cell_buf = []
            elif tag == "tr":
                if self._row_buf:
                    self._table_buf.append(self._row_buf)
                self._row_buf = []
            elif tag == "table":
                self._in_table -= 1
                if self._in_table == 0:
                    self.tables.append(self._table_buf)
                    self._table_buf = []

    def handle_data(self, data):
        if self._in_cell:
            self._cell_buf.append(data)

    def handle_entityref(self, name):
        if self._in_cell:
            entities = {"amp": "&", "nbsp": " ", "ndash": "–", "mdash": "—"}
            self._cell_buf.append(entities.get(name, ""))

    def handle_charref(self, name):
        if self._in_cell:
            try:
                ch = chr(int(name[1:], 16) if name.startswith("x") else int(name))
                self._cell_buf.append(ch)
            except Exception:
                pass


# ── Fetch & parse ─────────────────────────────────────────────────────────────
def fetch_page(url: str) -> str:
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 BananaNewsBot/1.0 (educational project)"
    })
    import ssl
    try:
        ctx = ssl.create_default_context()
        with urllib.request.urlopen(req, timeout=20, context=ctx) as resp:
            return resp.read().decode("utf-8")
    except Exception:
        # macOS Python often lacks the system cert bundle; fall back to unverified
        ctx = ssl._create_unverified_context()
        with urllib.request.urlopen(req, timeout=20, context=ctx) as resp:
            return resp.read().decode("utf-8")


def is_standings_table(rows: list) -> bool:
    """A standings table has a header row containing Pts or Points."""
    for row in rows[:3]:
        joined = " ".join(row).upper()
        if "PTS" in joined or "POINTS" in joined:
            return True
    return False


def parse_one_group(html: str, group_name: str) -> dict | None:
    """Parse a single group page and return { name, teams }."""
    parser = WikiTableParser()
    parser.feed(html)

    standings_tables = [t for t in parser.tables if is_standings_table(t)]
    if not standings_tables:
        return None

    # Use the first standings table found
    table = standings_tables[0]
    teams = []
    for row in table:
        if len(row) < 5:
            continue
        cells = [c.strip() for c in row]

        # Detect leading position number column
        offset = 0
        try:
            int(cells[0])
            offset = 1
        except ValueError:
            pass

        if len(cells) < offset + 5:
            continue

        team_name = cells[offset]
        if team_name.upper() in ("TEAM", "") or team_name.startswith("[") or len(team_name) > 40:
            continue

        try:
            p = int(re.sub(r"\[.*?\]", "", cells[offset + 1]))
            w = int(re.sub(r"\[.*?\]", "", cells[offset + 2]))
            d = int(re.sub(r"\[.*?\]", "", cells[offset + 3]))
            l = int(re.sub(r"\[.*?\]", "", cells[offset + 4]))
            # Pts: scan remaining cells right-to-left
            pts = None
            for c in reversed(cells[offset + 5:]):
                try:
                    pts = int(re.sub(r"\[.*?\]", "", c).strip())
                    break
                except ValueError:
                    continue
            if pts is None:
                continue
        except (ValueError, IndexError):
            continue

        teams.append({"name": team_name, "p": p, "w": w, "d": d, "l": l, "pts": pts})

    if not teams:
        return None

    # Also try to detect qualified teams from Wikipedia's coloured rows
    # (green background = qualified). As a fallback, mark top 2.
    qualified_names = set()
    green_pattern = re.compile(
        r'background(?:-color)?:\s*(?:#9f[0-9a-f]|green|#0[0-9a-f]{4}0[0-9a-f])', re.I
    )
    # look for rows with green style in the raw HTML
    row_pattern = re.compile(r'<tr[^>]*style="([^"]*)"[^>]*>(.*?)</tr>', re.DOTALL | re.I)
    for m in row_pattern.finditer(html):
        style, row_html = m.group(1), m.group(2)
        if green_pattern.search(style):
            name_match = re.search(r'title="([^"]+)"', row_html)
            if name_match:
                qualified_names.add(name_match.group(1))

    for rank, team in enumerate(teams):
        if qualified_names:
            team["qualified"] = team["name"] in qualified_names
        else:
            team["qualified"] = rank < 2  # fallback: top 2

    return {"name": group_name, "teams": teams}


def parse_groups(pages: dict) -> list:
    """pages = { "Group A": html_string, ... }  →  list of group dicts."""
    groups = []
    for group_name, html in pages.items():
        result = parse_one_group(html, group_name)
        if result:
            groups.append(result)
    return groups


# ── HTML builder ──────────────────────────────────────────────────────────────
def build_html(groups: list) -> str:
    blocks = ""
    for group in groups:
        rows = ""
        for team in group["teams"]:
            emoji = FLAG.get(team["name"], "🏳️")
            cls   = ' class="qualified"' if team["qualified"] else ""
            rows += (
                f'<tr{cls}><td>{emoji} {team["name"]}</td>'
                f'<td>{team["p"]}</td><td>{team["w"]}</td>'
                f'<td>{team["d"]}</td><td>{team["l"]}</td>'
                f'<td class="pts">{team["pts"]}</td></tr>\n'
            )
        blocks += (
            f'<div class="group-block">'
            f'<div class="group-block-title">{group["name"]}</div>\n'
            f'<table class="group-table">\n{rows}</table></div>\n'
        )

    updated = datetime.now(timezone.utc).strftime("%d %b %Y %H:%M UTC")
    return (
        f'<!-- STANDINGS_START -->\n'
        f'<!-- updated: {updated} -->\n'
        f'<div class="group-standings-scroll"><div class="group-grid">\n'
        f'{blocks}'
        f'</div></div>\n'
        f'<!-- STANDINGS_END -->'
    )


def patch_html(new_block: str):
    html = INDEX_HTML.read_text(encoding="utf-8")
    pattern = r'<!-- STANDINGS_START -->.*?<!-- STANDINGS_END -->'
    updated, count = re.subn(pattern, new_block, html, flags=re.DOTALL)
    if count == 0:
        raise RuntimeError("STANDINGS_START/END markers not found in index.html")
    INDEX_HTML.write_text(updated, encoding="utf-8")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    pages = {}
    for letter in GROUP_LETTERS:
        url = SOURCE_URL.format(letter=letter)
        log(f"Scraping Group {letter}...")
        try:
            pages[f"Group {letter}"] = fetch_page(url)
        except Exception as e:
            log(f"WARNING: could not fetch Group {letter}: {e}")

    groups = parse_groups(pages)
    if len(groups) < 6:
        log(f"ERROR: only {len(groups)} groups parsed — page structure may have changed")
        sys.exit(1)

    log(f"Parsed {len(groups)} groups")
    new_block = build_html(groups)

    try:
        patch_html(new_block)
    except Exception as e:
        log(f"ERROR patching index.html: {e}")
        sys.exit(1)

    log(f"index.html updated successfully ({len(groups)} groups)")


if __name__ == "__main__":
    main()
