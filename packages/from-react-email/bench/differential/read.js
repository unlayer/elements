// What a reader sees, read from Chromium (runs in the page; plain JavaScript, no bundler helpers).
// Each word: its text as written (before text-transform), whether it shows, and its style; the
// links and images a reader gets. The differential test compares two readings (see oracle.ts).
(() => {
  const css = (el) => getComputedStyle(el);
  const rgba = (value) => {
    const m = /rgba?\(([^)]*)\)/.exec(value || "");
    if (!m) return null;
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  };
  const over = (top, bottom) => {
    const a = top[3] + bottom[3] * (1 - top[3]);
    if (!a) return [0, 0, 0, 0];
    return [0, 1, 2].map((i) => (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / a).concat(a);
  };
  const inline = (el) => /^(inline|contents)$/.test(css(el).display);
  /** Decorations reach in-flow descendants, but not across a float, a positioned box or an inline-block. */
  const underlined = (el) => {
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const s = css(e);
      if (/underline/.test(s.textDecorationLine)) return true;
      if (s.float !== "none" || /^(absolute|fixed)$/.test(s.position) || /^inline-(block|table|flex|grid)$/.test(s.display)) return false;
    }
    return false;
  };
  /** The color behind the text: backgrounds composited up to the canvas; "image" when one has an image. */
  const background = (el) => {
    const layers = [];
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const s = css(e);
      if (s.backgroundImage && s.backgroundImage !== "none") return "image";
      const c = rgba(s.backgroundColor);
      if (c && c[3] > 0) layers.push(c);
      if (c && c[3] >= 1) break;
    }
    let color = [255, 255, 255, 1];
    for (let i = layers.length - 1; i >= 0; i--) color = over(layers[i], color);
    return color;
  };
  const opacity = (el) => {
    let o = 1;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= parseFloat(css(e).opacity);
    return o;
  };
  /** A range shows when part of it is inside every box that clips it, and nothing hides it. */
  const shows = (range, el) => {
    const s = css(el);
    if (s.visibility !== "visible" || parseFloat(s.fontSize) === 0 || opacity(el) === 0) return false;
    const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
    if (!rects.length) return false;
    return rects.some((r) => {
      let box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      for (let e = el; e && e.nodeType === 1 && e !== document.documentElement; e = e.parentElement) {
        const c = css(e);
        const clips = c.overflowX !== "visible" || c.overflowY !== "visible" || (/^(absolute|fixed)$/.test(c.position) && /rect\(/.test(c.clip)) || (c.clipPath && c.clipPath !== "none");
        if (!clips) continue;
        const b = e.getBoundingClientRect();
        const cut = (r) => (box = { left: Math.max(box.left, r.left), top: Math.max(box.top, r.top), right: Math.min(box.right, r.right), bottom: Math.min(box.bottom, r.bottom) });
        if (c.overflowX !== "visible" || c.overflowY !== "visible") {
          const bl = parseFloat(c.borderLeftWidth), bt = parseFloat(c.borderTopWidth);
          cut({ left: b.left + bl, top: b.top + bt, right: b.left + bl + e.clientWidth, bottom: b.top + bt + e.clientHeight });
        }
        // clip: rect(top, right, bottom, left), from the border box's corner.
        const rect = /rect\(([^)]*)\)/.exec(/^(absolute|fixed)$/.test(c.position) ? c.clip : "");
        if (rect) {
          const [t, r, bo, l] = rect[1].split(/[\s,]+/).map((v) => (v === "auto" ? NaN : parseFloat(v)));
          cut({ left: b.left + (isNaN(l) ? -1e6 : l), top: b.top + (isNaN(t) ? -1e6 : t), right: isNaN(r) ? 1e6 : b.left + r, bottom: isNaN(bo) ? 1e6 : b.top + bo });
        }
        const inset = /inset\(\s*([\d.]+)%/.exec(c.clipPath || "");
        if (inset && parseFloat(inset[1]) >= 50) return false;
        // A box a pixel or two wide shows nothing a reader can read.
        if (box.right - box.left < 2 || box.bottom - box.top < 2) return false;
      }
      // Past the page's left or top edge: no one can scroll there.
      return box.right > 0 && box.bottom > 0;
    });
  };
  /** The block a word's line belongs to (the nearest box that isn't inline). */
  const blocks = new Map();
  const blockOf = (el) => {
    let block = el;
    while (block && block.nodeType === 1 && inline(block)) block = block.parentElement;
    if (!blocks.has(block)) blocks.set(block, blocks.size);
    return blocks.get(block);
  };
  /** Unused: where a line would line up by its box's alignment (kept for reference). */
  const anchor = (el) => {
    let block = el;
    while (block && block.nodeType === 1 && inline(block)) block = block.parentElement;
    const s = css(block);
    const b = block.getBoundingClientRect();
    const left = b.left + parseFloat(s.borderLeftWidth) + parseFloat(s.paddingLeft);
    const right = b.right - parseFloat(s.borderRightWidth) - parseFloat(s.paddingRight);
    const rtl = s.direction === "rtl";
    const a = s.textAlign;
    const side = /center/.test(a) ? "center" : a === "right" || (a === "end" && !rtl) || (a === "start" && rtl) ? "right" : "left";
    return { x: side === "center" ? (left + right) / 2 : side === "right" ? right : left, side };
  };

  // Words as the check reads them: joined across inline elements, split at spaces, blocks, <br>, <img> and <hr>.
  const words = [];
  let current = null;
  const flush = () => {
    if (current) words.push(current);
    current = null;
  };
  const visit = (node, preview) => {
    if (node.nodeType === 1) {
      const tag = node.tagName;
      if (/^(STYLE|SCRIPT|TEMPLATE|NOSCRIPT|TITLE|HEAD)$/.test(tag)) return;
      const isPreview = preview || node.hasAttribute("data-skip-in-text");
      const s = css(node);
      if (s.display === "none" && !isPreview) return;
      if (/^(BR|IMG|HR)$/.test(tag)) return flush();
      const block = !/^(inline|contents)$/.test(s.display);
      if (block) flush();
      for (const child of node.childNodes) visit(child, isPreview);
      if (block) flush();
      return;
    }
    if (node.nodeType !== 3) return;
    const el = node.parentElement;
    const text = node.data;
    const re = /(\s+)|(\S+)/g;
    for (let m = re.exec(text); m; m = re.exec(text)) {
      if (m[1]) {
        flush();
        continue;
      }
      const range = document.createRange();
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[2].length);
      if (!current) {
        const s = css(el);
        const color = rgba(s.color) || [0, 0, 0, 1];
        const link = el.closest("a[href]");
        current = {
          w: "",
          preview,
          visible: !preview && shows(range, el),
          size: parseFloat(s.fontSize),
          weight: parseFloat(s.fontWeight),
          italic: s.fontStyle !== "normal",
          transform: s.textTransform,
          underline: underlined(el),
          color: [color[0], color[1], color[2], color[3] * opacity(el)],
          background: background(el),
          target: link ? (link.getAttribute("target") || "_self").toLowerCase() : null,
          block: blockOf(el),
          rects: [],
        };
      } else if (!preview && !current.visible && shows(range, el)) current.visible = true;
      for (const r of range.getClientRects()) if (r.width > 0 && r.height > 0) current.rects.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
      current.w += m[2];
    }
  };
  visit(document.body, false);
  flush();
  // Where each word's line sits on screen: the left and right edges of the words on it (same block, same row).
  const lines = new Map();
  for (const w of words) {
    const r = w.rects[0];
    if (!r) continue;
    const key = `${w.block}:${Math.round((r.top + r.bottom) / 2 / 4)}`;
    const line = lines.get(key) || { left: Infinity, right: -Infinity };
    for (const x of w.rects) {
      line.left = Math.min(line.left, x.left);
      line.right = Math.max(line.right, x.right);
    }
    lines.set(key, line);
    w.line = key;
  }
  for (const w of words) {
    w.line = w.line ? lines.get(w.line) : null;
    delete w.rects;
    delete w.block;
  }

  const visibleElement = (el) => {
    if (el.closest("[data-skip-in-text]")) return false;
    const r = document.createRange();
    r.selectNode(el);
    return shows(r, el);
  };
  const links = [...document.querySelectorAll("a[href]")].filter(visibleElement).map((a) => a.getAttribute("href"));
  const images = [...document.querySelectorAll("img")].filter(visibleElement).flatMap((img) => [`src ${img.getAttribute("src") || ""}`, ...(img.getAttribute("alt") ? [`alt ${img.getAttribute("alt")}`] : [])]);
  return { words, links, images };
})()
