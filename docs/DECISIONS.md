# Decisions

Each entry: decision, reason, alternative considered. Verified facts carry the date they were checked.

## Process

| Decision | Reason | Alternative |
|---|---|---|
| Work on `redesign`; `main` holds only LICENSE and .gitignore until the owner approves | The brief forbids pushing the redesign to `main` before approval; the owner's instructions also asked for `main` to be pushed, and an empty `main` is the PR base without changing the live profile | Push everything to `main` (would publish unapproved work) |
| P1 and P4 check-ins batched into the final review | The owner asked for the brief to be implemented in one go ("finish it up"); the P9 gate (no merge without approval) is kept | Stop after DESIGN.md and after the hero |
| Commits use the GitHub noreply address | The machine's global git identity is the owner's personal email, which the privacy rules forbid in history | Global identity (would leak the address) |
| `content/profile.json` is curated by hand from the private inputs and committed | `inputs/` is gitignored, so CI cannot regenerate from it; one committed file is the source of truth for CI and the Action | A sync script reading `inputs/` (works only on the owner's machine) |
| Canonical title: "AI Engineer × Site Reliability Engineer" | It is `owner.json -> titleLine`, the owner's own choice; reported in the checklist | Resume or portfolio wording |
| Role history from LinkedIn (Cloud Intern → Associate SRE → Software Engineer - SRE) | The brief says so; it is the public, checkable record | Resume's single title |
| AlertFlow service count, Nebulixus, freelance services, availability, rates: omitted | Unconfirmed or conflicting (brief rule 3) | Publish one of the conflicting numbers |
| Stockroom shown as a live system | The brief asks for it and owner.json marks it `mayName: true`; showcase permission is the first checklist item to confirm before merge | Hide until confirmed |
| Border-surveillance repo not linked; facial-recognition repo linked | The former has a committed API token and logged descriptions of a person; the latter's CSV holds only the owner's own name | Link both |

## Design

| Decision | Reason | Alternative |
|---|---|---|
| Brief palette kept unchanged; added `panelRaised` and `cyanDeep` (no text on either) | Every text token already passes AA on every background (7.2:1 or better) | Brighten `dim` |
| Oxanium over Orbitron (judgement, not a side-by-side render) | Narrower letterforms fit more characters at the 24-unit floor | Orbitron |
| Text outlined via a per-document glyph atlas (`<defs>` + `<use>`) | No font loading in `<img>` SVGs; ~15 KB for a 600-character terminal instead of ~250 KB fully expanded | Embedded subsetted WOFF2 data URI |
| Visible end state is the CSS default; keyframes only hide during animation | Reduced motion and any renderer without CSS animation show the designed still frame. Found in QA: the first version hid elements by default and rendered blank stills | Hidden by default, revealed by animation |
| No orange for headline tools (brief 9.4) | Brief 7.1 reserves orange for incidents; headline tools get brighter tiles and heavier labels instead | Orange tiles |
| Lanes and cards are fixed-width (400) inline images, not a table | Tables never stack on GitHub; inline images wrap, and GitHub's `max-width:100%` scales them on phones | Two-cell table |
| Stack: 3×2 groups, 5 items each | A 6-across grid could not fit 24-unit labels; also keeps it from becoming a logo dump | Single grid |
| Dividers use `alt=""` | Purely decorative; announcing "divider" four times helps nobody. The a11y lint allows empty alt only for dividers | Non-empty alt everywhere |
| Overflowing card copy fails the build | Found on real GitHub: the TraceLens card was cut mid-sentence. Now copy must be edited, never truncated | Truncate silently |

## Hero format shoot-out (2026-10-05)

Rendered with Three.js in headless Chromium (SwiftShader WebGL), 160 frames at 2400×880, 20 fps,
8 s loop, downscaled with Lanczos to 1200×440.

| Candidate | Moving camera | Locked camera | Verdict |
|---|---|---|---|
| GIF, 256 colours, sierra2_4a | 16.04 MB | 7.85 MB | Over budget |
| GIF, 12 fps, 960 px, 128 colours, bayer | n/a | 3.12 MB | Fits, but visible banding in the glows and choppy motion |
| Animated WebP q80 | 3.78 MB | 1.99 MB | Faint vertical streaks in the title glow |
| **Animated WebP q88** | n/a | **2.63 MB** | **Shipped.** Smooth glows, under the 3.5 MB budget |
| Animated WebP q92 | n/a | 3.53 MB | At the budget limit for no visible gain |
| APNG (lossless) | 37.99 MB | 19.51 MB | Far over |
| Poster PNG (title frame) | | 0.31 MB | Reduced-motion source and fallback |

- **Camera locked for the recording.** A dolly changes every grid pixel every frame and doubled every
  candidate's size. `createGridScene({ cameraDrift: 1 })` turns it back on for live use on the portfolio.
- **The loop starts on the lit title** (phase 5.6 s), so the first frame, which a slow connection
  shows first, is the name rather than an empty grid. The seam was checked frame by frame.
- **Bloom tuned down** (strength 0.6, threshold 0.55) after the first render blew the frame out to white.
- **Clear colour pre-linearised.** The composer's render target re-encoded the clear colour, lifting
  `void` to a grey-blue; passing it through `convertSRGBToLinear()` lands exactly on the token.
- **Title glyphs passed one path per glyph.** A single combined path made SVGLoader's hole detection
  span letters (triangles across "H ARY"). Also opentype.js 2.0's `toPathData()` emitted `MNaN` for
  some glyphs, so the recorder serialises commands itself.
- gifsicle was not available; FFmpeg's palettegen/paletteuse did the GIF optimisation.

## Real-GitHub test (2026-10-05, branch `redesign`, logged-out github.com via Playwright Chromium)

The Claude-in-Chrome extension was not connected, so headless Chromium loaded the live branch page
in four configurations: desktop 1280 px dark, desktop light, mobile 390 px dark, mobile light with
reduced motion.

| Check | Result |
|---|---|
| All images load | ✓ 32/32 in every configuration, none broken |
| Relative paths resolve | ✓ rewritten by GitHub to `/KrishAryan12/KrishAryan12/raw/redesign/assets/...` |
| `<picture>` kept by the sanitiser | ✓ |
| `prefers-reduced-motion` source switches the hero | ✓ mobile-reduced loads `hero-poster.png`; others load `hero.webp` |
| Animated WebP plays | ✓ (Chromium); Safari 14+ and Firefox support animated WebP |
| `<details>` blocks kept | ✓ 5/5 |
| Lane anchors (`#the-investigation`, `#websites-with-a-point-of-view`) | ✓ GitHub generates `user-content-` ids for both |
| Card widths | ✓ 400 px two-up on desktop (838 px column), scaled to 324 px and stacked on mobile |
| Both themes | ✓ every panel is a self-contained dark card and looks identical on light and dark |
| Inline `style`, `<style>` | not used anywhere |

**Measured, not assumed:** GitHub's mobile README column is 324 px on a 390 px viewport (about
309 px at 375 px). At that width the brief's 24-unit floor renders at about 9.7 px, not 11 px. The
panels follow the brief's own definition (24 units on an 800 viewBox); every information panel
also has a text equivalent. If phone legibility needs to go further, raise
`tokens.type.minReadableUnits` and re-flow the terminal panels to fewer characters per line.

Still to check by the owner: the GitHub mobile app (it uses the same HTML; Playwright cannot run it)
and the **profile page** after merge (the profile renders from `main`, so it cannot be previewed
before approval; the repo page uses the same renderer and sanitiser).

## Dynamic content

| Decision | Reason | Alternative |
|---|---|---|
| Activity from recently pushed public repos and their latest commit, plus events | The public events API returned a single event for the account (2026-10-05) and no longer includes commit messages for pushes | Events only (empty panel) |
| Activity limited to the last 12 months | Telemetry, not an archive; 2024 uploads padded the list | Show everything |
| 3D contribution graph `auto` → off | 103 public contributions in the last year (2026-10-05) is under the 150 threshold; the Action turns it on automatically if the count rises | Always on |
| Scoreboard: weekly Teardown scan, last scores stored in `state.json` | One scan a week respects the free tier; storing scores lets design changes re-render without spending a scan. Verified 2026-10-05: `POST /api/scan/stream` returned a report (overall 89) | Daily scans |
| Generated files on an `output` branch, force-pushed as one commit | Keeps `main` history clean and the output branch tiny | Commit to `main` daily |
| The Action commits to `main` only when the README or panels change | Tenure is month-based ("1 yr 9 mos"), so `main` gets one small commit a month | Never update tenure (stale) or hard-code it (forbidden) |
| Two jobs: read-only `generate`, write-only `publish` | Least privilege: GitHub permissions are per job, so the writing job does nothing but push generated files | One job with `contents: write` |
| Actions pinned to commit SHAs (checked 2026-10-05) | checkout v7.0.1 `3d3c42e`, setup-node v7.0.0 `8207627`, pnpm/action-setup v6.1.0 `ea17c68`, upload-artifact v7.0.1 `043fb46`, download-artifact v8.0.1 `3e5f45b`, github-profile-3d-contrib v0.9.3 `7d95e7d` | Tags |

## Verified links (2026-10-05)

All README links resolve except allow-listed hosts that block scripts: LinkedIn (999), IEEE Xplore
(202, page loads in browsers), the Stockroom API on Render (cold-start timeout; the frontend
returned 200). The owner.json MCP Advanced verify URL (`…450`) returns 404; `…45o` returns 200 and is used.
