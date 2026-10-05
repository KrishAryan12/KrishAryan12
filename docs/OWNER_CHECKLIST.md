# Owner checklist

Things only you can do or decide. Most urgent first. Nothing on this list is published until you
confirm it.

## Decided on 2026-10-06 (applied)

- [x] Hugging Face token in the border-surveillance repo: already revoked by the owner. No change needed.
- [x] Stockroom: it was a take-home assignment; the owner is fine showing it. It stays as a live card.
- [x] AlertFlow: started on 150+ services, now covers 215+. On the card.
- [x] Nebulixus internship: left out.
- [x] Freelance client projects and services: on hold. The builder lane shows only the owner's own sites (Teardown, the portfolio). Castle & Nest Realty stays unnamed.
- [x] Canonical title: **SRE × AI Engineer** (hero, boot strip and README).
- [x] GitHub bio: option 3 (below).

## 1. Before you approve the merge

- [ ] **Look at the branch preview:** https://github.com/KrishAryan12/KrishAryan12/tree/redesign
  in light and dark mode, on desktop and on your phone. Please also open it in the **GitHub mobile
  app** (I could not test the app).
- [ ] The border-surveillance repo still holds `processed_data.txt` (AI-written descriptions of a
  person). Until you say otherwise, the profile links the paper but not that repo's code.
- [ ] Approve or edit the voice. Every line is in `README.template.md` (prose) and
  `content/profile.json` (facts).

## 2. Settings only you can change

- [ ] **Include private contributions** (you said yes): Settings → Public profile → Contributions &
  activity → tick "Include private contributions on my profile". It shows counts only, never repo
  names or code. The daily Action reads the count through the GitHub API, so the "contributions,
  last year" figure in the stats panel rises the next morning. If it reaches 150, the 3D
  contribution graph switches itself on.
- [ ] **Bio** (your pick, 115 characters): `Technically an SRE. Realistically, I convince AI agents to do the detective work. Not demos. Running in production.`
- [ ] **Location:** Bengaluru, India · **Website:** https://krisharyan.vercel.app · **Social:** https://www.linkedin.com/in/krisharyan

## 3. Headline everywhere

The README now uses **SRE × AI Engineer**, which matches the portfolio. Update the resume
("AI Engineer · Site Reliability Engineer") and LinkedIn to match when convenient.

## 4. Resume fixes found while checking facts

- [ ] **Role history:** the resume shows one title from Feb 2025; LinkedIn shows Cloud Intern →
  Associate SRE → Software Engineer - SRE. The README uses LinkedIn's (a promotion story is a
  strength). Update the resume to match.
- [ ] "Claude 101" should be **Claude Code 101** (that is the verified Skilljar course).
- [ ] The resume lists 7 of your 12 credentials. The most relevant missing ones: AWS *Integrating
  Amazon Bedrock powered Agents with MCP Servers using the Strands Agents SDK*, DeepLearning.AI
  *Knowledge Graphs for AI Agent: API Discovery*, AWS *Operationalize Generative AI Applications
  (FMOps/LLMOps)*, and *LangChain Essentials (Python)*.
- [ ] Use the Skilljar verify links for the Anthropic courses instead of LinkedIn links (those carry
  a `profileId` tracking parameter).
- [ ] Fix `owner.json`: the MCP Advanced verify URL ends in `450` (404). The working one ends in
  `45o` (letter o): https://verify.skilljar.com/c/4aphiibon45o
- [ ] The resume PDFs linked from the README are served by your portfolio. Check they show only
  what you want public (they may include your phone or email).

## 5. Portfolio fixes

- [ ] `og:url` points to `https://krisharyan.dev`, which does not resolve. Point it at
  `https://krisharyan.vercel.app` (or buy the domain).
- [ ] The handbook says "Intern → SWE in 18 months", but its own dates (Feb 2025 → Feb 2026) make it
  12 months, which is the better story anyway.
- [ ] The home page says "1.5 years"; as of Oct 2026 it is 1 yr 9 mos (the README computes this
  automatically every month).
- [ ] The contact page shows your personal email address. Your call; the profile never shows it.
- [ ] Your own tool scored the portfolio **76 for accessibility** (overall 89). The weekly
  scoreboard on the profile will show it improve.

## 6. Avatar

- [ ] No `inputs/photo.png` was provided, so no stylised avatar was made. Drop one in `inputs/` if you want one.

## 7. Pins and repo hygiene

- [ ] **Pin, in this order:** Teardown, stockroom, Real-Time-Facial-Recognition-Attendance-System,
  Privacy-Preserving-Border-Surveillance-System.
- [ ] **Unpin Market-Analysis-of-BTC-USDT**, or rewrite its description to match what the notebook
  does: "LSTM experiment predicting BTC daily max drawdown, with a simple threshold strategy,
  Sharpe/Sortino checks and headline sentiment." The current description promises algorithmic
  trading and backtesting the notebook does not have.
- [ ] Add About descriptions and topics:
  - **Teardown:** "Take any website apart: real-browser audit, prioritised fix list and an agent-ready brief." Topics: `website-audit`, `accessibility`, `seo`, `playwright`, `nextjs`, `ai-agents`. Website: https://teardown-lab.vercel.app
  - **stockroom:** "Inventory and order management: FastAPI, React, PostgreSQL, transactional orders with row locking and idempotency." Topics: `fastapi`, `react`, `postgresql`, `docker`, `sqlalchemy`. Website: https://stockroom-fv47.onrender.com/
  - **Privacy-Preserving-Border-Surveillance-System:** "Research code for the I-SMAC 2024 paper: motion-gated YOLOv4-tiny detection with vision-model frame captions." Topics: `computer-vision`, `yolov4`, `opencv`, `research`
  - You said you have already updated these repos; I'll re-read them and adjust the earlier-work descriptions if needed.
- [ ] Optional (after the profile is approved): I can open pull requests with short, honest READMEs
  for the three repos that have none.

## 8. Recommended next build

- [ ] A small public **mini-TraceLens** repo: a ReAct agent investigating a synthetic incident
  (fake logs, metrics and alerts; no employer data). It would turn the private headline work into
  something a reviewer can run. A hidden placeholder card is already in the README template.

## 9. After merge (I can do these once you approve)

- [ ] Merge the PR, check the live profile in both themes and on a phone, tag `v1.0.0`.
- [ ] Run the "update-dynamic" workflow once by hand (Actions tab → update-dynamic → Run workflow)
  to confirm the daily job works from `main`.
