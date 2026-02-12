# CLAUDE.md — Project Context for Claude Code

This file provides context for Claude Code when working on the JTX project.

---

## Project Overview

**JTX (Jellyfin Text Browser)** is a single-page, text-based media browser for Jellyfin.
It presents movies and TV shows as sortable, filterable tables with no frameworks or build steps.
Tabbed interface (Movies | TV Shows), virtual scrolling for 5K+ item libraries.

- **Repo:** https://github.com/Cascadealot/jellyfin-text-ui
- **Live:** http://192.168.1.183:8080 (nginx on Unraid NAS)
- **Jellyfin:** http://192.168.1.183:8096
- **Dev container:** LXC 120 (`jtx-dev`) on Proxmox at 192.168.1.105

## Architecture

```
Browser (single HTML file)
  ├── Inline CSS (dark theme, monospace, table-focused)
  ├── Inline JS (fetch, sort, filter, render)
  ├── Loads jtx-core.js as shared logic module
  └── Calls Jellyfin REST API with embedded API key
        └── http://192.168.1.183:8096/Items?api_key=...
```

### Key files
| File | Purpose |
|------|---------|
| `src/index.html` | The complete single-page application |
| `src/jtx-core.js` | Extracted logic (parseMovie, parseSeries, sort, filter, virtualScroll) shared with tests |
| `src/synopses.json` | AI-generated movie blurbs (keyed by movie ID) |
| `scripts/generate-synopses.js` | Script to generate blurbs via Claude API |
| `mocks/jellyfin-response.json` | Sample API data for offline testing |
| `tests/unit/*.test.js` | Vitest unit tests |

### API access
- **Jellyfin API key:** `b62806a76e91466fa5964648d545a446`
- **Usage:** Append `?api_key=<key>` to any Jellyfin REST endpoint
- **Movie items:** `GET /Items?IncludeItemTypes=Movie&Recursive=true&Fields=...&api_key=...`
- **TV series:** `GET /Items?IncludeItemTypes=Series&Recursive=true&Fields=Overview,Genres,People,Studios,CommunityRating,CriticRating,OfficialRating,ProductionYear,Status,ChildCount,RecursiveItemCount&api_key=...`
- **Poster images:** `GET /Items/{id}/Images/Primary?maxHeight=60&quality=80&api_key=...`

## Infrastructure

| Resource | Address | Access |
|----------|---------|--------|
| Stanlee's PC | 192.168.1.50 | Local (Claude runs here) |
| Unraid NAS (Principle) | 192.168.1.183 | SSH root (key-based) |
| Proxmox (AMAB) | 192.168.1.107 | SSH root (key-based) |
| Dev LXC (jtx-dev) | 192.168.1.105 | SSH root (key-based) |

### Deploying changes
1. Edit files in `/opt/jellyfin-text-ui/` on the dev LXC (192.168.1.105)
2. Run tests: `cd /opt/jellyfin-text-ui && npx vitest run`
3. Commit and push: `git add -A && git commit -m "..." && git push`
4. Deploy to NAS: `scp src/index.html root@192.168.1.183:/mnt/user/appdata/jtx-nginx/html/index.html`
5. Also copy synopses.json if updated: `scp src/synopses.json root@192.168.1.183:/mnt/user/appdata/jtx-nginx/html/synopses.json`

### Running commands on the LXC
SSH directly: `ssh root@192.168.1.105 "command"`
Or via Proxmox: `ssh root@192.168.1.107 "pct exec 120 -- bash -c 'command'"`
Note: gh CLI needs explicit PATH: `export PATH=/usr/local/bin:$PATH`

## Coding Conventions

- **No frameworks** — vanilla HTML, CSS, JS only
- **Single file** — index.html is the entire app; jtx-core.js is extracted for testability
- **No build step** — everything runs directly in the browser
- **Dark theme** — CSS custom properties in `:root` for all colors
- **Monospace font** — Cascadia Code / Fira Code / Consolas fallback chain
- **Table-first layout** — semantic `<table>`, not CSS grid/flex tables
- **Test everything testable** — sort, filter, parse, format functions all have unit tests
- **Commit style** — conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `chore:`

## AI Synopsis Feature

### Critic persona
The AI-generated movie blurbs are written in the voice of a specific character:

> A long-time, well-appreciated **sci-fi aficionado** who loves movies with
> **minimal underlying music**. A full-time film critic based in the
> **Lofoten Islands** who loves **jazz**. Opinionated but fair, with a
> dry Nordic wit and a tendency to draw unexpected parallels between
> cinema and the Arctic landscape.

### Blurb requirements
- 2-4 sentences, engaging and opinionated
- References the critic's perspective where natural (not forced)
- Includes: summary hook, genre feel, standout performances
- Tone: knowledgeable, slightly irreverent, warm but honest
- If the movie has notable soundtrack qualities (minimal score, jazz elements), mention it

### Data format (synopses.json)
```json
{
  "movieId": {
    "blurb": "The critic's review text...",
    "generated": "2026-02-12"
  }
}
```
