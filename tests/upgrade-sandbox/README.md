# Upgrade sandbox

If a project using today's components (the `@unlayer/react-elements` main entry) upgrades from the published
0.2.1 to this repository's build, what changes for a reader of its emails and pages? The sandbox renders the
same templates with both and compares what Chromium draws.

- **OLD** is the published `@unlayer/react-elements@0.2.1`, installed from npm under the alias `old-elements`.
- **NEW** is this repository's `packages/react`: with `--pack`, the tarball `pnpm pack` makes of it, installed
  as a project would get it from npm.
- **The templates** (`corpus/`) are today's components only: the demo app's templates, every component and
  example story, 40 templates generated at random from fixed seeds (`corpus/generator.mjs`), and the inputs of
  the review of the switch to the new engine (`corpus/review.mjs`), each in an email, a page and a printed
  document: 236 templates, 312 template/mode pairs.

For each template, both sides must give the same `renderToJson()` design and the same `renderToPlainText()`
text. `renderToHtml()` is rendered in each mode the template is meant for; its bytes are reported but not
compared (the new engine writes other markup). Each page is loaded in headless Chromium at 375 (a phone), 600
and 800 px wide, with the network blocked and every image a local placeholder, and compared word by word:
where each word sits, its size and text style, the images, where links go and which words and images each one
covers, the page's size (1px of give), and what's painted besides text (8 pixels of give).

It's kept out of the pnpm workspace (`pnpm-workspace.yaml` lists `packages/*` and `examples/*`), because it
installs the published release from npm with npm.

## Running it

```bash
# at the repository's root: NEW is packages/react's dist
pnpm install
pnpm build

cd tests/upgrade-sandbox
npm install                       # 0.2.1 as old-elements, React 18, esbuild, Playwright
npx playwright install chromium   # once
node run.mjs --pack               # or: npm run compare
```

It takes about half a minute. `node run.mjs` without `--pack` (`npm run compare:fast`) copies
`packages/react`'s `package.json` and `dist` instead of packing them, and resolves their dependencies from
the sandbox's `node_modules` (it warns where those aren't the versions NEW asks for). `node run.mjs --help`
lists the options: `--only <text>` for some templates, `--modes`, `--widths`, the tolerances, `--jobs`, and
`--worktree <path>` for another checkout's build.

It exits 0 when nothing differs but what `expected.json` declares, 1 when something else differs, and 2 when
the harness itself fails.

`node selftest.mjs` (`npm run selftest`) shows the harness catches what it should: it breaks a copy of NEW
four ways (a word gone, a link changed, a text color, a button's color), runs the corpus against it, and
passes only if the report names exactly those. `npm test` checks the comparison itself without a browser: what
it calls a difference, and what `expected.json` may excuse.

`node corpus/sync.mjs` (`npm run sync`) refreshes `corpus/` from the repository's stories and demo templates.
A template importing something 0.2.1 doesn't export can't be rendered by both, so it's skipped and listed in
`corpus/skipped.json`.

## Reading report.md

The run writes `report.md` and `report.json` here (gitignored).

- **The first line** is the answer: no unexpected differences, or how many template/modes differ.
- **The table under it** says what was compared: each side's version and the hash of its `dist/index.js`,
  the Chromium version and widths, the tolerances, and how many of `expected.json`'s declarations matched.
- **Corpus** counts the templates by source and mode, and **Totals** the results of each check.
- **Per template** has a row for each template and mode: the design (JSON), the plain text, the HTML's bytes
  (`identical` or `changed`, for information), and each width: `pass`, `diff (n)` or `expected (n)`, with the
  number of differences.
- **Differences** lists each one that isn't expected, by template and width, with what moved or changed
  (`text: "signing" is gone`, `style: color … → …`, `position: …`, `paint: …`) and links to
  `out/<template>/`: OLD's and NEW's HTML, and a screenshot of both side by side at that width.
- **Expected differences** lists those `expected.json` declares, the same way. **Stale expectations** are
  declarations that no longer differ: remove them from `expected.json`.
- **Skipped**, **Modules that failed to load** and **Notes** (a design or text both sides fail to render the
  same way, warnings that changed) aren't counted as differences.

## expected.json

The differences a release means to make: fixes, where what NEW draws is what the template asked for and OLD's
wasn't. Each is declared for a template, a mode and a width, with a reason that says why and which kinds of
difference the fix makes:

```json
{
  "reasons": {
    "long-words": { "why": "a word too long for its column … wraps inside it", "accepts": ["position", "page height", "paint"] }
  },
  "expected": { "story-Column-StatsBar": { "web": { "600": "long-words" } } }
}
```

A kind is `text`, `style`, `position`, `image`, `link`, `page` or `paint`, or a kind and what of it: `image box`
(an image moved or resized, not one gone, new or with another alt), `page height`, `page scroll`. A
declared difference is still listed in the report, as expected, and doesn't fail the run. Any other difference
fails it, at a declared width too: a fix that moves words doesn't excuse a word gone. Declare a difference only once it's accepted as a fix (and pinned by a test of its own), never to make a
run pass.

## Why it isn't in CI

Run it by hand, before a release that changes how today's components render. On Linux, in CI's Playwright
image and fonts, it isn't reliable yet: `expected.json` was measured on macOS, and with CI's fonts a word
wraps elsewhere in one more template (`story-Column-PricingCards`, page, 600px); and in Docker, Chromium
closed partway through a run, failing every comparison after it. CI covers much of the same ground on every
pull request: the previous-release tests in `packages/react/src/regression` (against the release their npm
alias pins) and the Storybook comparison gate (main's templates through the new engine, in Chromium).
