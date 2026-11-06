// The site's few interactions: copy buttons, output tabs, fitting previews, the mobile menu,
// reveal-on-scroll and the hero's rotating word. No framework.

async function copyText(text: string, el: HTMLElement) {
  try {
    await navigator.clipboard.writeText(text);
    el.dataset.copied = "";
    const label = el.matches(".copy-btn") ? el.textContent : null;
    if (label !== null) el.textContent = "Copied";
    setTimeout(() => {
      delete el.dataset.copied;
      if (label !== null) el.textContent = label;
    }, 1600);
  } catch {
    /* clipboard blocked: the text is still selectable */
  }
}

document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const copy = target.closest<HTMLElement>("[data-copy]");
  if (copy) return copyText(copy.dataset.copy ?? "", copy);
  const code = target.closest<HTMLElement>("[data-copy-code]");
  if (code) {
    const pre = code.closest(".code-block")?.querySelector("pre");
    if (pre) copyText(pre.textContent ?? "", code);
    return;
  }
  const page = target.closest<HTMLElement>("[data-copy-page]");
  if (page) {
    const md = document.getElementById("page-markdown")?.textContent ?? "";
    copyText(md, page);
  }
});

// Mobile menu.
const toggle = document.querySelector<HTMLButtonElement>(".menu-toggle");
const nav = document.getElementById("main-nav");
toggle?.addEventListener("click", () => {
  const open = nav?.classList.toggle("open") ?? false;
  toggle.setAttribute("aria-expanded", String(open));
});

// A desktop view is drawn at its own width and scaled to fit its panel, so it's the desktop layout at any size.
function fit(view: HTMLElement) {
  if (view.hidden || !view.offsetWidth) return;
  const width = Number(view.dataset.fit);
  const scaler = view.querySelector<HTMLElement>(".scaler");
  const frame = view.querySelector<HTMLIFrameElement>("iframe");
  if (!scaler || !frame) return;
  const scale = Math.min(1, view.clientWidth / width);
  scaler.style.transform = `scale(${scale})`;
  frame.width = String(width);
  frame.height = String(Math.ceil(view.clientHeight / scale));
}
const fitAll = () => document.querySelectorAll<HTMLElement>("[data-fit]").forEach(fit);
window.addEventListener("resize", fitAll);
document.querySelectorAll<HTMLElement>("[data-fit] iframe").forEach((f) => f.addEventListener("load", fitAll));
fitAll();

// Output tabs.
document.querySelectorAll<HTMLElement>("[data-preview]").forEach((preview) => {
  const tabs = [...preview.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const views = [...preview.querySelectorAll<HTMLElement>(".view")];
  const select = (tab: HTMLButtonElement) => {
    tabs.forEach((t) => {
      t.setAttribute("aria-selected", String(t === tab));
      t.tabIndex = t === tab ? 0 : -1;
    });
    views.forEach((v) => (v.hidden = v.dataset.view !== tab.dataset.view));
    // The page can lay itself out for the view shown (a template page widens the preview for its PDF).
    preview.dataset.active = tab.dataset.view ?? "";
    const shown = views.find((v) => !v.hidden);
    const lazy = shown?.querySelector<HTMLIFrameElement>("iframe[data-srcdoc]");
    if (lazy) {
      lazy.srcdoc = lazy.dataset.srcdoc ?? "";
      lazy.removeAttribute("data-srcdoc");
    }
    if (shown?.dataset.fit) fit(shown);
  };
  tabs.forEach((tab, i) => {
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const next = tabs[(i + d + tabs.length) % tabs.length];
      next.focus();
      select(next);
    });
  });
});

// Reveal sections as they scroll in.
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      }),
    { rootMargin: "0px 0px -8% 0px" },
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("in"));
}

// The hero's rotating word.
const rotator = document.querySelector<HTMLElement>("[data-rotate]");
if (rotator && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const words = (rotator.dataset.rotate ?? "").split("|");
  let i = 0;
  setInterval(() => {
    i = (i + 1) % words.length;
    rotator.classList.add("out");
    setTimeout(() => {
      rotator.textContent = words[i];
      rotator.classList.remove("out");
    }, 260);
  }, 2400);
}

// Markdown code blocks in the docs get the same copy button as the rest of the site.
document.querySelectorAll<HTMLPreElement>(".prose > pre").forEach((pre) => {
  const wrap = document.createElement("div");
  wrap.className = "code-block floating md-code";
  pre.replaceWith(wrap);
  wrap.append(pre);
  const btn = document.createElement("button");
  btn.className = "copy-btn";
  btn.type = "button";
  btn.dataset.copyCode = "";
  btn.textContent = "Copy";
  wrap.prepend(btn);
});

// Theme toggle: light ⇄ dark, remembered. Without a choice, the page follows the system.
const root = document.documentElement;
document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
  const next = root.dataset.theme === "light" ? "dark" : "light";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {}
});
matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
  let picked: string | null = null;
  try {
    picked = localStorage.getItem("theme");
  } catch {}
  if (!picked) root.dataset.theme = e.matches ? "light" : "dark";
});

// ⌘K search over the docs and components (/search.json, loaded on first open).
const dialog = document.querySelector<HTMLDialogElement>("[data-search]");
const input = document.querySelector<HTMLInputElement>("[data-search-input]");
const list = document.querySelector<HTMLUListElement>("[data-search-results]");
let index: { title: string; sub: string; href: string }[] | null = null;
let selected = 0;
const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
function results(q: string) {
  if (!index) return [];
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return index.filter((i) => !i.href.includes("#")).slice(0, 8);
  return index
    .map((i) => {
      const t = i.title.toLowerCase();
      const all = `${t} ${i.sub.toLowerCase()}`;
      if (!terms.every((w) => all.includes(w))) return null;
      const score = (t.startsWith(terms[0]) ? 0 : t.includes(terms[0]) ? 1 : 2) + (i.href.includes("#") ? 0.5 : 0);
      return { i, score };
    })
    .filter((x): x is { i: (typeof index)[number]; score: number } => x !== null)
    .sort((a, b) => a.score - b.score)
    .slice(0, 12)
    .map((x) => x.i);
}
function draw() {
  if (!list || !input) return;
  const found = results(input.value);
  selected = Math.min(selected, Math.max(found.length - 1, 0));
  list.innerHTML = found.length
    ? found.map((r, n) => `<li><a href="${r.href}" aria-selected="${n === selected}"><span class="r-title">${escapeHtml(r.title)}</span><span class="r-sub">${escapeHtml(r.sub)}</span></a></li>`).join("")
    : `<li class="search-empty">Nothing found for “${escapeHtml(input.value)}”.</li>`;
}
async function openSearch() {
  if (!dialog || !input) return;
  dialog.showModal();
  input.value = "";
  selected = 0;
  if (!index) {
    try {
      index = await (await fetch("/search.json")).json();
    } catch {
      index = [];
    }
  }
  draw();
  input.focus();
}
document.querySelectorAll("[data-search-open]").forEach((b) => b.addEventListener("click", openSearch));
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    dialog?.open ? dialog.close() : openSearch();
  } else if (e.key === "/" && !dialog?.open && !(e.target as HTMLElement).closest("input, textarea")) {
    e.preventDefault();
    openSearch();
  }
});
input?.addEventListener("input", () => ((selected = 0), draw()));
input?.addEventListener("keydown", (e) => {
  const links = [...(list?.querySelectorAll("a") ?? [])];
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    selected = (selected + (e.key === "ArrowDown" ? 1 : -1) + links.length) % Math.max(links.length, 1);
    draw();
    list?.querySelectorAll("a")[selected]?.scrollIntoView({ block: "nearest" });
  } else if (e.key === "Enter" && links[selected]) {
    location.href = links[selected].getAttribute("href")!;
  }
});
dialog?.addEventListener("click", (e) => e.target === dialog && dialog.close());
