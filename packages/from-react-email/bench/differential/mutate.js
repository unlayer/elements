// Mutations for the differential test (runs in the page; plain JavaScript). Each one changes how an
// element looks, or writes the look it already has in another way, through the CSS forms the check
// reads (and misread before): selectors, conditions, values, keywords, shorthands, presentational
// attributes. Whether a mutation changes what a reader sees is decided by Chromium, never by its intent.
(({ seed, count }) => {
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = (list) => list[Math.floor(random() * list.length)];
  const css = (el) => getComputedStyle(el);
  const log = [];
  let uid = 0;
  const name = () => `m${seed % 100000}x${++uid}`;

  const withText = () =>
    [...document.body.querySelectorAll("*")].filter(
      (e) =>
        !/^(STYLE|SCRIPT|TITLE|BR|IMG|HR|TBODY|THEAD|TR|TABLE|HTML|BODY)$/.test(e.tagName) &&
        !e.closest("[data-skip-in-text]") &&
        [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) &&
        e.getBoundingClientRect().width > 0
    );
  const blocks = () => [...document.body.querySelectorAll("p, div, h1, h2, h3, td, li, a")].filter((e) => !e.closest("[data-skip-in-text]") && e.textContent.trim() && e.getBoundingClientRect().width > 0);

  // ── How a declaration is written ──────────────────────────────
  const sheet = (text) => {
    const style = document.createElement("style");
    style.textContent = text;
    (document.head || document.documentElement).appendChild(style);
  };
  /** A selector that matches `el` (or, for a few forms, may not: Chromium decides). */
  const selector = (el) => {
    const cls = name();
    el.classList.add(cls);
    const parent = el.parentElement;
    const parentClass = () => {
      const p = name();
      parent.classList.add(p);
      return p;
    };
    const forms = [
      () => `.${cls}`,
      () => `${el.tagName.toLowerCase()}.${cls}`,
      () => {
        el.id = el.id || `${cls}i`;
        return `#${el.id}`;
      },
      () => {
        el.setAttribute("data-m", cls);
        return `[data-m="${cls}"]`;
      },
      () => `.${cls}:not(.none-${cls})`,
      () => `:is(.${cls})`,
      () => `:where(.${cls})`,
      () => `.${parentClass()} > .${cls}`,
      () => `.${parentClass()} .${cls}`,
      () => `.${cls}:nth-child(${[...parent.children].indexOf(el) + 1})`,
      () => `.${cls}:nth-of-type(n)`,
      () => `.${cls}:first-child`,
      () => `.${cls}:has(*)`,
      () => `.${cls}, ::-m-bogus`,
      () => `.${cls}:hover`,
      () => `.${cls}::first-line`,
      () => `.${cls}:is(.${cls}, ::-m-bogus)`,
      () => `${el.tagName}.${cls}`,
    ];
    return pick(forms)();
  };
  const conditions = [
    (r) => r,
    (r) => r,
    (r) => `@media (min-width: 1px) { ${r} }`,
    (r) => `@media screen and (min-width: 480px) { ${r} }`,
    (r) => `@media only screen and (max-width: 600px) { ${r} }`,
    (r) => `@media (width >= 480px) { ${r} }`,
    (r) => `@media (max-device-width: 600px) { ${r} }`,
    (r) => `@media (orientation: portrait) { ${r} }`,
    (r) => `@media print { ${r} }`,
    (r) => `@media not print { ${r} }`,
    (r) => `@supports (display: block) { ${r} }`,
    (r) => `@layer m { ${r} }`,
    (r) => `<!-- ${r} -->`,
    (r) => `/* a comment */ ${r}`,
    (r) => `@media (prefers-color-scheme: dark) { ${r} }`,
  ];
  const declarations = (property, value) => [
    () => `${property}: ${value}`,
    () => `${property}: ${value} !important`,
    () => `${property.toUpperCase()}: ${value}`,
    () => `${property}: ${value}; ${property}: not-a-value`,
    () => `${property}: not-a-value; ${property}: ${value}`,
    () => {
      const v = `--${name()}`;
      return `${v}: ${value}; ${property}: var(${v})`;
    },
    () => `${property}: var(--undefined-${name()}, ${value})`,
    () => `${property}: var(--undefined-${name()})`,
    () => `${property} : /* x */ ${value} ;;`,
  ];
  /** Writes `property: value` to `el` in a random form. */
  const write = (el, property, value) => {
    if (random() < 0.3) {
      const important = random() < 0.2;
      el.style.setProperty(property, value, important ? "important" : "");
      log.push(`<${el.tagName.toLowerCase()} style="${property}: ${value}${important ? " !important" : ""}">`);
      return;
    }
    const rule = pick(conditions)(`${selector(el)} { ${pick(declarations(property, value))()} }`);
    sheet(rule);
    log.push(rule);
  };

  // ── Values far from what's there ──────────────────────────────
  const rgb = (value) => (/rgba?\(([^)]*)\)/.exec(value) || [, "0,0,0"])[1].split(/[\s,/]+/).map(Number);
  const COLORS = ["#e11d48", "#2563eb", "#16a34a", "#000000", "#ffffff", "#f59e0b", "rgb(120, 0, 200)", "hsl(200 80% 40%)", "rebeccapurple", "teal", "transparent", "currentColor"];
  const farColor = (current) => {
    const now = rgb(current);
    for (let i = 0; i < 8; i++) {
      const c = pick(COLORS);
      const probe = document.createElement("span");
      probe.style.color = c;
      document.body.appendChild(probe);
      const v = rgb(css(probe).color);
      probe.remove();
      if (Math.max(...[0, 1, 2].map((k) => Math.abs(v[k] - now[k]))) >= 16) return c;
    }
    return "#ff00ff";
  };
  const KEYWORDS = ["inherit", "initial", "unset", "revert", "revert-layer"];

  // ── Mutations ─────────────────────────────────────────────────
  const families = {
    color: (el) => write(el, "color", farColor(css(el).color)),
    size: (el) => write(el, "font-size", pick([`${Math.max(4, Math.round(parseFloat(css(el).fontSize) + pick([-6, 5, 9])))}px`, "2em", "0.6em", "150%", "x-large", "smaller", "1.5rem"])),
    weight: (el) => write(el, "font-weight", parseFloat(css(el).fontWeight) >= 600 ? pick(["400", "normal", "lighter"]) : pick(["700", "bold", "bolder", "900"])),
    italic: (el) => write(el, "font-style", css(el).fontStyle === "normal" ? pick(["italic", "oblique"]) : "normal"),
    transform: (el) => write(el, "text-transform", css(el).textTransform === "uppercase" ? "none" : pick(["uppercase", "capitalize", "lowercase"])),
    underline: (el) => write(el, pick(["text-decoration", "text-decoration-line"]), /underline/.test(css(el).textDecorationLine) ? "none" : pick(["underline", "underline dotted red", "underline overline"])),
    background: (el) => write(el, pick(["background-color", "background"]), farColor(css(el).backgroundColor === "rgba(0, 0, 0, 0)" ? "rgb(255,255,255)" : css(el).backgroundColor)),
    gradient: (el) => write(el, "background", pick(["linear-gradient(#111827, #111827)", "linear-gradient(90deg, #e11d48, #2563eb)", "linear-gradient(transparent, transparent)"])),
    hide: (el) => {
      const how = pick(["display", "visibility", "opacity", "font-size", "max-height", "hidden", "sr-only", "indent", "clip-path"]);
      if (how === "hidden") {
        el.hidden = true;
        log.push(`<${el.tagName.toLowerCase()} hidden>`);
      } else if (how === "max-height") {
        write(el, "max-height", "0");
        write(el, "overflow", "hidden");
      } else if (how === "sr-only") {
        write(el, "position", "absolute");
        write(el, "width", "1px");
        write(el, "height", "1px");
        write(el, "overflow", "hidden");
        write(el, "clip", "rect(0, 0, 0, 0)");
      } else if (how === "indent") {
        write(el, "text-indent", "-9999px");
        write(el, "overflow", "hidden");
      } else if (how === "clip-path") write(el, "clip-path", "inset(50%)");
      else write(el, how, { display: "none", visibility: "hidden", opacity: "0", "font-size": "0" }[how]);
    },
    reshow: (el) => {
      if (!el.parentElement || el.parentElement === document.body) return families.hide(el);
      write(el.parentElement, "visibility", "hidden");
      write(el, "visibility", "visible");
    },
    faint: (el) => write(el, "opacity", pick(["0.3", "40%", "0.5"])),
    keyword: (el) => {
      const property = pick(["color", "font-size", "font-weight", "font-style", "text-transform", "text-decoration-line", "visibility", "display", "background-color", "text-align"]);
      if (el.parentElement && random() < 0.5) write(el.parentElement, property, { color: "#e11d48", "font-size": "24px", "font-weight": "700", "font-style": "italic", "text-transform": "uppercase", "text-decoration-line": "underline", visibility: "hidden", display: "block", "background-color": "#2563eb", "text-align": "right" }[property]);
      write(el, property, pick(KEYWORDS));
    },
    font: (el) => write(el, "font", `${pick(["italic ", ""])}${pick(["700 ", "400 ", ""])}${pick([12, 16, 22, 30])}px/1.4 ${pick(["Arial", "Georgia, serif", "monospace"])}`),
    align: (el) => {
      const block = el.closest("p, div, td, h1, h2, h3, li") || el;
      write(block, "text-align", pick(["left", "center", "right", "start", "end", "-webkit-center", "justify"]));
    },
    place: (el) => {
      const block = el.closest("p, div, h1, h2, h3") || el;
      write(block, "width", pick(["200px", "40%", "calc(50% - 10px)", "fit-content", "max-content", "15ch"]));
      const how = pick(["margin", "float", "margin-left"]);
      if (how === "float") write(block, "float", pick(["right", "left"]));
      else if (how === "margin-left") write(block, "margin-left", "auto");
      else write(block, "margin", pick(["0 auto", "0 0 0 auto", "0 auto 0 0", "0 0 0 300px"]));
    },
    stack: () => {
      const cells = [...document.querySelectorAll("td, th")].filter((c) => c.parentElement && c.parentElement.children.length > 1 && c.textContent.trim());
      const inlineBlocks = [...document.querySelectorAll("div, span")].filter((e) => /inline-block|table-cell/.test(css(e).display) && e.textContent.trim());
      const target = pick([...cells, ...inlineBlocks]);
      if (!target) return false;
      write(target, "display", pick(["block", "flex", "table-row"]));
      write(target, "width", "100%");
    },
    attribute: (el) => {
      const cell = el.closest("td, table, div, p");
      const how = pick(["align", "bgcolor", "font", "center", "dir"]);
      if (how === "align" && cell) {
        cell.setAttribute("align", pick(["center", "right", "left"]));
        log.push(`<${cell.tagName.toLowerCase()} align="${cell.getAttribute("align")}">`);
      } else if (how === "bgcolor") {
        const t = el.closest("td, table") || el;
        t.setAttribute("bgcolor", pick(["#111827", "#fef3c7", "red"]));
        log.push(`<${t.tagName.toLowerCase()} bgcolor="${t.getAttribute("bgcolor")}">`);
      } else if (how === "font") {
        const f = document.createElement("font");
        f.setAttribute("color", pick(["#e11d48", "blue"]));
        while (el.firstChild) f.appendChild(el.firstChild);
        el.appendChild(f);
        log.push(`<font color="${f.getAttribute("color")}"> around the text of <${el.tagName.toLowerCase()}>`);
      } else if (how === "center") {
        const c = document.createElement("center");
        el.replaceWith(c);
        c.appendChild(el);
        log.push(`<center> around <${el.tagName.toLowerCase()}>`);
      } else {
        el.setAttribute("dir", "rtl");
        log.push(`<${el.tagName.toLowerCase()} dir="rtl">`);
      }
    },
    text: (el) => {
      const node = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
      const words = node.textContent.split(/(\s+)/);
      const i = words.findIndex((w) => w.trim());
      const how = pick(["drop", "add", "change"]);
      if (how === "drop" && words.filter((w) => w.trim()).length > 1) words.splice(i, 2);
      else if (how === "add") words.splice(i, 0, "Extra", " ");
      else words[i] = words[i].replace(/\p{L}/u, (c) => (c === "x" ? "y" : "x"));
      node.textContent = words.join("");
      log.push(`text "${how}" in <${el.tagName.toLowerCase()}>`);
    },
    link: () => {
      const a = pick([...document.querySelectorAll("a[href]")]);
      const img = pick([...document.querySelectorAll("img")]);
      if (a && (random() < 0.5 || !img)) {
        const how = pick(["href", "target"]);
        if (how === "href") a.setAttribute("href", a.getAttribute("href") + "?changed");
        else a.setAttribute("target", a.getAttribute("target") === "_blank" ? "_self" : "_blank");
        log.push(`<a> ${how} changed`);
      } else if (img) {
        img.setAttribute("alt", (img.getAttribute("alt") || "") + " changed");
        log.push("<img> alt changed");
      } else return false;
    },
    reorder: () => {
      const parents = [...document.querySelectorAll("td, div, body, tbody, tr")].filter((p) => p.children.length > 1);
      const p = pick(parents);
      if (!p) return false;
      const kids = [...p.children];
      const i = Math.floor(random() * (kids.length - 1));
      p.insertBefore(kids[i + 1], kids[i]);
      log.push(`swapped two children of <${p.tagName.toLowerCase()}>`);
    },
    // The look it already has, written another way: a rewrite the check must not misread.
    same: (el) => {
      const s = css(el);
      const [property, value] = pick([
        ["color", s.color],
        ["font-size", s.fontSize],
        ["font-weight", s.fontWeight],
        ["font-style", s.fontStyle],
        ["text-transform", s.textTransform],
        ["text-decoration-line", s.textDecorationLine],
        ["background-color", s.backgroundColor],
        ["text-align", s.textAlign],
        ["display", s.display],
      ]);
      write(el, property, value);
    },
  };
  const weights = { color: 3, size: 3, weight: 2, italic: 1, transform: 1, underline: 2, background: 2, gradient: 1, hide: 4, reshow: 2, faint: 1, keyword: 4, font: 2, align: 3, place: 3, stack: 2, attribute: 3, text: 1, link: 1, reorder: 1, same: 6 };
  const bag = Object.entries(weights).flatMap(([k, n]) => Array(n).fill(k));
  for (let i = 0; i < count; i++) {
    const family = pick(bag);
    const candidates = withText();
    const el = pick(candidates.length ? candidates : blocks());
    if (!el) break;
    const before = log.length;
    try {
      if (families[family](el) === false || log.length === before) families.same(el);
    } catch (error) {
      log.push(`(${family} skipped: ${error.message})`);
    }
  }
  return { log, html: `<!doctype html>\n${document.documentElement.outerHTML}` };
})
