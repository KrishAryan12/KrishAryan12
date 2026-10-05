# Research

Collected 2026-10-05 from the owner's private inputs (resume, LinkedIn export, owner.json, kept out
of git), the public portfolio, and the public GitHub repositories read at the code level.

## Facts

| Fact | Source | Confidence |
|---|---|---|
| Title: AI Engineer × Site Reliability Engineer (worded differently per source) | Resume, portfolio, LinkedIn | High (wording conflict below) |
| Tagline: "I automate the 3AM page out of existence." | Portfolio hero | High |
| Based in Bengaluru, India (IST) | Resume, portfolio, LinkedIn | High |
| Employer: Netradyne, from Feb 2025 | Resume, LinkedIn, portfolio | High |
| Role path: Cloud Intern (Feb 2025) → Associate SRE (Jul 2025) → Software Engineer - SRE (Feb 2026) | LinkedIn, portfolio handbook | High (resume differs) |
| Primary on-call owner for 215+ services | Resume, portfolio | High |
| 3 Sev-1/P0 incidents prevented | Resume, portfolio | High |
| TraceLens: triage ~2 h → ~15 s (480×), live on AWS EKS, 40+ tools, 12+ sources, 1,094 tests, native ReAct loop on Azure OpenAI GPT-4o, no frameworks | Resume, portfolio /work | High |
| LogAgent: 200k–30M lines/service/day, read-only bash, no ingestion or vector DB, two tools | Resume, portfolio /work | High |
| AlertFlow: alert storms → one triage queue | Resume, LinkedIn, portfolio | High; **service count conflicts** |
| Exception Clustering: in-house Sentry replacement, 215+ services | Resume, portfolio | High |
| Two papers: I-SMAC 2024 (IEEE Xplore), ACT 2024 (GRENZE, Scopus) | Resume, portfolio /research | High; both paper links resolve |
| B.E. AI & ML, New Horizon College of Engineering, 2021–2025, GPA 9.24/10 | Resume, portfolio, LinkedIn | High |
| 12 LinkedIn credentials (course certificates and badges) | owner.json, LinkedIn | High; 7 verify links checked |
| Teardown: live at teardown-lab.vercel.app, 65 rules + axe-core, Lighthouse CI ≥95 on itself | Teardown repo | High (read the README and code layout) |
| Stockroom: FastAPI/React/PostgreSQL, row locking, idempotency, audit logs, request-ID logging, PostgreSQL tests | Stockroom README + code | High (verified in code) |
| 103 public contributions in the last year | github.com contributions fragment, 2026-10-05 | High (below the 150 threshold for the 3D graph) |
| Portfolio scores in Teardown: overall 89 (perf 92, a11y 76, SEO 95, UX 99, brand 87, security 96) | One scan, 2026-10-05 | Measured |

## Voice notes

The owner's register is dry, specific and self-aware, never salesy:

- **Short negations, then the claim.** "Not demos. Not POCs. Running in production." / "Not a dashboard. Not a chatbot. An agent that actually investigates."
- **Numbers do the bragging.** 480×, 215 services, 3 Sev-1s. Adjectives are rare and usually ironic ("yes, I know. insufferable.").
- **The joke carries a fact.** "47 simultaneous alerts about the same thing isn't 47 problems. It's one problem and a terrible Tuesday." / "Then we cancelled our Sentry subscription. That felt good."
- **Self-deprecation about effort, never about results.** "Just the spec and stubbornness." / "Survived peer review, which is more than I can say for most of my code comments."
- **Plain contact etiquette.** "I read every message. The bar is just: don't open with 'hope this finds you well.'"
- Avoid: "passionate", "results-driven", emoji walls, skill bars, "currently learning".

The README reuses a handful of these lines sparingly (tagline, the production triplet, the
terrible Tuesday, the Sentry line, the contact bar, "Hire me – free") and writes new ones in the
same register ("What TraceLens does to an incident, done to me instead.", "0 humans paged. agent on it.").

## Older repositories (what the code proves)

| Repo | What the code actually does | Concerns |
|---|---|---|
| `stockroom` | Full-stack inventory and orders: FastAPI + SQLAlchemy + Alembic + PostgreSQL, React + Vite, JWT auth, Docker Compose. `services/orders.py` locks product rows with `with_for_update()`, honours an `Idempotency-Key` header backed by an `idempotency_records` table with a unique (user, key) constraint, writes audit logs; request-ID middleware and JSON logging; 11 pytest tests against real PostgreSQL. Live frontend and Swagger docs; Docker Hub image. | README wording ("assessment-compatible", "reviewer-ready") suggests a take-home. Demo credentials in its README are not repeated on the profile. No About description or topics. |
| `Real-Time-Facial-Recognition-Attendance-System` | One script, `AttendanceSystem.py`: loads reference photos from an `ImageAttendances` folder (not committed), encodes faces with `face_recognition`, matches webcam frames, draws boxes, appends each person's first sighting with a time to a CSV. | `attendance.csv` holds one row: the owner's own name and a time. Low risk, flagged for review. Linked as the paper's code. |
| `Privacy-Preserving-Border-Surveillance-System` | `main.py`: webcam loop, frame-difference motion gate, keeps the sharpest frame (Laplacian variance), YOLOv4-tiny detection via OpenCV DNN with NMS, every 100 frames sends the best frame to a hosted vision-language model (Qwen2-VL-2B via Hugging Face) for a caption, logs JSON to `processed_data.txt`. `yolov4tiny.py` is an unused wrapper class. | **A Hugging Face API token is hard-coded in `main.py`** (in history). `processed_data.txt` contains model-written descriptions of a person in a home. The code has no privacy-preserving step (no blurring, masking, on-device-only processing or encryption; frames are sent to a third-party API). The paper may describe more; the README describes only the code and does **not** link this repo. `requirements.txt` lists packages the code does not use. |
| `Market-Analysis-of-BTC-USDT` | One notebook: Keras LSTM predicting daily **max drawdown** from OHLCV columns of three BTC-USD CSVs, a threshold rule labelling days BUY/SELL, a simple profit calculation, Sharpe and Sortino ratios on an "estimated revenue" column, and VADER sentiment over scraped Google News headlines. | The repo description promises algorithmic trading strategies, backtesting and quantitative portfolio optimisation; the notebook is a coursework-scale LSTM experiment. Recommend rewriting the description or unpinning. |
| `Flavour-Navigator`, `Live-Captioning`, `AI-resume-finder` | Older college projects; not part of the brief's earlier-work strip. | Not shown. |

## Content gaps

- The headline work (TraceLens, LogAgent, AlertFlow, Exception Clustering) is private. The profile
  says so with a lock badge and links to the portfolio case studies. A small public mini-TraceLens
  would close the gap (placeholder card left hidden in the template).
- Freelance services, availability and rates are unconfirmed, so the builder lane shows proof
  (Teardown, the portfolio) and a contact button, but no service list or prices.
- No client work may be named yet (Castle & Nest Realty is `mayName: false`).
- The GitHub profile has no bio, location, website or pinned public proof (see the checklist).

## Contradictions found

1. **Headline wording.** Resume: "AI Engineer · Site Reliability Engineer". Portfolio: "SRE × AI Engineer". LinkedIn: "SRE @ Netradyne · building AI agents…". owner.json `titleLine`: "AI Engineer × Site Reliability Engineer" (used on the README).
2. **Role history.** Resume: a single title, "Software Engineer, Site Reliability Engineering & AI Tooling", from Feb 2025. LinkedIn and the portfolio handbook: Cloud Intern → Associate SRE → Software Engineer - SRE. The README uses the LinkedIn progression.
3. **AlertFlow scope.** Resume and portfolio /work: 185+ services. LinkedIn and handbook: 150+. Neither number is published.
4. **Climb speed.** Handbook heading says "Intern → SWE in 18 months"; its own dates (Feb 2025 → Feb 2026) give 12 months. The README computes 12.
5. **Portfolio `og:url`** points to `https://krisharyan.dev`, which does not resolve. The site lives at krisharyan.vercel.app.
6. **LinkedIn URL forms.** `linkedin.com/in/krisharyan/` (portfolio), `www.linkedin.com/in/krisharyan` (resume, LinkedIn PDF), and certification links carrying a `profileId` query string (portfolio handbook). The README uses `https://www.linkedin.com/in/krisharyan`; it returns 999 to scripts, as LinkedIn does for all bots, so it is allow-listed in the link check.
7. **Credential names and links.** Resume says "Claude 101"; the verified course is "Claude Code 101". The resume lists 7 of 12 credentials. owner.json's MCP Advanced verify URL ends in `450` (404); the working URL ends in `45o` (letter o), as the portfolio has it.
8. **Experience shown on the portfolio home** ("1.5 years") versus a computed tenure of 1 yr 9 mos at Netradyne (LinkedIn-style inclusive count) as of Oct 2026.
9. **Contact details.** The portfolio contact page publishes the owner's personal email and states "Actively looking". owner.json leaves availability null, so the README states no availability.
