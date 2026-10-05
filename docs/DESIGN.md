# Design: "The Grid, but it's production"

The neon grid is production infrastructure. Cyan is healthy (and the owner's colour). Orange is an
incident, used only where something is wrong, urgent or being resolved. The hero tells the story
once: an orange incident streaks across the grid, a cyan agent cuts it off, both dissolve, and the
title powers on. Everything after the hero is calmer.

## Tokens

Source: `tools/src/tokens/tokens.ts`, exported to `/tokens.json` for the portfolio redesign.

| Token | Value | Use | Contrast on `panel` |
|---|---|---|---|
| `void` | `#04070D` | hero and terminal backgrounds | — |
| `panel` | `#08121C` | card background | — |
| `panelRaised` | `#0C1A27` | isometric tile tops | — |
| `grid` | `rgba(102,246,255,0.10)` | grid lines | decorative |
| `cyan` | `#66F6FF` | primary, healthy, numbers | 14.5:1 |
| `cyanMid` | `#18C8E0` | borders, secondary accents | 9.3:1 |
| `cyanDeep` | `#0B5D6B` | tile sides, inactive bars | decorative |
| `orange` | `#FF7A18` | incident only | 7.2:1 |
| `orangeHot` | `#FF4D00` | reserved | 5.7:1 |
| `white` | `#E8FAFF` | primary text | 17.6:1 |
| `dim` | `#7FA6B5` | secondary text | 7.2:1 |

The brief's starting palette passed AA unchanged, so it was kept. Two tokens were added
(`panelRaised`, `cyanDeep`) for isometric depth; neither carries text.

## Type

- **Display:** Oxanium 500/700 (OFL). Chosen over Orbitron on judgement, not a side-by-side render:
  Orbitron's extended letterforms fit fewer characters per line at the 24-unit floor, and Oxanium
  renders legibly at that size in the QA screenshots while still reading as "techno".
- **Terminal and data:** JetBrains Mono 400/700 (OFL).
- All SVG text is outlined: each glyph becomes a `<path>` in `<defs>` once and is placed with
  `<use>`, so no font loads and a 600-character terminal costs about 15 KB. The same glyph source
  feeds the extruded 3D title in the hero.

## Motifs

- **Light trails:** hero cycles and walls; the 800×28 divider (one trail sweep, an orange pulse near
  the end that is resolved into a cyan ring).
- **Isometric tiles:** stack items sit on rhombus tiles lit from the top-left.
- **Terminal panels:** boot strip and the investigation.
- **Chrome:** 1.5-unit cyan border at 55% opacity, inner hairline, 10-unit radius, corner ticks,
  small `// LABEL` in dim mono. Every card shares it.

## Sizing and mobile

- Full-width panels use an 800-unit viewBox at `width="100%"`. Text a reader needs is at least
  24 units (11 px on a 375 px screen). Cards and lanes use a 400-unit viewBox at `width="400"`,
  which caps their display size, so their floor is 12 units.
- Cards are inline images of fixed width: two per row when the column is at least ~810 px, one per
  row on phones (GitHub caps images at `max-width:100%`, so they shrink and stack).
- Enforced by the text lint, which reads every outlined text run's scale. Decorative micro-text
  (panel labels, chip glyphs inside logo stand-ins) is marked `deco` and repeated in the text
  equivalents.

## README wireframes

Desktop (column ~830–880 px):

```
┌──────────────────────────────────────────────┐
│ HERO 1200×440 (WebP)  KRISH ARYAN            │
│ AI ENGINEER × SITE RELIABILITY ENGINEER      │
├──────────────────────────────────────────────┤
│ > whoami / uptime / cat motto / pagerduty    │  boot strip (800×~290)
└──────────────────────────────────────────────┘
 Two sentences of positioning (Markdown)
┌─────────────────────┐ ┌─────────────────────┐
│ Hire the engineer → │ │ Hire the builder →  │  lanes (400×280 each)
└─────────────────────┘ └─────────────────────┘
 ─────────── divider ───────────
## Impact       [480× | 215+ | 3 | 40+ | 1,094]  [timeline]   <details>
## The investigation   [terminal trace]                        <details>
## Systems shipped     [TraceLens][LogAgent] [AlertFlow][Exception]
                       [Teardown ●][Stockroom ●]  + links line
## The Grid            [3×2 groups of tiles]                   <details>
 ─────────── divider ───────────
## Websites with a point of view   pitch, [Teardown][Portfolio], [Start a conversation]
## Research and credentials  [IEEE][Scopus], links, [earlier work], [credentials] <details>
 ─────────── divider ───────────
## Live telemetry   [activity] [scoreboard] ([3D graph] only ≥150 contributions)
## Uplink   [Portfolio][LinkedIn][Hire me – free][Résumé AI][Résumé SRE]
 End of line. · last regenerated · how it's built · inspired-by note
```

Mobile (~343–420 px): the same order; every two-up row stacks to one card per row; full-width
panels scale down with text staying at or above 11 px.

## Panel inventory

| File | ViewBox | Display | Budget | Motion (loop) | Still frame |
|---|---|---|---|---|---|
| `hero.webp` | 1200×440 | 100% | 3.5 MB | 8 s story | `hero-poster.png` |
| `panels/boot.svg` | 800×~290 | 100% | 60 KB | lines type in, cursor (12 s) | all lines shown |
| `panels/lane-*.svg` | 400×280 | 400 | 30 KB | one trace / frame pulse (10 s) | static motif |
| `panels/impact.svg` | 800×258 | 100% | 40 KB | one-time reveal | all readouts |
| `panels/timeline.svg` | 800×340 | 100% | 40 KB | pulse along the line (10 s) | line without pulse |
| `panels/investigation.svg` | 800×~880 | 100% | 80 KB | trace prints, bars fill, chip orange→cyan (16 s) | full trace, RESOLVED |
| `panels/system-*.svg` (6) | 400×300 | 400 | 30 KB | live dot pulse (3 s) on public cards | dot on |
| `panels/stack.svg` | 800×~740 | 100% | 100 KB | none | — |
| `panels/web-*.svg` (2) | 400×300 | 400 | 30 KB | live dot pulse (3 s) | dot on |
| `panels/paper-*.svg` (2) | 400×270 | 400 | 25 KB | none | — |
| `panels/earlier-work.svg` | 800×~560 | 100% | 50 KB | none | — |
| `panels/credentials.svg` | 800×~650 | 100% | 60 KB | none | — |
| `panels/btn-*.svg` (6) | 260/400×64 | 260/400 | 12 KB | none | — |
| `dividers/divider.svg` | 800×28 | 100% | 15 KB | trail + resolved pulse (12 s) | resolved ring |
| `output/activity.svg` | 800×var | 100% | 60 KB | none | — |
| `output/scoreboard.svg` | 800×330 | 100% | 40 KB | none | — |

## Motion rules

- Loops 8–16 s, seamless; nothing flashes more than three times a second; glow pulses ≥ 3 s;
  cursor blink is 1 Hz. Only `transform`, `opacity` and `stroke-dashoffset` animate; no filter is
  ever animated.
- At most three moving things per panel. Static panels: stack, papers, earlier work, credentials,
  buttons, telemetry.
- **The visible end state is the CSS default.** Keyframes hide elements only while they animate, so
  `prefers-reduced-motion: reduce` (which sets `animation: none`) and any renderer without CSS
  animation both show the designed still frame.
- Orange appears in exactly four places: the hero incident cycle, the investigation's
  INVESTIGATING chip (which resolves to cyan), the divider's incident pulse (resolved to cyan), and
  any scoreboard value below 50 (labelled "fix me"). Colour never carries meaning alone: each use
  pairs with a label or a shape change.

## Critique against the brief (and what changed)

- *Stack legibility:* a 6-across tile grid could not fit 24-unit labels. Changed to six groups in a
  3×2 layout, five items each, labels beside the tiles.
- *Headline tools in orange (brief 9.4) vs orange only for incidents (brief 7.1):* kept orange for
  incidents. Headline tools get a brighter tile, a heavier label and a bright icon instead.
- *Hero size:* the camera dolly multiplied file size (every grid pixel changes every frame). The
  recorded hero uses a locked camera; the dolly remains a scene option for live use.
- *Lanes on phones:* a two-cell table never stacks on GitHub. Fixed-width inline images do.
