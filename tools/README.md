# How this README is built

Everything on the profile is generated from one file, `content/profile.json`, plus the design
tokens. No third-party render services: every image is committed here or produced by this repo's
own GitHub Action.

```
content/profile.json ──┐
tools/src/tokens ──────┼─► tools/src/panels/*  ─► assets/panels/*.svg, assets/dividers/*.svg
                       ├─► tools/render3d      ─► assets/hero.webp, assets/hero-poster.png
README.template.md ────┴─► tools/src/readme    ─► README.md
GitHub API + Teardown ───► tools/src/dynamic   ─► output branch: activity.svg, scoreboard.svg, stamp.svg, state.json
```

## Commands

Node 22+ and pnpm. `pnpm install`, then:

| Command | What it does |
|---|---|
| `pnpm build` | tokens, logos, panels and README (everything except the hero) |
| `pnpm build:panels` | render every SVG panel and print its size against its budget |
| `pnpm build:readme` | fill `README.template.md` from the profile (tenure is computed, never hard-coded) |
| `pnpm render:hero` | record the Three.js hero frame by frame and encode GIF / WebP / APNG candidates (needs ffmpeg) |
| `pnpm render:hero --stills` | a few key frames for quick review |
| `pnpm dynamic --out .dynamic [--scoreboard]` | dry-run the daily telemetry |
| `pnpm check` | typecheck plus privacy, claims, SVG, text-size, size and accessibility lints |
| `pnpm lint:links` | resolve every external link in the README |
| `pnpm preview` | serve a GitHub-like rendering of the README (light and dark) |
| `pnpm qa` | screenshots at 375 / 768 / 880 px in both themes, plus panel contact sheets, into `.qa/` |

`BUILD_DATE=YYYY-MM-DD` pins the build date for reproducible output.

## Layout

```
tools/src/tokens     design tokens → /tokens.json
tools/src/svg        SvgDoc, outlined text (glyph atlas), panel chrome, glows, grids
tools/src/logos      Simple Icons access in one treatment, text chips for missing marks
tools/src/panels     one function per panel; build.ts writes them all
tools/src/readme     template filler
tools/src/dynamic    daily telemetry generator (activity, Teardown scoreboard, stamp, state)
tools/src/lint       quality gates and link check
tools/src/preview    GitHub-like preview and Playwright QA screenshots
tools/render3d       Three.js scene (reusable), deterministic recorder, encoders
```

## Things worth knowing

- **Outlined text.** SVGs loaded through `<img>` cannot fetch fonts, so each glyph becomes a path in
  `<defs>` once and is placed with `<use>`. See `tools/src/svg/text.ts`.
- **Motion fails safe.** The visible end state is each element's CSS default; keyframes only hide
  things while they animate. Reduced motion (and any renderer without CSS animation) shows the
  designed still frame.
- **The hero is deterministic.** `tools/render3d/scene.ts` exposes `window.renderFrame(t)`;
  the recorder steps it exactly in headless Chromium (software WebGL is fine) at 2× and downscales.
  `createGridScene()` takes a canvas and options, so the portfolio can mount the same scene live.
- **Claims are tracked.** Every number on the README must appear in `docs/CLAIMS.md` with a source,
  or `pnpm check` fails.
