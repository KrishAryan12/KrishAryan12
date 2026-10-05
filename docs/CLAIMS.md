# Claims register

Every factual claim on the profile README and in its panels, with its source. The claims lint
(`pnpm check`) fails if a significant number on the README is missing here, or if a claim id in
`content/profile.json` has no row.

Sources:

- **R**: the owner's resume (printed, private input; the public PDFs are linked from the README)
- **L**: the owner's LinkedIn profile (exported by the owner; LinkedIn itself blocks bots)
- **P**: the public portfolio, https://krisharyan.vercel.app (`/`, `/work`, `/research`, `/handbook`)
- **G**: public GitHub repositories, read at the code level on 2026-10-05
- **T**: the Teardown repository README and docs

| Id | Claim as published | Source | Notes |
|---|---|---|---|
| C01 | SRE × AI Engineer (title) | P, owner | The portfolio's wording, confirmed by the owner on 2026-10-06 as the canonical form. |
| C02 | "I automate the 3AM page out of existence." | P | Portfolio hero line, owner's tagline. 3AM is a time, not a metric. |
| C03 | 215+ services, primary on-call owner | R, P | Resume: "Primary on-call owner for 215+ AWS microservices". Portfolio: "215 services". |
| C04 | 480× faster incident triage, ~2 h → ~15 s, live on AWS EKS | R, P | Resume summary and TraceLens project; portfolio `/work`. |
| C05 | 3 Sev-1/P0 incidents prevented | R, P | Resume work experience; portfolio "Why Krish?". |
| C06 | 40+ agent tools across 12+ sources | R, P | Resume TraceLens project; portfolio `/work` (40+ tools, 12+ data sources). |
| C07 | 1,094 automated tests (TraceLens) | R | Resume TraceLens project. |
| C08 | Native ReAct loop, no agent frameworks | R, P, L | Resume ("no agent frameworks"), portfolio ("No LangChain. No magic."), LinkedIn ("Just the spec and stubbornness"). |
| C09 | TraceLens returns ranked, confidence-scored hypotheses with evidence, a Jira ticket and a Slack summary; investigates logs, metrics and alerts | R, L | Resume TraceLens project; LinkedIn summary. "Not a dashboard. Not a chatbot." is the owner's line (L). |
| C10 | Cloud Intern from Feb 2025; built AlertFlow | L, P | LinkedIn role history; portfolio handbook timeline. Resume shows a single title instead (conflict listed in OWNER_CHECKLIST). |
| C11 | Associate SRE from Jul 2025; built TraceLens | L, P | LinkedIn; handbook ("Got converted to Associate SRE. Built TraceLens."). |
| C12 | Software Engineer - SRE from Feb 2026; AI-tooling lead for the SRE org | L, P | LinkedIn ("Resident AI-tooling lead for the SRE org"); handbook. Intern → engineer = 12 months, computed at build time from the start months (Feb 2025 → Feb 2026). Tenure ("1 yr 9 mos") is computed at build time, never hard-coded. |
| C13 | Nebulixus research internship | L | **Not published.** The owner chose to leave it out (2026-10-06). |
| C14 | LogAgent: ReAct agent over 200k–30M log lines per service per day with read-only bash; no ingestion pipeline or vector database; 2 tools | R, P | Resume LogAgent project (two-tool design, run_bash and get_session_context); portfolio `/work`. |
| C15 | AlertFlow collapses alert storms into one triage queue; started on 150+ services, now covers 215+; "47 alerts … one problem and a terrible Tuesday" | R, L, P, owner | Resume, LinkedIn summary, portfolio `/work`. Scope confirmed by the owner on 2026-10-06 (150+ at launch, 215+ now), which resolves the 185+/150+ conflict between sources. |
| C16 | Exception Clustering: in-house Sentry replacement ranking exceptions across 215+ services; paid subscription cancelled | R, P | Resume; portfolio `/work` ("Then we cancelled our Sentry subscription.") and handbook. |
| C20 | Teardown: real browser, 65 rules plus axe-core, fix list an AI coding agent can execute; free, no account | T, G | Teardown README ("65 deterministic rules plus axe-core", "Free, private, no account"). |
| C21 | Stockroom: FastAPI, React, PostgreSQL; transactional orders with row locking, idempotent order creation, audit logs, request-ID JSON logging, PostgreSQL-backed tests; live demo; Docker image | G | Stockroom README, verified in code: `with_for_update()` in `backend/app/services/orders.py`, `Idempotency-Key` header and `idempotency_records` table, `middleware/request_id.py`, `core/logging.py`, `services/audit.py`, `tests/test_postgres_integration.py`. Live URLs checked 2026-10-05. Showcase permission pending (OWNER_CHECKLIST). |
| C22 | Teardown must pass its own audit at 95+ in every Lighthouse category; Next.js 16, React 19 | T | Teardown README, "Contributing" (Lighthouse CI, every category at 95 or higher) and stack line. |
| C23 | The portfolio has a "Hire me – free" button and terminal-flavoured design | P | Portfolio header and home page. |
| C30 | Privacy-Preserving Border Surveillance System, I-SMAC 2024, IEEE Xplore | R, P | Paper link https://ieeexplore.ieee.org/document/10714893 (from the portfolio). |
| C31 | Real-Time Biometric Facial Recognition Attendance System, ACT 2024, GRENZE, Scopus indexed | R, P | Paper link from the portfolio `/research`. |
| C32 | Facial recognition attendance code: OpenCV + face_recognition webcam loop, matches reference photos, logs first sighting per person to CSV | G | `AttendanceSystem.py` read in full. |
| C33 | Border-surveillance code: motion-gated webcam pipeline, sharpest frame, YOLOv4-tiny detection, hosted vision-model captions, JSON log | G | `main.py` read in full. The code contains no privacy-preserving step (no blurring, masking or encryption); the README does not claim one for the code. |
| C34 | BTC/USDT notebook: Keras LSTM predicting daily max drawdown from OHLCV, threshold rule with Sharpe/Sortino checks, VADER headline sentiment | G | `LSTM_BTC_Prediction.ipynb` read cell by cell. The repo description claims more (algorithmic trading, backtesting); the README describes only the notebook. |
| C35 | B.E. Artificial Intelligence & Machine Learning, New Horizon College of Engineering, 2021–2025, GPA 9.24/10; papers published before graduating | R, P, L | Resume education; portfolio `/research` ("Published. Peer-reviewed. Before I even graduated."). |

## Numbers that appear on the README

Each of these must trace to a row above: 480×, ~2 h, ~15 s, 215+, 3 Sev-1/P0, 40+, 12+, 1,094,
12 months (C12, computed), 1 yr 9 mos (C12, computed; the value changes monthly), 9.24/10 (C35),
65 rules (C20), 95+ (C22), 200k–30M (C14), 2 tools (C14), 47 alerts, 150+ (C15), 0.97 / 0.02 / 0.01
(hypothesis confidences in the investigation parody: a joke, not a metric), 16 and 19 (Next.js 16,
React 19, C22), 101 (Claude Code 101, a course title), 2024 (paper years), 4o (GPT-4o, a model name).

## Credentials

The credentials panel and table list the owner's 12 LinkedIn credentials (11 shown, 1 low-priority
listed as text). They are course certificates and badges, never described as "certified". Verify
links are used only where a public one exists and resolved on 2026-10-05:
Skilljar (3), LangChain Academy (1), DeepLearning.AI (1), Credly (2).
