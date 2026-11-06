---
title: "Agent benchmark"
description: "A coding agent wrote the same five emails with Hyper Elements, React Email and hand-written HTML. With Hyper Elements it reached a passing email 2× faster and wrote 2.4× fewer tokens."
---

We gave a coding agent the same five emails to build three ways: with Hyper Elements, with React Email, and as hand-written HTML. Each email was done when it passed the same checks. We timed how long that took and counted the tokens.

## Results

Claude Code 2.1.238 with Claude Sonnet 5 (`claude-sonnet-5`), 16 runs per approach, November 6, 2026. Every run reached a passing email.

| | Hyper Elements | Hand-written HTML | React Email |
|---|---|---|---|
| Median time to a passing email | **35s** | 65s | 76s |
| Median output tokens | **2,346** | 5,676 | 5,745 |
| Passed the checks on the first run | **11 of 16** | 4 of 16 | 5 of 16 |
| Median turns | 8 | 9 | 17.5 |
| Median tokens in all, context included | 402k | 375k | 723k |
| Median cost | $0.35 | $0.34 | $0.50 |
| Still right in classic Outlook | 16 of 16 | 15 of 16 | 16 of 16 |

- **2× faster.** Hyper Elements was the fastest on every brief: 1.9× faster than hand-written HTML and 2.2× faster than React Email at the median. Within a brief it was faster in 48 of 52 pairings with HTML and 47 of 52 with React Email (one-sided Mann–Whitney, p < 0.001 for each).
- **2.4× fewer tokens written.** The agent writes a short template; the engine writes the tables.
- **Right the first time more often.** 11 of 16 Hyper Elements emails passed the first time the agent ran the checks, against 4 and 5.
- **Not cheaper in all.** The guide is in the agent's context on every turn (cached), so the tokens in all, and the cost, are about the same as hand-written HTML's, and lower than React Email's.

## The emails

Five briefs, each with the exact copy, links and images, and its layout:

| Brief | What makes it hard |
|---|---|
| Password reset | A sized logo, a button, a preview text |
| Product launch | A hero image, three feature columns that stack on phones |
| Order receipt | Line items with the price on the right, two address columns |
| Newsletter | Two stories, each an image beside text, stacked on phones |
| Event invite | Three detail columns, a button with a hover color |

## The checks

Every approach was held to the same checks, run in headless Chromium at 800px and at 375px wide:

- the copy, the links and the preview text (present, and hidden);
- each button's link, color, size and hover color;
- each image loaded, with alt text, at its size;
- a table layout with no flex or grid, content 600px wide, and no sideways scroll on a phone;
- columns side by side on desktop and stacked on a phone, and line items on one line.

After the runs, each finished email was also laid out as classic Outlook for Windows does it, with the email renderer's model of Outlook. The agents never saw this check. The one email that failed it, hand-written HTML, built its columns from divs, which Outlook stacks.

## How it ran

Each run started in a fresh directory with the brief, a `CLAUDE.md` of conventions and the checker, and the same prompt: "Build the email described in BRIEF.md, following CLAUDE.md. It's done when `node tools/check.mjs` passes." The agent could edit files and run `node`, `tsc`, `ls` and `cat`, with no web access. The Hyper Elements project's `CLAUDE.md` also imported the package's guide, [as we tell you to set it up](/docs/guides/ai-agents), so its tokens count against Hyper Elements.

## What it doesn't show

- One agent and one model. Other agents and models may differ.
- Short, fully specified emails. A vague brief or a long email may change the picture.
- The Outlook check is a model of Outlook, not Outlook itself.
- Hyper Elements 0.3 before its release, and React Email components 1.0.12.

The harness, the briefs, the checks and every run's numbers are in the repository, in [`apps/website/benchmark`](https://github.com/hyper-elements/hyper-elements/tree/main/apps/website/benchmark). Run it yourself with your own agent.
