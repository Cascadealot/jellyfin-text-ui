# JTX Architecture

## Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Firefox / Chrome / Mobile)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  src/index.html (single-page application)             │  │
│  │  ├── Inline CSS (dark theme, table-focused)           │  │
│  │  ├── Inline JS (fetch, sort, filter, render, hover)   │  │
│  │  ├── Imports jtx-core.js (shared logic)               │  │
│  │  └── Loads synopses.json (AI-generated blurbs)        │  │
│  └────────────────┬──────────────────┬───────────────────┘  │
│                   │                  │                       │
│          Jellyfin REST API    Static file (nginx)           │
└───────────────────┼──────────────────┼───────────────────────┘
                    │                  │
      ┌─────────────▼───────┐   ┌─────▼──────────┐
      │  Jellyfin Server    │   │  nginx :8080    │
      │  :8096              │   │  serves JTX     │
      │  ├── /Items (data)  │   │  index.html     │
      │  ├── /Images (art)  │   │  synopses.json  │
      │  └── /Videos (play) │   └────────────────┘
      └─────────────────────┘
```

## Data Flow

1. User opens `http://192.168.1.183:8080`
2. nginx serves `index.html`
3. JS authenticates with Jellyfin API (embedded API key)
4. JS fetches all movie items with metadata fields
5. JS loads `synopses.json` for AI-generated blurbs
6. Data merged into in-memory array
7. Table rendered with thumbnails, sortable columns, filters
8. Sort/filter operations work on local array (no re-fetching)
9. Hover over thumbnail → shows hover card with synopsis + larger poster
10. Click "Open in Jellyfin" → opens movie in Jellyfin web player

## Table Columns (v0.2)

| # | Column | Width | Sortable | Source |
|---|--------|-------|----------|--------|
| 1 | Thumbnail | 50px | No | Jellyfin `/Items/{id}/Images/Primary` |
| 2 | Title | 26% | Yes | `item.Name` |
| 3 | Year | 6% | Yes | `item.ProductionYear` |
| 4 | Director | 14% | Yes | `item.People[type=Director]` |
| 5 | Genre | 12% | Yes | `item.Genres` |
| 6 | Rating | 6% | Yes | `item.CommunityRating` |
| 7 | Runtime | 6% | Yes | `item.RunTimeTicks / 600000000` |
| 8 | Resolution | 7% | Yes | `MediaStreams[Video].Height` |
| 9 | Audio | 7% | Yes | `MediaStreams[Audio].Channels` |
| 10 | Codec | 7% | Yes | `MediaStreams[Video].Codec` |
| 11 | Size | 7% | Yes | Estimated from bitrate × duration |

## Hover Card System

### Trigger
- **Desktop:** `mouseenter` on thumbnail image → show card; `mouseleave` → hide
- **Mobile:** `tap` on thumbnail → toggle card

### Card content
- Larger poster image (200px height)
- Movie title, year, official rating
- Rotten Tomatoes score (from `item.CriticRating`, displayed as "X% Fresh/Rotten")
- Genre tags
- Director and top cast
- AI-generated blurb (from synopses.json, falls back to Jellyfin overview)
- Enlarge button to expand card further

### Sizing
- Thumbnail in table: matches current font height + 25%
- Hover card: medium (roughly 400px × 250px)
- Enlargeable to ~600px × 400px on click

## AI Synopsis Pipeline

### Overview
A Node.js script (`scripts/generate-synopses.js`) generates creative movie blurbs:

1. Fetches movie list from Jellyfin API
2. Loads existing `synopses.json`
3. For each movie without a blurb, calls Claude API with the critic persona
4. Writes updated `synopses.json`
5. File is deployed alongside `index.html` to the nginx server

### Critic Persona
A sci-fi aficionado and full-time film critic based in the Lofoten Islands.
Loves jazz and movies with minimal underlying music. Dry Nordic wit.
See `CLAUDE.md` for full persona description and blurb requirements.

### Regeneration
- Script is idempotent — only generates blurbs for new movies
- Can be re-run manually or on a schedule
- Existing blurbs are preserved unless explicitly regenerated

## Technology Choices

| Choice | Rationale |
|--------|-----------|
| Vanilla HTML/CSS/JS | Zero build tooling, single file, instant load |
| No frameworks | Overkill for a table + hover card |
| Jellyfin REST API | Already available, well-documented |
| CSS custom properties | Themeable, maintainable |
| localStorage | Cache API token (future use) |
| Vitest | Fast, ESM-native test runner |
| Pre-generated synopses | Fast hover, works offline, editable |

## Test Strategy

| Layer | Runner | Coverage |
|-------|--------|----------|
| Unit tests | Vitest + jsdom | Sort, filter, parse, format, RT label, thumbnail URL |
| Integration | Manual / curl | Jellyfin API responses, image loading |
| E2E | Browser manual (Playwright future) | Full page interaction |
