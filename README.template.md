<!--
  GENERATED FILE SOURCE. README.md is built from this template plus content/profile.json.
  Edit facts in content/profile.json, prose here, then run: pnpm build:readme
-->

<picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="assets/hero-poster.png">
  <img src="assets/hero.webp" width="100%" alt="{{name}}, {{titlePlain}}. {{tagline}}">
</picture>

<p align="center">
  <img src="assets/panels/boot.svg" width="100%" alt="Terminal boot sequence. {{bootAlt}}">
</p>

{{positioning}}

<p align="center">
  <a href="#the-investigation"><img src="assets/panels/lane-engineer.svg" width="400" alt="Lane one: Hire the engineer. AI agents and SRE. Jumps to the investigation."></a>
  <a href="#websites-with-a-point-of-view"><img src="assets/panels/lane-builder.svg" width="400" alt="Lane two: Hire the builder. Web design and development. Jumps to the websites section."></a>
</p>

{{divider}}

## Impact

<img src="assets/panels/impact.svg" width="100%" alt="Impact readouts: {{impactAlt}}">

<img src="assets/panels/timeline.svg" width="100%" alt="Career timeline: {{timelineAlt}}">

<details>
<summary>Impact and timeline as text</summary>

{{impactText}}

{{timelineText}}

</details>

## The investigation

What TraceLens does to an incident, done to me instead. Synthetic tool names, real numbers.

<img src="assets/panels/investigation.svg" width="100%" alt="An agent trace investigating Krish Aryan. It ends with ranked hypotheses: hire Krish, confidence 0.97.">

<details>
<summary>Read the trace as text</summary>

```text
{{investigationText}}
```

</details>

{{divider}}

## Systems shipped

The headline work runs in production at my employer, so the code is private. These cards say what each system does, and the case studies are on [the portfolio]({{links.portfolioWork}}).

<p align="center">
{{privateCards}}
</p>

Two public systems you can open right now:

<p align="center">
{{publicCards}}
</p>

<p align="center">
  <b>Teardown</b>: <a href="{{links.teardownLive}}">live</a> · <a href="{{links.teardownRepo}}">repo</a>
  &nbsp;|&nbsp;
  <b>Stockroom</b>: <a href="{{links.stockroomLive}}">live</a> · <a href="{{links.stockroomApiDocs}}">API docs</a> · <a href="{{links.stockroomRepo}}">repo</a> · <a href="{{links.stockroomDocker}}">Docker image</a>
</p>

<!--
  PLACEHOLDER (hidden until it exists): mini-TraceLens, a small public ReAct agent that investigates a
  synthetic incident. When the repo is public, add it to content/profile.json -> systems.public.
-->

## The Grid

<img src="assets/panels/stack.svg" width="100%" alt="The stack, grouped. {{stackAlt}}">

<details>
<summary>The stack as text</summary>

{{stackText}}

</details>

{{divider}}

## Websites with a point of view

{{freelancePitch}}

<p align="center">
{{websiteCards}}
</p>

<p align="center">
  <a href="{{links.portfolioContact}}"><img src="assets/panels/btn-conversation.svg" width="400" alt="Start a conversation"></a>
</p>

## Research and credentials

Two peer-reviewed papers, published before I graduated ({{education.degree}}, GPA {{education.gpa}}).

<p align="center">
{{paperCards}}
</p>

{{paperLinks}}

<img src="assets/panels/earlier-work.svg" width="100%" alt="Earlier work, mostly research and coursework. {{earlierAlt}}">

<details>
<summary>Earlier work as text</summary>

{{earlierText}}

</details>

<img src="assets/panels/credentials.svg" width="100%" alt="Credentials: courses and badges, grouped as Agents and LLMs, Data, and Cloud.">

<details>
<summary>Credentials, with verify links</summary>

{{credentialsTable}}

</details>

{{divider}}

## Live telemetry

Regenerated daily by a GitHub Action in this repo, from git history and the GitHub API. No third-party cards, no counters, no tracking.

{{#if stats}}
<img src="{{dynamicBase}}/stats.svg" width="100%" alt="By the numbers: contributions in the last year, public commits and repos, code lines added and deleted, and code by language. Counted from git history; data files, lockfiles, notebooks and generated files are excluded.">
{{/if}}

<img src="{{dynamicBase}}/activity.svg" width="100%" alt="Recent public activity on GitHub, regenerated daily.">

{{#if scoreboard}}
<img src="{{dynamicBase}}/scoreboard.svg" width="100%" alt="My portfolio, audited weekly by my own tool, Teardown.">
{{/if}}

{{#if contribGraph}}
<img src="{{dynamicBase}}/contrib-3d.svg" width="100%" alt="Contribution graph in 3D for the last year.">
{{/if}}

{{divider}}

## Uplink

<p align="center">
  <a href="{{links.portfolio}}"><img src="assets/panels/btn-portfolio.svg" width="260" alt="Portfolio"></a>
  <a href="{{links.linkedin}}"><img src="assets/panels/btn-linkedin.svg" width="260" alt="LinkedIn"></a>
  <a href="{{links.portfolioContact}}"><img src="assets/panels/btn-hire.svg" width="260" alt="Hire me – free"></a>
  <a href="{{links.resumeAI}}"><img src="assets/panels/btn-resume-ai.svg" width="260" alt="Résumé, AI Engineer (PDF)"></a>
  <a href="{{links.resumeSRE}}"><img src="assets/panels/btn-resume-sre.svg" width="260" alt="Résumé, SRE (PDF)"></a>
</p>

I read every message. The bar is just: don't open with "hope this finds you well."

{{divider}}

<p align="center">
  <b>End of line.</b><br>
  <sub><img src="{{dynamicBase}}/stamp.svg" height="20" alt="Last regenerated date"></sub><br>
  <sub>Every panel here is generated from one JSON file and committed. <a href="tools/">How this README is built</a>.</sub><br>
  <sub>Inspired by a film I watch too often. Not affiliated with it.</sub>
</p>
