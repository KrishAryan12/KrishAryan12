"""Draw the README telemetry panel (dark and light) from the GitHub GraphQL API.

Usage: GITHUB_TOKEN=... python scripts/stats.py <login> <out_dir>
       python scripts/stats.py --sample <out_dir>     # render with made-up data, for layout work
Standard library only, so the workflow needs no install step.
"""
import datetime as dt
import json
import os
import random
import sys
import urllib.request

MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
THEME = {
    "dark": dict(bg="#0B1220", ink="#E6EEF8", mute="#8FA3BF", empty="#16233A", cyan="#6FE7FF", org="#FF8A3D", edge="#6FE7FF2E"),
    "light": dict(bg="#FFFFFF", ink="#0B1220", mute="#4A5B73", empty="#E8EEF4", cyan="#0A9CC4", org="#F2762B", edge="#0B12201F"),
}
SKIP_LANGS = {"Jupyter Notebook"}  # notebooks store outputs, so their byte counts drown everything else

QUERY = """
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      restrictedContributionsCount
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }
    repositories(ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, first: 100) {
      totalCount
      nodes { stargazerCount languages(first: 10, orderBy: {field: SIZE, direction: DESC}) { edges { size node { name color } } } }
    }
  }
}"""


def fetch(login, token):
    req = urllib.request.Request(
        "https://api.github.com/graphql",
        data=json.dumps({"query": QUERY, "variables": {"login": login}}).encode(),
        headers={"Authorization": f"bearer {token}", "User-Agent": "krisharyan12-stats"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        body = json.load(r)
    if "errors" in body:
        raise SystemExit(f"GraphQL error: {body['errors']}")
    return body["data"]["user"]


def sample():
    random.seed(4)
    start = dt.date.today() - dt.timedelta(days=364)
    start -= dt.timedelta(days=(start.weekday() + 1) % 7)
    weeks, d = [], start
    while d <= dt.date.today():
        week = []
        for _ in range(7):
            if d <= dt.date.today():
                week.append({"date": d.isoformat(), "contributionCount": random.choice([0, 0, 0, 1, 2, 3, 5, 8, 13])})
            d += dt.timedelta(days=1)
        weeks.append({"contributionDays": week})
    total = sum(x["contributionCount"] for w in weeks for x in w["contributionDays"])
    langs = [("Python", "#3572A5", 900), ("TypeScript", "#3178c6", 520), ("JavaScript", "#f1e05a", 140), ("CSS", "#563d7c", 60), ("Shell", "#89e051", 20)]
    return {
        "contributionsCollection": {"totalCommitContributions": 612, "totalPullRequestContributions": 41, "restrictedContributionsCount": 0,
                                    "contributionCalendar": {"totalContributions": total, "weeks": weeks}},
        "repositories": {"totalCount": 9, "nodes": [{"stargazerCount": 3, "languages": {"edges": [{"size": s, "node": {"name": n, "color": c}} for n, c, s in langs]}}]},
    }


def summarise(user):
    cc = user["contributionsCollection"]
    days = [d for w in cc["contributionCalendar"]["weeks"] for d in w["contributionDays"]]
    longest = run = 0
    for d in days:
        run = run + 1 if d["contributionCount"] else 0
        longest = max(longest, run)
    current = 0
    for i, d in enumerate(reversed(days)):
        if d["contributionCount"]:
            current += 1
        elif i == 0:
            continue  # today may simply not have happened yet
        else:
            break
    sizes, colors = {}, {}
    for repo in user["repositories"]["nodes"]:
        for e in repo["languages"]["edges"]:
            name = e["node"]["name"]
            if name in SKIP_LANGS:
                continue
            sizes[name] = sizes.get(name, 0) + e["size"]
            colors[name] = e["node"]["color"] or "#8FA3BF"
    total = sum(sizes.values()) or 1
    top = sorted(sizes.items(), key=lambda kv: -kv[1])[:5]
    return {
        "weeks": cc["contributionCalendar"]["weeks"],
        "contributions": cc["contributionCalendar"]["totalContributions"],
        "commits": cc["totalCommitContributions"] + cc["restrictedContributionsCount"],
        "prs": cc["totalPullRequestContributions"],
        "repos": user["repositories"]["totalCount"],
        "stars": sum(r["stargazerCount"] for r in user["repositories"]["nodes"]),
        "current": current,
        "longest": longest,
        "langs": [(n, colors[n], s / total) for n, s in top],
    }


def render(s, t, stamp):
    c = THEME[t]
    W, H = 1200, 316
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="t">',
         f'<title id="t">GitHub activity, last 365 days: {s["contributions"]} contributions, {s["commits"]} commits, {s["prs"]} pull requests, '
         f'{s["repos"]} public repositories, longest streak {s["longest"]} days. Updated {stamp}.</title>',
         f'<rect x=".5" y=".5" width="{W-1}" height="{H-1}" rx="14" fill="{c["bg"]}" stroke="{c["edge"]}"/>',
         f'<g font-family="{MONO}" font-size="12" letter-spacing="2.5" fill="{c["mute"]}">'
         f'<text x="34" y="44">TELEMETRY · LAST 365 DAYS</text>'
         f'<text x="1166" y="44" text-anchor="end">REDRAWN EVERY 6 H · {stamp}</text></g>']

    # contribution grid, one cell per day; the busiest day is lit orange
    days = [d for w in s["weeks"] for d in w["contributionDays"]]
    counts = sorted(d["contributionCount"] for d in days if d["contributionCount"])
    q = lambda p: counts[min(len(counts) - 1, int(p * len(counts)))] if counts else 0
    cuts = (q(.25), q(.5), q(.75))
    peak = max((d["contributionCount"] for d in days), default=0)
    x0, y0, cell, gap = 34, 66, 11, 3
    months, last_month = [], None
    for wi, w in enumerate(s["weeks"][-53:]):
        for d in w["contributionDays"]:
            date = dt.date.fromisoformat(d["date"])
            di = (date.weekday() + 1) % 7
            n = d["contributionCount"]
            x, y = x0 + wi * (cell + gap), y0 + di * (cell + gap)
            if n == 0:
                fill, op = c["empty"], 1
            elif n == peak:
                fill, op = c["org"], 1
            else:
                fill, op = c["cyan"], (.3 if n <= cuts[0] else .5 if n <= cuts[1] else .75 if n <= cuts[2] else 1)
            o.append(f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" rx="2" fill="{fill}" fill-opacity="{op}"/>')
            if date.day <= 7 and di == 0 and date.month != last_month:
                months.append((x, date.strftime("%b").upper()))
                last_month = date.month
    o.append(f'<g font-family="{MONO}" font-size="10" letter-spacing="1" fill="{c["mute"]}">' +
             "".join(f'<text x="{x}" y="{y0 + 7*(cell+gap) + 12}">{m}</text>' for x, m in months) + "</g>")

    # numbers, right column
    nums = [(f'{s["contributions"]:,}', "contributions"), (f'{s["commits"]:,}', "commits"),
            (f'{s["prs"]:,}', "pull requests"), (f'{s["repos"]}', "public repos"),
            (f'{s["current"]}d', "current streak"), (f'{s["longest"]}d', "longest streak")]
    for i, (n, label) in enumerate(nums):
        col, row = i % 2, i // 2
        x, y = 820 + col * 180, 86 + row * 52
        color = c["org"] if i == 0 else c["cyan"]
        o.append(f'<text x="{x}" y="{y}" font-family="{MONO}" font-size="28" font-weight="700" fill="{color}">{n}</text>')
        o.append(f'<text x="{x}" y="{y+17}" font-family="{MONO}" font-size="11" letter-spacing="1" fill="{c["mute"]}">{label}</text>')

    # language split
    bx, by, bw = 34, 262, W - 68
    o.append(f'<text x="{bx}" y="{by-14}" font-family="{MONO}" font-size="12" letter-spacing="2.5" fill="{c["mute"]}">LANGUAGES · PUBLIC REPOS</text>')
    o.append(f'<clipPath id="bar"><rect x="{bx}" y="{by}" width="{bw}" height="8" rx="4"/></clipPath><g clip-path="url(#bar)">')
    x = bx
    for name, color, share in s["langs"]:
        o.append(f'<rect x="{x:.1f}" y="{by}" width="{bw*share:.1f}" height="8" fill="{color}"/>')
        x += bw * share
    o.append(f'<rect x="{x:.1f}" y="{by}" width="{bx+bw-x:.1f}" height="8" fill="{c["empty"]}"/></g>')
    lx = bx
    for name, color, share in s["langs"]:
        o.append(f'<rect x="{lx}" y="{by+26}" width="9" height="9" rx="2" fill="{color}"/>')
        o.append(f'<text x="{lx+16}" y="{by+35}" font-family="{MONO}" font-size="13" fill="{c["ink"]}">{name} <tspan fill="{c["mute"]}">{share*100:.1f}%</tspan></text>')
        lx += 16 + (len(name) + 7) * 8 + 26
    o.append("</svg>\n")
    return "\n".join(o)


def main():
    if sys.argv[1] == "--sample":
        user, out = sample(), sys.argv[2]
    else:
        user, out = fetch(sys.argv[1], os.environ["GITHUB_TOKEN"]), sys.argv[2]
    s = summarise(user)
    stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    os.makedirs(out, exist_ok=True)
    for t in THEME:
        with open(os.path.join(out, f"stats-{t}.svg"), "w", encoding="utf-8", newline="\n") as f:
            f.write(render(s, t, stamp))


if __name__ == "__main__":
    main()
