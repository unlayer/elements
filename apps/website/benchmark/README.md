# Agent benchmark

How long a coding agent takes to write a correct email with Hyper Elements, with React Email, and as
hand-written HTML, and how many tokens it spends. The results are on hyperelements.dev/docs/benchmark.

## What runs

- **Five briefs** (`briefs/*.json`): a password reset, a product launch, an order receipt, a newsletter
  and an event invite. Each gives the exact copy, links and images, and the layout: columns side by side
  on desktop and stacked on phones, a line-item table, a hover color.
- **Three kits** (`kits/`): what the agent starts with. Each has the same conventions file (CLAUDE.md)
  and the same checker. Hyper Elements' CLAUDE.md also imports its agent guide (GUIDE.md), as the
  docs tell users to set it up, so the guide's tokens count against it.
  - `he`: write `emails/email.tsx` with `@hyper-elements/react`; `node tools/render.mjs`.
  - `react-email`: write `emails/email.tsx` with `@react-email/components`; `node tools/render.mjs`.
  - `html`: write `out/email.html` by hand.
- **One bar** (`lib/check.mjs`, copied into each run as `tools/check.mjs`): the same checks for every
  kit, in headless Chromium at 800px and 375px: the copy, the links, the buttons (link, color, size,
  hover), the images (loaded, alt text, size), table layout with no flex or grid, a hidden preview text,
  600px content, no sideways scroll on a phone, columns side by side on desktop and stacked on a phone,
  and line items on one line with the price on the right.
- **The agent**: Claude Code, headless (`claude -p`), the same prompt every run: "Build the email
  described in BRIEF.md, following CLAUDE.md. It's done when `node tools/check.mjs` passes." It may
  edit files and run node, tsc, ls and cat; no web, subagents or skills.
- **A second score, after the runs** (`lib/outlook.mjs`): each finished email as classic Outlook for
  Windows lays it out, with the email renderer's rules (unlayer/email-renderer). The agents never saw
  it. It checks the copy, 600px width, the button's color, the images' sizes, the columns and the line
  items; not a button's height, since the renderer doesn't model `mso-padding-alt`.

Each run gets a fresh directory and its full transcript is kept. One row per run goes to `results/`.

## Running it

```bash
npm install
HYPER_ELEMENTS_PACKAGE=/path/to/checkout/packages/react npm run setup   # until @hyper-elements/react is on npm
npm run bench -- --kits he,react-email,html --briefs all --reps 3 --model sonnet --concurrency 4
npm run outlook -- results/<stamp>.jsonl     # needs EMAIL_RENDERER, a checkout of the email renderer
npm run report -- results/<stamp>.outlook.jsonl
```

`claude` must be signed in. A run costs about $0.25–$1.

## 2026-11-06 (`results/2026-11-06-sonnet.jsonl`)

Claude Code 2.1.238 with Claude Sonnet 5 (`claude-sonnet-5`), Hyper Elements 0.3 (the RFC 0001 engine, before release), React Email
components 1.0.12. These runs imported the components from `@hyper-elements/react/primitives`, and the guide
was `PRIMITIVES.md`: the engine's names before it was merged. The kit now uses `@hyper-elements/react` and `GUIDE.md`. 16 runs per kit: three per brief, plus one pilot launch email each. Every run reached
the bar.

| | Hyper Elements | Hand-written HTML | React Email |
|---|---|---|---|
| Median time to a passing email | **35s** | 65s | 76s |
| Median output tokens | **2,346** | 5,676 | 5,745 |
| Passed the check on the first run | **11 of 16** | 4 of 16 | 5 of 16 |
| Median turns | 8 | 9 | 17.5 |
| Median tokens in all (context included) | 402k | 375k | 723k |
| Median cost | $0.35 | $0.34 | $0.50 |
| Classic Outlook score | 16 of 16 | 15 of 16 | 16 of 16 |

- Hyper Elements was the fastest on every brief: 1.9× faster than hand-written HTML and 2.2× faster
  than React Email at the median. Within a brief, it was faster in 48 of 52 pairings with HTML and 47 of
  52 with React Email (Mann–Whitney, one-sided, p < 0.001 for each).
- It writes 2.4× fewer output tokens. It doesn't use fewer tokens in all than hand-written HTML: its
  guide is in the context of every turn (cached), so the cost is the same as HTML's.
- The HTML email that failed the Outlook score built its columns from divs, which classic Outlook stacks.

Not measured: other agents and models, longer or less specified emails, and real Outlook (the second
score is the email renderer's model of it). The agent could read the checker's source, the same for
every kit. In the first batch the receipt's line-item check failed correct tables (adjacent cells
touch); it was fixed and the receipt run again, and the first batch's receipts aren't in the results.
