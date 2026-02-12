# Project: Jellyfin Text UI (JTX)

**A lightweight, text-based movie browser for Jellyfin**

---

## 1. Actor Roles & Responsibilities

### Claude (AI Development Agent)
- **Role:** Full-stack developer, DevOps engineer, architect, tester
- **Responsibilities:**
  - Write all application code (HTML, CSS, JavaScript)
  - Create and maintain the test suite
  - Set up and configure the development environment (container/VM on Proxmox)
  - Set up the GitHub repository, branching strategy, and CI
  - Configure automated backups to the NAS
  - Deploy to the target environment
  - Document all decisions and trade-offs
- **Operating constraints:**
  - All development work happens inside a containerized/VM environment on Proxmox — never directly on the host PC
  - All code must pass the test suite before merging to main
  - Every change is committed with clear, descriptive messages
  - Claude presents plans before executing destructive or irreversible actions

### Stanlee (Project Owner)
- **Role:** Requirements owner, reviewer, end-user tester
- **Responsibilities:**
  - Define and refine requirements
  - Review and approve designs before implementation
  - Acceptance testing (does this actually help me find movies?)
  - Approve deployments to production
  - Provide access credentials as needed

---

## 2. Project Overview

### What we're building
A single-page web application that connects to the existing Jellyfin server (`192.168.1.183:8096`) via its REST API and presents the movie library as a sortable, filterable text table.

### Why
To test the hypothesis that a text-centric interface (title, director, genre, quality) is faster and more natural for finding movies than a poster-grid UI. This is a data-gathering exercise — the outcome informs whether to invest in a fuller solution.

### Success criteria
1. Page loads the full movie library in under 3 seconds
2. User can sort by any column with a single click
3. User can filter by genre, year range, rating, quality, and free-text search
4. User can click a movie to see full details and launch playback
5. Works on desktop (Firefox/Chrome) and mobile browsers
6. Zero external dependencies beyond a web browser

---

## 3. Architecture

### Application architecture
```
┌─────────────────────────────────────────────────┐
│  Browser (Firefox / Chrome / Mobile)            │
│  ┌───────────────────────────────────────────┐  │
│  │  Single HTML file                         │  │
│  │  ├── Inline CSS (minimal, table-focused)  │  │
│  │  ├── Inline JS (fetch, sort, filter)      │  │
│  │  └── No frameworks, no build step         │  │
│  └──────────────────┬────────────────────────┘  │
│                     │ HTTP (Jellyfin REST API)   │
└─────────────────────┼───────────────────────────┘
                      │
        ┌─────────────▼─────────────────┐
        │  Jellyfin Server              │
        │  192.168.1.183:8096           │
        │  ├── /Users/AuthenticateByName│
        │  ├── /Items (movie metadata)  │
        │  └── /Videos (playback URLs)  │
        └───────────────────────────────┘
```

### Data flow
1. User opens the page → JS authenticates with Jellyfin API
2. JS fetches all movie items with metadata fields
3. Data is loaded into an in-memory array
4. Table is rendered from the array
5. Sort/filter operations work on the local array (no re-fetching)
6. Clicking "Play" constructs a Jellyfin playback URL and opens it

### Technology choices
| Choice | Rationale |
|--------|-----------|
| Vanilla HTML/CSS/JS | Zero build tooling, single file, instant load |
| No frameworks (React, Vue, etc.) | Overkill for a single table; adds complexity |
| Jellyfin REST API | Already available, well-documented, returns JSON |
| CSS Grid/Table | Semantic, accessible, works everywhere |
| localStorage | Cache API token so user doesn't re-login every visit |

---

## 4. Infrastructure

### Confirmed infrastructure
| Resource | Address | Specs | Role | Access |
|----------|---------|-------|------|--------|
| Stanlee's PC | 192.168.1.50 | Ubuntu 25.10, NVMe | Development terminal (Claude runs here) | Local |
| Unraid NAS (Principle) | 192.168.1.183 | Ryzen 5 2400G, 30GB RAM, 23TB storage, Unraid 7.2.3 | Jellyfin host, file storage, backups | SSH (root, key-based) |
| Proxmox Server (AMAB) | 192.168.1.107:8006 | 24 CPU threads, 126GB RAM, PVE 9.1.5 | Development VM/container host | SSH (root, key-based) |
| GitHub | github.com/Cascadealot | — | Code hosting, CI | gh CLI authenticated |

### Existing Proxmox VMs/Containers (all stopped)
| ID | Name | Type | Pool | Resources |
|----|------|------|------|-----------|
| 100 | testapen-control | VM | — | 2 CPU, 4GB RAM, 64GB disk |
| 101 | testapen-master | LXC | TestAPEN | 2 CPU, 2GB RAM, 16GB disk |
| 102 | testapen-rudder | LXC | TestAPEN | 2 CPU, 2GB RAM, 16GB disk |
| 103 | testapen-ui | LXC | TestAPEN | 2 CPU, 2GB RAM, 16GB disk |
| 110 | testapen-ci | LXC | TestAPEN | 4 CPU, 4GB RAM, 32GB disk |
| 150 | CasDev | VM | TestAPEN | 4 CPU, 8GB RAM, 64GB disk |
| 200 | esp-idf-dev | VM (template) | — | 4 CPU, 8GB RAM, 64GB disk |

### What needs to be set up
| Item | Action Required |
|------|----------------|
| **Dev container on Proxmox** | Create new LXC (ID 120) `jtx-dev` — Debian/Ubuntu, Node.js, git, gh CLI, web server |
| **GitHub repo** | Create `jellyfin-text-ui` under Cascadealot account |
| **NAS backup target** | Create `/mnt/user/Stor/Backups/jellyfin-text-ui/` on the NAS |
| **Deployment target** | Host via nginx container on NAS alongside Jellyfin (recommended), or on the dev LXC |

### Network diagram
```
  ┌──────────────┐    2.5 GbE     ┌─────────────────────┐
  │  Stanlee PC  │◄──────────────►│  Unraid NAS         │
  │  .50         │                │  .183               │
  │  Ubuntu 25.10│                │  Unraid 7.2.3       │
  │  Claude CLI  │                │  Jellyfin :8096     │
  └──────┬───────┘                │  Backup storage     │
         │                        │  JTX hosting :8080  │
         │ LAN                    └─────────────────────┘
         │
  ┌──────▼───────┐
  │  Proxmox     │
  │  .107        │
  │  AMAB node   │
  │  24 CPU      │
  │  126GB RAM   │
  │  ┌─────────┐ │
  │  │ LXC 120 │ │
  │  │ jtx-dev │ │
  │  │ git,node│ │
  │  └─────────┘ │
  └──────────────┘
```

---

## 5. Development Environment

### Dev container spec (LXC on Proxmox)
- **OS:** Debian 12 (Bookworm) or Ubuntu 24.04
- **Resources:** 2 CPU cores, 2 GB RAM, 20 GB disk
- **Software:**
  - git
  - Node.js 22 LTS (for test runner and dev server)
  - gh CLI (GitHub CLI)
  - python3 (for quick HTTP serving during dev: `python3 -m http.server`)
  - curl, jq (API debugging)
- **Network:** Bridged to LAN (same 192.168.1.x subnet), can reach Jellyfin at .183:8096
- **SSH:** Key-based access from Stanlee's PC

### Backup strategy
- **Code:** Pushed to GitHub on every meaningful change (the primary backup)
- **NAS backup:** Nightly rsync of the dev container's project directory to `/mnt/user/Stor/Backups/jellyfin-text-ui/`
- **Proxmox snapshots:** Snapshot the dev container before major environment changes

---

## 6. GitHub Repository

### Repository: `jellyfin-text-ui`
```
jellyfin-text-ui/
├── README.md               # Project overview, setup instructions
├── LICENSE                  # MIT
├── src/
│   └── index.html          # The single-file application
├── tests/
│   ├── unit/
│   │   ├── sort.test.js    # Sorting logic tests
│   │   ├── filter.test.js  # Filtering logic tests
│   │   ├── api.test.js     # API response parsing tests
│   │   └── render.test.js  # Table rendering tests
│   ├── integration/
│   │   └── jellyfin.test.js # Live API integration tests
│   └── e2e/
│       └── browser.test.js  # Headless browser end-to-end tests
├── mocks/
│   └── jellyfin-response.json  # Sample API response for offline testing
├── package.json            # Test runner config (vitest or similar)
├── .github/
│   └── workflows/
│       └── test.yml        # CI: run tests on every push/PR
└── docs/
    ├── ARCHITECTURE.md     # This document (refined)
    └── API-NOTES.md        # Jellyfin API quirks and field mappings
```

### Branching strategy
- `main` — stable, tested, deployable
- `dev` — active development branch
- Feature branches off `dev` for specific pieces of work
- Pull request required to merge into `main` (tests must pass)

---

## 7. Test Suite

### Testing philosophy
The application is a single HTML file, but the JavaScript logic (sort, filter, parse, render) is testable in isolation. We extract the logic into testable functions within the same file, and the test suite imports them via a module wrapper.

### Test layers

#### Unit tests (fast, no network)
| Test file | What it covers |
|-----------|---------------|
| `sort.test.js` | Sort by each column, ascending/descending, stable sort, edge cases (nulls, ties) |
| `filter.test.js` | Text search, genre filter, year range, rating threshold, quality filter, combined filters |
| `api.test.js` | Parse Jellyfin API response into internal data model, handle missing fields, malformed data |
| `render.test.js` | Table HTML generation, row expansion, column header state, pagination |

#### Integration tests (needs Jellyfin API)
| Test | What it covers |
|------|---------------|
| Authentication | Login with valid/invalid credentials |
| Fetch library | Retrieve full movie list, verify field mapping |
| Playback URL | Construct valid playback URLs for different formats |

#### End-to-end tests (headless browser)
| Test | What it covers |
|------|---------------|
| Full page load | Open index.html, authenticate, render table |
| Sort interaction | Click column headers, verify row order changes |
| Filter interaction | Enter filter values, verify row count changes |
| Play button | Click play, verify correct URL is opened |
| Mobile viewport | Verify usability at 375px width |

### Test runner
- **Vitest** (fast, ESM-native, no config bloat) for unit + integration
- **Playwright** for E2E browser tests
- All tests runnable via `npm test`
- CI runs all tests on every push via GitHub Actions

---

## 8. Development Workflow

### Iterative cycle
```
  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
  │  DESIGN  │────►│  CODE    │────►│  TEST    │────►│  REVIEW  │
  │          │     │          │     │          │     │          │
  │ Discuss  │     │ Write /  │     │ Unit     │     │ Stanlee  │
  │ with     │     │ edit     │     │ Integ.   │     │ reviews  │
  │ Stanlee  │     │ src/     │     │ E2E      │     │ in       │
  │          │     │ index.   │     │ All must │     │ browser  │
  │          │     │ html     │     │ pass     │     │          │
  └──────────┘     └──────────┘     └────┬─────┘     └─────┬────┘
       ▲                                 │                  │
       │           ┌──────────┐          │ FAIL             │ APPROVED
       │           │  DEBUG   │◄─────────┘                  │
       │           │          │                    ┌────────▼────┐
       │           │ Fix code │                    │  DEPLOY     │
       │           │ Re-test  │                    │  Push to    │
       │           └──────────┘                    │  main       │
       │                                           └─────────────┘
       │                                                  │
       └──────────────────────────────────────────────────┘
                         NEXT ITERATION
```

### Development commands (from dev container)
```bash
# Start local dev server (hot reload)
npx serve src/ -p 3000

# Run all unit tests
npm test

# Run tests in watch mode (re-run on file change)
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run full test suite (unit + integration + e2e)
npm run test:all

# Deploy to production (copy to hosting location)
npm run deploy
```

### Commit conventions
```
feat: add genre dropdown filter
fix: handle movies with missing director field
test: add sort stability tests
docs: update API field mapping notes
chore: configure CI workflow
```

---

## 9. Phase Plan

### Phase 1: Foundation
- Set up Proxmox dev container
- Install git, Node.js, gh CLI
- Create GitHub repo with project structure
- Configure NAS backup
- Scaffold index.html with basic table layout
- Write mock data and first unit tests

### Phase 2: Core functionality
- Jellyfin API authentication
- Fetch and parse movie library
- Render sortable table
- Implement column sorting
- Unit tests for all sort logic

### Phase 3: Filtering
- Free-text search (searches title, director, cast)
- Genre dropdown filter
- Year range filter
- Rating threshold filter
- Resolution/quality filter
- Combined filter logic
- Unit tests for all filter logic

### Phase 4: Polish & Playback
- Click-to-expand row detail view
- Play button integration
- Mobile-responsive table
- localStorage for auth token
- E2E tests

### Phase 5: Evaluation (CURRENT — v0.1 shipped)
- ~~Stanlee uses it for real~~ — Initial feedback received
- Outcome: text-based approach confirmed as preferred, enhancement requested

### Phase 6: Thumbnail + Hover Card (NEW)
- Add thumbnail column (left of Title, height = font + 25%)
- Poster images from Jellyfin API
- Hover card: medium-sized, enlargeable
- Rotten Tomatoes score display (from CriticRating)
- AI-generated blurbs via Claude API
- Update tests for new features

### Phase 7: AI Synopsis Pipeline
- Set up Anthropic API key
- Build `scripts/generate-synopses.js` — Node.js script
- Define critic persona prompt (Lofoten Islands sci-fi critic, jazz lover)
- Generate blurbs for entire library
- Deploy synopses.json alongside index.html
- Schedule re-generation for new movies

### Phase 8: Virtual Scrolling + TV Shows Tab (NEW)
- Virtual scrolling — render only visible rows for 5K+ item performance
- Tabbed interface — Movies | TV Shows
- TV Shows tab with Series-level data (title, year, genre, seasons, episodes, status)
- Hover cards work on both tabs
- Updated tests for new features
- Designed to handle 5,000-20,000+ items smoothly

---

## 10. Resolved Questions

| Question | Resolution |
|----------|-----------|
| Proxmox location | `192.168.1.107:8006`, node AMAB, SSH key access confirmed |
| GitHub account | `Cascadealot`, gh CLI v2.86.0 installed and authenticated |
| Git | v2.51.0 installed on Stanlee's PC |
| Jellyfin API access | Confirmed working, admin account active, token-based auth tested |
| Hosting | nginx container on NAS, port 8080, live at `http://192.168.1.183:8080` |
| Authentication | Read-only API key embedded: `b62806a76e91466fa5964648d545a446` |
| Phased approach | Approved, now extended with Phases 6-8 |
| Blurb tone | Lofoten Islands sci-fi critic persona, jazz lover, dry Nordic wit |
| Thumbnail size | Font height + 25% in table; hover card medium with enlarge option |
| Claude API key | Pending — Stanlee to retrieve from Anthropic console |
| Library scale | ~5,000 movies + ~5,000 TV episodes, growing |
| Virtual scrolling | Approved — render only visible rows for performance |
| TV Shows | Two-tab design approved (Movies / TV Shows) |

---

## 11. Critic Persona (for AI Synopsis Generation)

> **Einar, the Lofoten Critic**
>
> A long-time, well-appreciated sci-fi aficionado who loves movies with
> minimal underlying music. A full-time film critic based in the Lofoten
> Islands, Norway, who loves jazz. Opinionated but fair, with a dry Nordic
> wit and a tendency to draw unexpected parallels between cinema and the
> Arctic landscape.
>
> Writes 2-4 sentence reviews that are knowledgeable, slightly irreverent,
> and warm but honest. If a movie has notable soundtrack qualities — minimal
> score, jazz elements, silence used effectively — he mentions it. He has
> a soft spot for practical effects, slow burns, and films that trust
> their audience.

---

*Document version: 1.3*
*Created: 2026-02-11*
*Updated: 2026-02-12 — Phase 8 defined: virtual scrolling + TV Shows tab*
*Author: Claude (AI Development Agent)*
*For review by: Stanlee (Project Owner)*
