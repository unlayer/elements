#!/usr/bin/env node
// Run with: node scripts/browser-e2e.mjs  (requires `pnpm build` first)
// Regenerate the style baseline with: UPDATE_E2E_BASELINE=1 node scripts/browser-e2e.mjs
//
// Browser E2E gate for @unlayer/react-elements.
//
// Snapshot tests freeze the HTML strings we emit; this gate proves what a
// real rendering engine does with them. It renders full documents with the
// BUILT main entry (dist/primitives.js, the artifact we ship) — an Email, a
// Page and a Document of the same content — loads each one into headless
// Chromium, and asserts on the browser's computed output:
//
//   1. Document contract — every <p> computes to zero margins (all four:
//      margin-top/bottom and margin-block-start/end; browsers default <p>
//      to 1em block margins and email clients strip <head> resets, so the
//      inline reset must win), exactly one <body> in the parsed DOM,
//      <title> parsed, head <style> applied, links render, no console or
//      page errors.
//   2. Responsive — a three-column row lays out side-by-side at desktop
//      width and stacks to full-width columns on a phone, in an Email and a
//      Page; a Row that doesn't stack (stackOnMobile={false}) keeps its
//      columns side by side in proportion there.
//   3. Interaction — hovering the button applies the configured hover
//      background and text colors (head :hover CSS reaches the DOM).
//   4. RTL — the root's dir propagates to a computed rtl direction.
//   5. Style baseline — a JSON snapshot of computed styles and geometry
//      (colors, fonts, radii, padding, column widths) diffed against the
//      committed baseline. Catches "renders fine but looks different"
//      drift. Computed values are used instead of pixel screenshots so the
//      baseline is deterministic across macOS and Linux.
//   6. No horizontal overflow — at mobile width nothing forces a horizontal
//      scrollbar (catch-all for any layout breakage).
//   7. Preheader — an Email's previewText is present for inbox preview but
//      invisible and zero-size in the rendered email.
//   8. Accessibility — images carry alt text, links have accessible names,
//      layout tables are hidden from screen readers (role="presentation").
//   9. Image sizing — a pinned display width computes to the requested
//      pixels and the image stays inside its column.
//  10. CSS parses — every non-empty <style> yields parseable rules; an
//      unbalanced brace silently kills the rest of a stylesheet.
//  11. Print — a Document stays visible under print media emulation.
//  12. Row side padding — an email row's side padding stays inside the
//      email: in a window only a little wider than the email, nothing
//      scrolls sideways and the content stays centred.
//  13. Phone settings — a column's phone padding, an image's phone width
//      and what's hidden on phones or desktop apply at 375px and leave
//      desktop as it was (with a negative control: the same template
//      without them fails those checks).
//  14. Locked block — a block the builder keeps as markup fills its place
//      in a block, a flex box and a grid.
//
// A negative control (a document with a bare <p>) must FAIL the margin
// check — so a green run also proves the gate can detect the regressions
// it exists to catch, not just that the selectors matched nothing.

import { chromium } from "playwright";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const React = (await import("react")).default;
const {render, Email, Page, Document, Row, Column, Text, Heading, Button, Divider, Image, Layer} = await import("../dist/primitives.js");
const { toDesign } = await import("../dist/builder.js");

/** A template's HTML, as render() writes it. */
const renderHtml = async (element) => (await render(element)).html;
const h = React.createElement;
const BASELINE_PATH = join(dirname(fileURLToPath(import.meta.url)), "browser-e2e-baseline.json");
const UPDATE_BASELINE = process.env.UPDATE_E2E_BASELINE === "1";
const DESKTOP = { width: 1280, height: 800 };
// Below both stacking breakpoints (a Page's: 480px; an Email's: its width
// + 20px)
const MOBILE = { width: 400, height: 800 };
const BREAKPOINT_NOTE = "mobile breakpoint";

const BUTTON_PROPS = {
  href: "https://example.com",
  style: { color: "#ffffff", backgroundColor: "#3b82f6", borderRadius: 8 },
  hover: { color: "#ffff00", backgroundColor: "#1d4ed8" },
};

// Self-contained image (no network in CI): 400×200 intrinsic size, drawn
// 200px wide to exercise the image's width in its column.
const IMAGE_SRC = {
  src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="%233b82f6"/></svg>',
  width: 400,
  height: 200,
};
const IMAGE_DISPLAY_WIDTH = 200;
const PREVIEW_TEXT = "Preview line for the inbox list";

/** The root's own props: a content width where it has one (a Document's is its page's), an Email's preview text. */
const rootProps = (Root, props) => ({ ...(Root === Document ? {} : { width: 600 }), ...(Root === Email ? { previewText: PREVIEW_TEXT } : {}), ...props });

/** The golden tree: fixed content width so geometry is deterministic. */
function tree(Root, props = {}) {
  return h(Root, rootProps(Root, props),
    h(Row, null,
      h(Column, { id: "col-1" }, h(Text, null, "Col one")),
      h(Column, { id: "col-2" }, h(Text, null, "Col two")),
      h(Column, { id: "col-3" }, h(Text, null, "Col three"))
    ),
    h(Row, { id: "row-2" },
      h(Column, null,
        h(Heading, null, "Browser E2E"),
        h(Text, null, "First paragraph."),
        h(Text, null, "Second paragraph."),
        h(Image, { src: IMAGE_SRC, alt: "Product logo", style: { width: IMAGE_DISPLAY_WIDTH } }),
        h(Divider, null),
        h(Button, BUTTON_PROPS, "Call to action")
      )
    )
  );
}

const DOCUMENTS = await Promise.all(
  [
    { name: "email", Root: Email, title: "E2E email" },
    { name: "web", Root: Page, title: "E2E web" },
    { name: "document", Root: Document, title: "E2E document" },
  ].map(async (d) => ({ ...d, html: await renderHtml(tree(d.Root, { title: d.title })) }))
);

// Negative control: the failure mode this gate exists to catch.
const BAD_DOCUMENT = `<!doctype html>
<html><head><title>bad</title></head>
<body><p>bare paragraph with UA margins</p></body>
</html>`;

let failed = false;
function fail(section, problems) {
  failed = true;
  console.error(`E2E_FAIL [${section}]:`);
  for (const p of problems) console.error(`  - ${p}`);
}
function pass(section, note) {
  console.log(`E2E_PASS [${section}]: ${note}`);
}

/** Load a document and return the browser-computed facts the gate asserts on. */
async function inspect(page, html) {
  const consoleErrors = [];
  const pageErrors = [];
  const onConsole = (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); };
  const onPageError = (err) => pageErrors.push(String(err));
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  await page.setContent(html, { waitUntil: "load" });

  const facts = await page.evaluate(() => {
    const ps = [...document.querySelectorAll("p")];
    return {
      title: document.title,
      bodyCount: document.querySelectorAll("body").length,
      headStyleCount: document.head.querySelectorAll("style").length,
      linkCount: document.querySelectorAll("a[href]").length,
      paragraphCount: ps.length,
      badParagraphs: ps
        .map((p) => {
          const cs = getComputedStyle(p);
          const margins = [cs.marginTop, cs.marginBottom, cs.marginBlockStart, cs.marginBlockEnd];
          return margins.every((m) => m === "0px")
            ? null
            : { text: p.textContent.slice(0, 40), margins };
        })
        .filter(Boolean),
    };
  });

  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  return { ...facts, consoleErrors, pageErrors };
}

/** Section 1: document contract. */
async function checkDocuments(page) {
  for (const { name, html, title } of DOCUMENTS) {
    const facts = await inspect(page, html);
    const problems = [];
    if (facts.title !== title) problems.push(`title is ${JSON.stringify(facts.title)}, expected ${JSON.stringify(title)}`);
    if (facts.bodyCount !== 1) problems.push(`${facts.bodyCount} <body> elements in the DOM, expected exactly 1`);
    if (facts.headStyleCount < 1) problems.push("no <style> in <head>");
    if (facts.linkCount < 1) problems.push("no rendered links");
    if (facts.paragraphCount < 5) problems.push(`only ${facts.paragraphCount} <p> elements rendered, expected >= 5`);
    for (const p of facts.badParagraphs) {
      problems.push(`<p> "${p.text}" has non-zero computed margins: ${p.margins.join(", ")}`);
    }
    if (facts.consoleErrors.length) problems.push(`console errors: ${facts.consoleErrors.join(" | ")}`);
    if (facts.pageErrors.length) problems.push(`page errors: ${facts.pageErrors.join(" | ")}`);

    if (problems.length) fail(`document:${name}`, problems);
    else pass(`document:${name}`, `1 body, ${facts.paragraphCount} paragraphs at 0px margins, title + styles + links OK`);
  }
}

/** Measure the columns of the first row (col-1, col-2, …): [{x, width, top, bottom}]. */
async function measureColumns(page) {
  return page.evaluate(() => {
    const cols = [1, 2, 3].map((n) => document.getElementById(`col-${n}`)).filter(Boolean);
    return cols.map((c) => {
      const r = c.getBoundingClientRect();
      return { x: Math.round(r.x), width: Math.round(r.width), top: Math.round(r.top), bottom: Math.round(r.bottom) };
    });
  });
}

/**
 * Section 2b: a Row with stackOnMobile={false} keeps its columns side by side on phones,
 * in proportion, even when a stacking row follows it (every row writes its
 * own grid CSS, so a later row's rules must not override the earlier one's).
 */
async function checkNoStack(page) {
  for (const { name, Root } of DOCUMENTS.filter((d) => d.name !== "document")) {
    const html = await renderHtml(
      h(Root, { width: 600 },
        h(Row, { stackOnMobile: false },
          h(Column, { id: "col-1", style: { width: "25%" } }, h(Text, null, "Quarter")),
          h(Column, { id: "col-2", style: { width: "75%" } }, h(Text, null, "Three quarters"))
        ),
        h(Row, null,
          h(Column, null, h(Text, null, "Stacks")),
          h(Column, null, h(Text, null, "Below"))
        )
      )
    );
    await page.setViewportSize(MOBILE);
    await page.setContent(html, { waitUntil: "load" });
    const cols = await measureColumns(page);
    const problems = [];
    if (cols.length !== 2) problems.push(`found ${cols.length} columns in the no-stack row, expected 2`);
    else {
      if (Math.abs(cols[0].top - cols[1].top) > 1) problems.push(`columns stacked (tops ${cols[0].top}, ${cols[1].top})`);
      const share = cols[0].width / (cols[0].width + cols[1].width);
      if (Math.abs(share - 0.25) > 0.03) problems.push(`first column is ${Math.round(share * 100)}% of the row, expected 25%`);
    }
    await page.setViewportSize(DESKTOP);
    if (problems.length) fail(`no-stack:${name}`, problems);
    else pass(`no-stack:${name}`, `a Row that doesn't stack stays 25% / 75% at ${MOBILE.width}px`);
  }
}

/** Section 2: responsive stacking in web and email modes. */
async function checkResponsive(page) {
  for (const { name, html } of DOCUMENTS.filter((d) => d.name !== "document")) {
    const problems = [];

    await page.setViewportSize(DESKTOP);
    await page.setContent(html, { waitUntil: "load" });
    const desktop = await measureColumns(page);
    if (desktop.length !== 3) {
      problems.push(`desktop: found ${desktop.length} columns, expected 3`);
    } else {
      const sideBySide = desktop[0].x < desktop[1].x && desktop[1].x < desktop[2].x;
      if (!sideBySide) problems.push(`desktop: columns not side-by-side (x: ${desktop.map((c) => c.x).join(", ")})`);
      const third = Math.round(600 / 3);
      for (const c of desktop) {
        if (Math.abs(c.width - third) > 2) problems.push(`desktop: column width ${c.width}px, expected ~${third}px`);
      }
    }

    await page.setViewportSize(MOBILE);
    await page.setContent(html, { waitUntil: "load" });
    const mobile = await measureColumns(page);
    if (mobile.length !== 3) {
      problems.push(`mobile: found ${mobile.length} columns, expected 3`);
    } else {
      const stacked = mobile[1].top >= mobile[0].bottom - 1 && mobile[2].top >= mobile[1].bottom - 1;
      if (!stacked) problems.push(`mobile: columns did not stack below the ${BREAKPOINT_NOTE}`);
      for (const c of mobile) {
        if (c.width < MOBILE.width * 0.6) problems.push(`mobile: stacked column is ${c.width}px wide, expected near full width`);
      }
    }

    await page.setViewportSize(DESKTOP);
    if (problems.length) fail(`responsive:${name}`, problems);
    else pass(`responsive:${name}`, `3 columns side-by-side at ${DESKTOP.width}px, stacked full-width at ${MOBILE.width}px`);
  }
}

/** Section 3: hover states (web mode carries :hover CSS in the head). */
async function checkHover(page) {
  const web = DOCUMENTS.find((d) => d.name === "web");
  const problems = [];

  await page.setContent(web.html, { waitUntil: "load" });
  const selector = 'a[href="https://example.com"]';
  const readColors = () =>
    page.$eval(selector, (a) => {
      const cs = getComputedStyle(a);
      return { background: cs.backgroundColor, color: cs.color };
    });

  const base = await readColors();
  if (base.background !== "rgb(59, 130, 246)") problems.push(`base background is ${base.background}, expected rgb(59, 130, 246)`);

  await page.hover(selector);
  const hovered = await readColors();
  if (hovered.background !== "rgb(29, 78, 216)") problems.push(`hover background is ${hovered.background}, expected rgb(29, 78, 216)`);
  if (hovered.color !== "rgb(255, 255, 0)") problems.push(`hover color is ${hovered.color}, expected rgb(255, 255, 0)`);

  await page.mouse.move(0, 0);
  if (problems.length) fail("hover", problems);
  else pass("hover", "button hover applies configured background + text colors");
}

/** Section 4: RTL — the root's dir reaches the computed direction. */
async function checkRtl(page) {
  const problems = [];
  const html = await renderHtml(tree(Email, { title: "E2E rtl", dir: "rtl" }));
  await page.setContent(html, { waitUntil: "load" });

  const facts = await page.evaluate(() => ({
    htmlDir: document.documentElement.getAttribute("dir"),
    paragraphDirection: getComputedStyle(document.querySelector("p")).direction,
  }));
  if (facts.htmlDir !== "rtl") problems.push(`<html dir> is ${JSON.stringify(facts.htmlDir)}, expected "rtl"`);
  if (facts.paragraphDirection !== "rtl") problems.push(`computed <p> direction is ${facts.paragraphDirection}, expected rtl`);

  if (problems.length) fail("rtl", problems);
  else pass("rtl", "the root's dir propagates to computed rtl direction");
}

/**
 * Section 5: style baseline. Collect deterministic computed facts (colors,
 * fonts, radii, padding, alignment, fixed-container geometry) and diff
 * against the committed JSON baseline. Heights and text-dependent widths
 * are deliberately excluded — font rasterization differs across platforms.
 */
async function collectStyleFacts(page) {
  const facts = {};
  await page.setViewportSize(DESKTOP);
  for (const { name, html } of DOCUMENTS) {
    await page.setContent(html, { waitUntil: "load" });
    facts[name] = await page.evaluate(() => {
      const pick = (el, props) => {
        if (!el) return null;
        const cs = getComputedStyle(el);
        return Object.fromEntries(props.map((p) => [p, cs[p]]));
      };
      const textProps = ["color", "backgroundColor", "fontSize", "fontWeight", "fontFamily", "textAlign", "lineHeight", "direction"];
      const boxProps = ["backgroundColor", "borderRadius", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight"];
      const columns = [1, 2, 3].map((n) => document.getElementById(`col-${n}`)).filter(Boolean).map((c) => Math.round(c.getBoundingClientRect().width));
      // The button as a reader sees it: its label's type and inset (from the element holding the label's
      // text) and its face (the nearest box behind the label that paints a background). Markup may put
      // these on the link, an inner span or the cell around it; the reader sees the same button.
      const link = document.querySelector('a[href="https://example.com"]');
      const label = link && [link, ...link.querySelectorAll("*")].find((el) =>
        [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim()));
      let face = label;
      while (face && getComputedStyle(face).backgroundColor === "rgba(0, 0, 0, 0)") face = face.parentElement;
      return {
        heading: pick(document.querySelector("h1, h2, h3, h4, h5, h6"), textProps),
        firstParagraph: pick(document.querySelector("#row-2 p"), textProps),
        button: label && {
          ...pick(label, [...textProps, ...boxProps]),
          ...pick(face, ["backgroundColor", "borderRadius"]),
        },
        columnWidths: columns,
      };
    });
  }
  return facts;
}

function diffFacts(baseline, current, path = "") {
  const diffs = [];
  const keys = new Set([...Object.keys(baseline ?? {}), ...Object.keys(current ?? {})]);
  for (const key of keys) {
    const b = baseline?.[key];
    const c = current?.[key];
    const at = path ? `${path}.${key}` : key;
    if (b !== null && c !== null && typeof b === "object" && typeof c === "object") {
      diffs.push(...diffFacts(b, c, at));
    } else if (JSON.stringify(b) !== JSON.stringify(c)) {
      diffs.push(`${at}: ${JSON.stringify(b)} -> ${JSON.stringify(c)}`);
    }
  }
  return diffs;
}

async function checkStyleBaseline(page) {
  const current = await collectStyleFacts(page);

  if (UPDATE_BASELINE || !existsSync(BASELINE_PATH)) {
    if (!UPDATE_BASELINE && process.env.CI) {
      fail("style-baseline", ["baseline file missing in CI — commit scripts/browser-e2e-baseline.json (generate with UPDATE_E2E_BASELINE=1)"]);
      return;
    }
    writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2) + "\n");
    pass("style-baseline", `baseline ${UPDATE_BASELINE ? "regenerated" : "created"} at scripts/browser-e2e-baseline.json`);
    return;
  }

  const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
  const diffs = diffFacts(baseline, current);
  if (diffs.length) {
    fail("style-baseline", [
      ...diffs,
      "If this change is intentional, regenerate with: UPDATE_E2E_BASELINE=1 pnpm test:e2e",
    ]);
  } else {
    pass("style-baseline", "computed styles + geometry match the committed baseline");
  }
}

/** Section 6: no horizontal overflow at mobile width. */
async function checkOverflow(page) {
  await page.setViewportSize(MOBILE);
  for (const { name, html } of DOCUMENTS.filter((d) => d.name !== "document")) {
    await page.setContent(html, { waitUntil: "load" });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (scrollWidth > MOBILE.width + 1) {
      fail(`overflow:${name}`, [`document scrollWidth is ${scrollWidth}px at a ${MOBILE.width}px viewport — content forces horizontal scrolling`]);
    } else {
      pass(`overflow:${name}`, `no horizontal overflow at ${MOBILE.width}px`);
    }
  }
  await page.setViewportSize(DESKTOP);
}

/**
 * Section 12: an email row's side padding stays inside the email. In a window a little wider than the
 * email (600px for a 560px email whose row has 48px sides), the email doesn't scroll sideways and the
 * row's content stays centred, as wide as the email less its sides. (Through 0.2 the sides were written
 * outside the content width: the page scrolled 8px and the content sat 28px right of centre.)
 */
async function checkRowSidePadding(page) {
  const window = { width: 600, height: 800 };
  await page.setViewportSize(window);
  const html = await renderHtml(h(Email, { width: 560, style: { backgroundColor: "#eeeeee" } },
    h(Row, { style: { padding: [36, 48], backgroundColor: "#ffffff" } },
      h(Column, { id: "padded-column" }, h(Text, null, "A row with side padding")))));
  await page.setContent(html, { waitUntil: "load" });
  const facts = await page.evaluate(() => {
    const column = document.getElementById("padded-column").getBoundingClientRect();
    return { scrollWidth: document.documentElement.scrollWidth, left: column.left, right: column.right };
  });
  const problems = [];
  if (facts.scrollWidth > window.width) problems.push(`the email scrolls sideways: ${facts.scrollWidth}px wide in a ${window.width}px window`);
  const margins = [facts.left, window.width - facts.right];
  if (Math.abs(margins[0] - margins[1]) > 1) problems.push(`the row's content isn't centred: ${margins.map(Math.round).join("px left, ")}px right`);
  if (Math.abs(facts.right - facts.left - 464) > 1) problems.push(`the row's content is ${Math.round(facts.right - facts.left)}px wide, expected 464px (560px less 48px on each side)`);
  await page.setViewportSize(DESKTOP);
  if (problems.length) fail("row-side-padding", problems);
  else pass("row-side-padding", `an email row with 48px sides fits a ${window.width}px window, centred, without sideways scroll`);
}

/**
 * Section 14: a block the builder keeps as markup fills its place, whatever draws it there. A page's <main> is
 * centered by its margins: in a flex box those shrink it to its words, unless it has a width.
 */
async function checkLockedBlock(page) {
  const { design } = toDesign(h(Page, { width: 1000 }, h(Layer, { style: { height: 100 } }, h(Text, null, "Locked"))));
  const block = design.body.rows.flatMap((row) => row.columns.flatMap((column) => column.contents)).find((content) => content.type === "html");
  const problems = [];
  for (const display of ["block", "flex", "grid"]) {
    await page.setContent(`<!DOCTYPE html><body style="margin:0"><div style="display:${display};flex-direction:column;width:800px">${block.values.html}</div></body>`);
    const { left, width } = await page.evaluate(() => {
      const { left, width } = document.querySelector("main").getBoundingClientRect();
      return { left, width };
    });
    if (left !== 0 || width !== 800) problems.push(`in a display:${display} place 800px wide, it's ${Math.round(width)}px wide, ${Math.round(left)}px from its left`);
  }
  if (problems.length) fail("locked-block", problems);
  else pass("locked-block", "a block of markup fills its place in a block, a flex box and a grid");
}

/** Section 7: preheader — present for inbox preview, invisible on screen. */
async function checkPreheader(page) {
  const email = DOCUMENTS.find((d) => d.name === "email");
  const problems = [];

  await page.setContent(email.html, { waitUntil: "load" });
  const facts = await page.evaluate((previewText) => {
    const candidates = [...document.querySelectorAll("body div")].filter((d) =>
      d.textContent.includes(previewText)
    );
    // innermost wrapper containing the preview text
    const el = candidates[candidates.length - 1];
    if (!el) return null;
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return { display: cs.display, width: rect.width, height: rect.height };
  }, PREVIEW_TEXT);

  if (!facts) {
    problems.push("previewText not found in the rendered email");
  } else if (facts.display !== "none" && (facts.width > 1 || facts.height > 1)) {
    problems.push(`preheader is visible (display: ${facts.display}, ${facts.width}x${facts.height}px) — it must be hidden on screen`);
  }

  if (problems.length) fail("preheader", problems);
  else pass("preheader", "previewText present in the email and invisible on screen");
}

/** Section 8: accessibility essentials. */
async function checkAccessibility(page) {
  for (const { name, html } of DOCUMENTS) {
    await page.setContent(html, { waitUntil: "load" });
    const facts = await page.evaluate(() => ({
      imagesWithoutAlt: [...document.querySelectorAll("img")]
        .filter((img) => !img.getAttribute("alt"))
        .map((img) => img.src.slice(0, 60)),
      linksWithoutName: [...document.querySelectorAll("a[href]")]
        .filter((a) => !a.textContent.trim() && !a.getAttribute("aria-label") && !a.querySelector("img[alt]"))
        .map((a) => a.href.slice(0, 60)),
      // No data-table component in this tree, so every <table> is layout
      // and must be hidden from screen readers.
      layoutTablesWithoutRole: [...document.querySelectorAll("table")]
        .filter((t) => t.getAttribute("role") !== "presentation").length,
    }));

    const problems = [];
    if (facts.imagesWithoutAlt.length) problems.push(`images without alt: ${facts.imagesWithoutAlt.join(", ")}`);
    if (facts.linksWithoutName.length) problems.push(`links without an accessible name: ${facts.linksWithoutName.join(", ")}`);
    if (facts.layoutTablesWithoutRole > 0) problems.push(`${facts.layoutTablesWithoutRole} layout table(s) missing role="presentation"`);

    if (problems.length) fail(`a11y:${name}`, problems);
    else pass(`a11y:${name}`, "alt text, link names, and layout-table roles OK");
  }
}

/** Section 9: image width pinning holds in the browser. */
async function checkImageSizing(page) {
  for (const { name, html } of DOCUMENTS.filter((d) => d.name !== "document")) {
    await page.setContent(html, { waitUntil: "load" });
    const facts = await page.evaluate(() => {
      const img = document.querySelector('img[alt="Product logo"]');
      if (!img) return null;
      const imgRect = img.getBoundingClientRect();
      const col = img.closest(".u-col") ?? img.closest("td") ?? document.body;
      const colRect = col.getBoundingClientRect();
      return {
        width: Math.round(imgRect.width),
        insideColumn: imgRect.right <= colRect.right + 1 && imgRect.left >= colRect.left - 1,
      };
    });

    const problems = [];
    if (!facts) problems.push("image not rendered");
    else {
      if (Math.abs(facts.width - IMAGE_DISPLAY_WIDTH) > 2) problems.push(`image width is ${facts.width}px, expected ~${IMAGE_DISPLAY_WIDTH}px`);
      if (!facts.insideColumn) problems.push("image overflows its column");
    }

    if (problems.length) fail(`image:${name}`, problems);
    else pass(`image:${name}`, `pinned width renders at ~${IMAGE_DISPLAY_WIDTH}px inside its column`);
  }
}

/**
 * Section 10: every <style> parses into every rule it writes. A malformed rule makes the browser drop
 * it (and often the rules after it), so a sheet that parses into fewer rules than its source holds
 * at the top level is broken — however few rules the writer needs.
 */
async function checkCssParses(page) {
  for (const { name, html } of DOCUMENTS) {
    await page.setContent(html, { waitUntil: "load" });
    const facts = await page.evaluate(() => {
      // Top-level rules in the source: blocks that close at depth 0, and statements such as @import.
      const written = (css) => {
        let depth = 0;
        let count = 0;
        const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
        for (let i = 0; i < source.length; i++) {
          const c = source[i];
          if (c === "{") depth++;
          else if (c === "}" && depth > 0 && --depth === 0) count++;
          else if (c === "@" && depth === 0 && /^@(import|charset|namespace|layer [^{;]*;)/.test(source.slice(i))) count++;
        }
        return count;
      };
      const sheets = [...document.styleSheets];
      let totalRules = 0;
      const broken = [];
      for (const sheet of sheets) {
        try {
          const count = sheet.cssRules.length;
          totalRules += count;
          const source = sheet.ownerNode?.textContent ?? "";
          const expected = written(source);
          if (count < expected || (source.trim().length > 0 && count === 0)) {
            broken.push(`${count} of ${expected} rules parsed: ${source.slice(0, 80)}`);
          }
        } catch (e) {
          broken.push(String(e));
        }
      }
      return { sheetCount: sheets.length, totalRules, broken };
    });

    const problems = [];
    if (facts.sheetCount < 1) problems.push("no stylesheets in the document");
    if (facts.totalRules < 1) problems.push("no CSS rules parsed");
    for (const b of facts.broken) problems.push(`a <style> lost rules when parsed — ${b}`);

    if (problems.length) fail(`css:${name}`, problems);
    else pass(`css:${name}`, `${facts.totalRules} CSS rules parsed across ${facts.sheetCount} stylesheets`);
  }
}

/** Section 11: document mode stays visible under print media emulation. */
async function checkPrint(page) {
  const doc = DOCUMENTS.find((d) => d.name === "document");
  const problems = [];

  await page.emulateMedia({ media: "print" });
  await page.setContent(doc.html, { waitUntil: "load" });
  const facts = await page.evaluate(() => {
    const heading = document.querySelector("h1, h2, h3, h4, h5, h6");
    const rect = heading?.getBoundingClientRect();
    return {
      headingVisible: !!rect && rect.width > 0 && rect.height > 0,
      paragraphCount: document.querySelectorAll("p").length,
    };
  });
  await page.emulateMedia({ media: "screen" });

  if (!facts.headingVisible) problems.push("heading not visible under print media");
  if (facts.paragraphCount < 2) problems.push(`only ${facts.paragraphCount} paragraphs under print media`);

  if (problems.length) fail("print", problems);
  else pass("print", "document mode renders visibly under print media emulation");
}

/** Negative control: the gate must flag a bare <p> with UA margins. */
async function checkNegativeControl(page) {
  const badFacts = await inspect(page, BAD_DOCUMENT);
  if (badFacts.badParagraphs.length === 0) {
    fail("negative-control", ["gate did not flag a bare <p> with UA margins — the margin check is broken"]);
  } else {
    pass("negative-control", "gate correctly flags bare <p> margins");
  }
}

/** Section 13: phone settings must affect computed layout at 375px and preserve desktop. */
async function checkDeviceOverrides(page) {
  const phone = { width: 375, height: 800 };
  for (const { name, Root } of DOCUMENTS.filter((d) => d.name !== "document")) {
    const make = (overrides) => renderHtml(h(Root, { width: 600 },
      h(Row, null, h(Column, { id: "phone-column", style: { padding: 20 }, ...(overrides ? { mobile: { padding: [8, 12] } } : {}) },
        h(Image, { src: { ...IMAGE_SRC, width: 800 }, alt: "", style: { width: 120 }, ...(overrides ? { mobile: { width: "100%" } } : {}) }),
        h(Text, { id: "desktop-only", ...(overrides ? { hidden: { mobile: true } } : {}) }, "Desktop only"),
        h(Text, { id: "phone-only", ...(overrides ? { hidden: { desktop: true } } : {}) }, "Phone only")
      )),
      h(Row, { id: "hidden-row", ...(overrides ? { hidden: { mobile: true } } : {}) }, h(Column, null, h(Text, null, "Hidden row")))
    ));
    const read = () => page.evaluate(() => {
      // A column's padding: on the box with the column's id, or the first box in it that has one (an email's
      // column can be a table whose cell holds it).
      const outer = document.getElementById("phone-column");
      const column = [outer, ...outer.querySelectorAll("*")].find((el) => parseFloat(getComputedStyle(el).paddingTop) > 0) ?? outer;
      const image = document.querySelector("img");
      const css = getComputedStyle(column);
      const hidden = (id) => {
        const el = document.getElementById(id);
        return el.getBoundingClientRect().height === 0 || getComputedStyle(el).display === "none";
      };
      return {
        padding: [css.paddingTop, css.paddingRight, css.paddingBottom, css.paddingLeft],
        slot: column.getBoundingClientRect().width - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight) - parseFloat(css.borderLeftWidth) - parseFloat(css.borderRightWidth),
        image: image.getBoundingClientRect().width,
        mobileHidden: hidden("desktop-only"),
        desktopHidden: hidden("phone-only"),
        rowHidden: hidden("hidden-row"),
      };
    });
    const phoneProblems = (facts) => [
      facts.padding.join(" ") !== "8px 12px 8px 12px" && `padding ${facts.padding.join(" ")}`,
      Math.abs(facts.image - facts.slot) > 1 && `image ${facts.image}px, column slot ${facts.slot}px`,
      !facts.mobileHidden && "phone-hidden content still displays",
      facts.desktopHidden && "desktop-hidden content did not restore on phones",
      !facts.rowHidden && "phone-hidden row still displays",
    ].filter(Boolean);
    await page.setViewportSize(DESKTOP);
    await page.setContent(await make(true));
    const desktop = await read();
    const problems = [];
    if (desktop.padding.some((p) => p !== "20px")) problems.push(`desktop padding changed: ${desktop.padding}`);
    if (Math.abs(desktop.image - 120) > 1) problems.push(`desktop image changed: ${desktop.image}px`);
    if (desktop.mobileHidden || !desktop.desktopHidden || desktop.rowHidden) problems.push("desktop visibility is wrong");
    await page.setViewportSize(phone);
    problems.push(...phoneProblems(await read()));
    if (problems.length) fail(`phone-settings:${name}`, problems);
    else pass(`phone-settings:${name}`, "375px padding, full-width image and visibility; desktop unchanged");
    await page.setContent(await make(false));
    const negative = phoneProblems(await read());
    if (negative.length < 3) fail(`phone-negative-control:${name}`, ["ignoring phone settings did not fail padding, image and visibility checks"]);
    else pass(`phone-negative-control:${name}`, "without phone settings, the padding, image and visibility checks fail");
  }
  await page.setViewportSize(DESKTOP);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: DESKTOP });
  await checkDocuments(page);
  await checkResponsive(page);
  await checkNoStack(page);
  await checkDeviceOverrides(page);
  await checkRowSidePadding(page);
  await checkLockedBlock(page);
  await checkHover(page);
  await checkRtl(page);
  await checkStyleBaseline(page);
  await checkOverflow(page);
  await checkPreheader(page);
  await checkAccessibility(page);
  await checkImageSizing(page);
  await checkCssParses(page);
  await checkPrint(page);
  await checkNegativeControl(page);
} finally {
  await browser.close();
}

if (failed) {
  process.exit(1);
}
console.log("E2E_OK: all rendered documents verified in Chromium");
