# Owner checklist

Things only you can do or decide. Most urgent first. Nothing on this list is published until you
confirm it.

## 1. Do now (security)

- [ ] **Revoke the Hugging Face token in `Privacy-Preserving-Border-Surveillance-System/main.py`.**
  It is hard-coded on line 11 and stays in the repo's git history even if you delete the line.
  Revoke it at huggingface.co → Settings → Access Tokens, then replace it in the code with an
  environment variable. Rewriting history is optional once the token is dead.
- [ ] In the same repo, decide whether `processed_data.txt` should stay public: it contains
  AI-written descriptions of a person (probably you) at home. Until you decide, the profile links
  the paper but not this repo.

## 2. Before you approve the merge

- [ ] **Stockroom:** may it be shown publicly? Its README says "assessment-compatible" and
  "reviewer-ready", which reads like a take-home assignment. If it was one and the company would
  mind, say so and I will drop the card.
- [ ] **Look at the branch preview:** https://github.com/KrishAryan12/KrishAryan12/tree/redesign
  in light and dark mode, on desktop and on your phone. Please also open it in the **GitHub mobile
  app** (I could not test the app).
- [ ] Review `attendance.csv` in the facial-recognition repo: it holds one row with your name and a
  time. Fine to keep public if you are happy with it.
- [ ] Approve or edit the voice. Every line is in `README.template.md` (prose) and
  `content/profile.json` (facts).

## 3. Confirm or correct (left out until you do)

- [ ] **AlertFlow scope:** resume and portfolio say 185+ services; LinkedIn and the handbook say
  150+. Which is right (maybe 150+ at launch, 185+ now)? Tell me and I will add it.
- [ ] **Nebulixus** research internship (Jun–Jul 2024, LinkedIn only): show it on the timeline as a
  "before" entry?
- [ ] **Freelance services:** all three in owner.json are still "TO CONFIRM". List the services you
  want to sell, and whether to state availability or rates (currently none are shown).
- [ ] **Castle & Nest Realty:** may it be named as a client (`mayName` is false)?
- [ ] **Include private contributions** on your profile? (Settings → Public profile → Contributions
  & activity → "Include private contributions on my profile". It shows counts only, never repo
  names or code.) Your public count is 103 for the last year; private work would raise the graph,
  and the 3D graph switches itself on at 150.

## 4. Pick one canonical headline

Your title is worded three ways:

- Resume: "AI Engineer · Site Reliability Engineer"
- Portfolio: "SRE × AI Engineer"
- LinkedIn: "SRE @ Netradyne · building AI agents so PagerDuty doesn't wake me up at 3AM · …"

The README uses **"AI Engineer × Site Reliability Engineer"** (your `titleLine`). Pick one and I'll
use it everywhere; update the other two to match.

## 5. Resume fixes found while checking facts

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

## 6. Portfolio fixes

- [ ] `og:url` points to `https://krisharyan.dev`, which does not resolve. Point it at
  `https://krisharyan.vercel.app` (or buy the domain).
- [ ] The handbook says "Intern → SWE in 18 months", but its own dates (Feb 2025 → Feb 2026) make it
  12 months, which is the better story anyway.
- [ ] The home page says "1.5 years"; as of Oct 2026 it is 1 yr 9 mos (the README computes this
  automatically every month).
- [ ] The contact page shows your personal email address. Your call; the profile never shows it.
- [ ] Your own tool scored the portfolio **76 for accessibility** (overall 89). The weekly
  scoreboard on the profile will show it improve.

## 7. GitHub profile settings (2 minutes)

- [ ] **Bio** (under 160 characters). Pick one:
  1. `SRE × AI engineer. I build agents that investigate production incidents so nobody gets paged at 3AM.` (100)
  2. `Automating the 3AM page out of existence. AI agents for incident response, 215+ services on call, the odd website.` (114)
  3. `Technically an SRE. Realistically, I convince AI agents to do the detective work. Not demos. Running in production.` (115)
- [ ] **Location:** Bengaluru, India
- [ ] **Website:** https://krisharyan.vercel.app
- [ ] **Social:** LinkedIn → https://www.linkedin.com/in/krisharyan
- [ ] **Avatar:** no `inputs/photo.png` was provided, so no stylised avatar was made. Drop one in
  `inputs/` if you want one.

## 8. Pins and repo hygiene

- [ ] **Pin, in this order:** Teardown, stockroom, Real-Time-Facial-Recognition-Attendance-System,
  Privacy-Preserving-Border-Surveillance-System (after the token is revoked).
- [ ] **Unpin Market-Analysis-of-BTC-USDT**, or rewrite its description to match what the notebook
  does: "LSTM experiment predicting BTC daily max drawdown, with a simple threshold strategy,
  Sharpe/Sortino checks and headline sentiment." The current description promises algorithmic
  trading and backtesting the notebook does not have.
- [ ] Add About descriptions and topics:
  - **Teardown:** "Take any website apart: real-browser audit, prioritised fix list and an agent-ready brief." Topics: `website-audit`, `accessibility`, `seo`, `playwright`, `nextjs`, `ai-agents`. Website: https://teardown-lab.vercel.app
  - **stockroom:** "Inventory and order management: FastAPI, React, PostgreSQL, transactional orders with row locking and idempotency." Topics: `fastapi`, `react`, `postgresql`, `docker`, `sqlalchemy`. Website: https://stockroom-fv47.onrender.com/
  - **Privacy-Preserving-Border-Surveillance-System:** "Research code for the I-SMAC 2024 paper: motion-gated YOLOv4-tiny detection with vision-model frame captions." Topics: `computer-vision`, `yolov4`, `opencv`, `research`
- [ ] Optional (after the profile is approved): I can open pull requests with short, honest READMEs
  for the three repos that have none.

## 9. Recommended next build

- [ ] A small public **mini-TraceLens** repo: a ReAct agent investigating a synthetic incident
  (fake logs, metrics and alerts; no employer data). It would turn the private headline work into
  something a reviewer can run. A hidden placeholder card is already in the README template.

## 10. After merge (I can do these once you approve)

- [ ] Merge the PR, check the live profile in both themes and on a phone, tag `v1.0.0`.
- [ ] Run the "update-dynamic" workflow once by hand (Actions tab → update-dynamic → Run workflow)
  to confirm the daily job works from `main`.
