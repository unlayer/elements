// Renders the site's examples with Hyper Elements itself, and copies the package's own component
// reference, into src/generated/. The site shows only what the engine really writes.
//
//   pnpm --filter @hyper-elements/website generate
//
// Writes:
//   src/generated/examples.json      every template and component example: source, HTML, plain text,
//                                    outline and diagnostics
//   src/generated/reference.md       REFERENCE.md: every component, prop and style
//   src/generated/guide.md           GUIDE.md: how a template is written
//   public/generated/                each Document as a real PDF and each Canvas as a real PNG
//
// The PDFs and PNGs need the templates' fonts as TTF files (react-pdf and Satori don't read WOFF2):
// they're fetched from Google Fonts by family and weight, once, into node_modules/.cache.
//
// The examples import `@hyper-elements/react`. Until the packages are renamed, that resolves to the
// workspace's `@unlayer/react-elements`. To use another build (a PR's checkout, say), point
// HYPER_ELEMENTS_PACKAGE at its packages/react directory; it must be built.
import { build } from "esbuild";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = join(root, ".cache");
const outDir = join(root, "src/generated");

const NEW_NAME = "@hyper-elements/react";
const CURRENT_NAME = "@unlayer/react-elements";
const override = process.env.HYPER_ELEMENTS_PACKAGE ? resolve(process.env.HYPER_ELEMENTS_PACKAGE) : null;
const siteRequire = createRequire(join(root, "package.json"));
const packageDir = override ?? dirname(siteRequire.resolve(`${CURRENT_NAME}/package.json`));

// One copy of React: the one the Elements build resolves.
const elementsRequire = createRequire(join(packageDir, "package.json"));

const resolvePlugin = {
  name: "hyper-elements",
  setup(b) {
    b.onResolve({ filter: /^@hyper-elements\/react(\/.*)?$/ }, ({ path }) => {
      // The package's main entry is built as dist/primitives; /builder, /pdf and /image as their own.
      const subpath = path.slice(NEW_NAME.length).replace(/^\//, "") || "primitives";
      return { path: join(packageDir, "dist", `${subpath}.cjs`) };
    });
    b.onResolve({ filter: /^react(-dom)?(\/.*)?$/ }, ({ path }) => ({ path: elementsRequire.resolve(path) }));
  },
};

/** The package's own names, as the site names them. */
const rename = (s) =>
  s
    .replaceAll("@unlayer/react-elements", NEW_NAME)
    .replaceAll("@unlayer/migrate", "@hyper-elements/migrate");

async function renderAll(kind) {
  const dir = join(root, "examples", kind);
  // Files starting with "_" are shared parts, not examples.
  const files = (await readdir(dir)).filter((f) => f.endsWith(".tsx") && !f.startsWith("_")).sort();
  const out = {};
  for (const file of files) {
    const slug = file.replace(/\.tsx$/, "");
    const entry = join(cacheDir, `${kind}-${slug}.entry.tsx`);
    await writeFile(
      entry,
      [
        `import Example, * as mod from ${JSON.stringify(join(dir, file))};`,
        `import { outline, render } from "${NEW_NAME}";`,
        `export const meta = mod.meta ?? {};`,
        `export const element = () => <Example />;`,
        // The root a template returns, for its fonts: the PDF and PNG are drawn in them.
        `export const rootElement = () => Example({});`,
        `export async function run() {`,
        `  const { html, text, diagnostics } = await render(<Example />);`,
        `  return { html, text, diagnostics, outline: outline(<Example />) };`,
        `}`,
      ].join("\n"),
    );
    const bundle = join(cacheDir, `${kind}-${slug}.cjs`);
    await build({
      entryPoints: [entry],
      outfile: bundle,
      bundle: true,
      platform: "node",
      format: "cjs",
      jsx: "automatic",
      logLevel: "warning",
      plugins: [resolvePlugin],
    });
    const { run, meta, element, rootElement } = createRequire(import.meta.url)(bundle);
    let result;
    try {
      result = await run();
    } catch (error) {
      throw new Error(`examples/${kind}/${file} doesn't render:\n${error.message}`);
    }
    const source = (await readFile(join(dir, file), "utf8"))
      // `meta` is for the site, not part of the example a reader copies.
      .replace(/\nexport const meta = \{[^\n]*\};\n/, "\n")
      .replace(/\nexport const meta = \{[\s\S]*?\n\};\n/, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    out[slug] = {
      slug,
      ...meta,
      source,
      html: result.html,
      text: result.text.trim(),
      outline: result.outline.trimEnd(),
      diagnostics: result.diagnostics.map(({ severity, code, message, path }) => ({ severity, code, message: rename(message), path })),
    };
    const binary = meta.root === "Document" || meta.root === "Canvas";
    if (binary && kind !== "components") {
      try {
        // The showcase's files keep the names the hero shows; a template's is named after it.
        const name = kind === "showcase" ? meta.file : `templates/${slug}.${meta.root === "Canvas" ? "png" : "pdf"}`;
        const { file, diagnostics } = await writeBinary(element(), meta.root, name, rootElement());
        out[slug].file = file;
        if (kind === "templates") {
          // What the PDF or PNG adds (a font it couldn't draw, say) is part of the template's diagnostics.
          const seen = new Set(out[slug].diagnostics.map((d) => `${d.code} ${d.path}`));
          for (const { severity, code, message, path } of diagnostics) {
            if (!seen.has(`${code} ${path}`)) out[slug].diagnostics.push({ severity, code, message: rename(message), path });
          }
        }
      } catch (error) {
        const detail = error.diagnostics?.map((d) => `${d.code} at ${d.path}: ${d.message}`).join("\n") ?? String(error.message).slice(0, 600);
        throw new Error(`examples/${kind}/${file} doesn't render to a file:\n${detail}`);
      }
    }
    console.log(`examples/${kind}/${file}: ${result.html.length} bytes of HTML, ${result.diagnostics.length} diagnostics`);
  }
  return out;
}

const fontCache = join(root, "node_modules", ".cache", "hyper-elements-fonts");
/** The weights fetched for a font given as a range ("200 800"). */
const WEIGHTS = [300, 400, 500, 600, 700, 800];

/** A Google Fonts family at one weight and style, as TTF: from the cache, else fetched into it. */
async function googleFont(family, weight, italic) {
  const file = join(fontCache, `${family.replace(/\W+/g, "-")}-${weight}${italic ? "-italic" : ""}.ttf`);
  try {
    return await readFile(file);
  } catch {}
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:ital,wght@${italic ? 1 : 0},${weight}`)).text();
  const url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
  if (!url) return null;
  const bytes = Buffer.from(await (await fetch(url)).arrayBuffer());
  await mkdir(fontCache, { recursive: true });
  await writeFile(file, bytes);
  return bytes;
}

/** The fonts a root's `fonts` prop names, as files the PDF and image engines read, after a fallback. */
async function fontsFor(rootEl) {
  const fontDir = join(dirname(elementsRequire.resolve("pdfjs-dist/package.json")), "standard_fonts");
  const fonts = [
    { family: "Liberation Sans", src: await readFile(join(fontDir, "LiberationSans-Regular.ttf")) },
    { family: "Liberation Sans", src: await readFile(join(fontDir, "LiberationSans-Bold.ttf")), weight: 700 },
  ];
  for (const f of rootEl?.props?.fonts ?? []) {
    if (!String(f.src).includes("fonts.gstatic.com")) continue;
    const [low, high] = String(f.weight ?? 400).split(/\s+/).map(Number);
    const italic = f.style === "italic";
    for (const weight of high ? WEIGHTS.filter((w) => w >= low && w <= high) : [low]) {
      const src = await googleFont(f.family, weight, italic);
      if (src) fonts.push({ family: f.family, src, weight, ...(italic ? { style: "italic" } : {}) });
    }
  }
  return fonts;
}

/**
 * A Canvas as a real PNG (@hyper-elements/react/image) or a Document as a real PDF
 * (@hyper-elements/react/pdf), into public/generated/. Their engines are the package's optional peer
 * dependencies, resolved from the package's own directory (its dev dependencies in the workspace).
 */
async function writeBinary(el, rootName, name, rootEl) {
  const mod = elementsRequire(join(packageDir, "dist", `${rootName === "Canvas" ? "image" : "pdf"}.cjs`));
  const fonts = await fontsFor(rootEl);
  // Images are given by the URL the examples use: every image the site hosts.
  const imgDir = join(root, "public", "img");
  const images = {};
  for (const f of await readdir(imgDir, { recursive: true })) {
    if (!/\.(png|jpe?g|gif|svg)$/i.test(f)) continue;
    images[`https://hyperelements.dev/img/${f.split("\\").join("/")}`] = await readFile(join(imgDir, f));
  }
  const target = join(root, "public", "generated", name);
  await mkdir(dirname(target), { recursive: true });
  const { image, pdf, diagnostics } =
    rootName === "Canvas" ? await mod.renderImage(el, { fonts, images, scale: 1 }) : await mod.renderPdf(el, { fonts, images });
  for (const d of diagnostics) console.log(`  ${rootName === "Canvas" ? "image" : "pdf"}: ${d.severity} ${d.code} ${d.message}`);
  await writeFile(target, image ?? pdf);
  return { file: `/generated/${name}`, diagnostics };
}

await mkdir(cacheDir, { recursive: true });
await mkdir(outDir, { recursive: true });
const examples = {
  showcase: await renderAll("showcase"),
  templates: await renderAll("templates"),
  components: await renderAll("components"),
};
await rm(cacheDir, { recursive: true, force: true });
await writeFile(join(outDir, "examples.json"), JSON.stringify(examples, null, 2) + "\n");

// One Markdown file per component, from the reference, for /docs/components/<slug>.
function splitReference(md) {
  const pages = [];
  let group = null;
  let intro = [];
  let current = null;
  const lines = md.split("\n");
  for (const line of lines.slice(1)) {
    const h2 = line.match(/^## (.+)$/);
    const h3 = line.match(/^### (.+)$/);
    if (h2) {
      current = null;
      group = h2[1];
      if (group === "Values") {
        current = { name: "Values", slug: "values", group: "Reference", body: [] };
        pages.push(current);
      }
      continue;
    }
    if (h3) {
      current = { name: h3[1], slug: h3[1].toLowerCase().replace(/\./g, "-"), group, body: [] };
      pages.push(current);
      continue;
    }
    if (current) current.body.push(line);
    else if (!line.startsWith("<!--")) intro.push(line);
  }
  return { intro: intro.join("\n").trim(), pages };
}

const reference = rename(await readFile(join(packageDir, "REFERENCE.md"), "utf8"));
const { intro, pages } = splitReference(reference);
const refDir = join(outDir, "reference");
await rm(refDir, { recursive: true, force: true });
await mkdir(refDir, { recursive: true });
for (const [i, page] of pages.entries()) {
  const body = page.body.join("\n").trim();
  const summary = body.split("\n\n")[0].replace(/\s+/g, " ").trim();
  await writeFile(
    join(refDir, `${page.slug}.md`),
    `---\n${JSON.stringify({ title: page.name, group: page.group, order: i, summary }, null, 2).slice(2, -2).replace(/^  /gm, "").replace(/,$/gm, "")}\n---\n\n${body}\n`,
  );
}
await writeFile(
  join(refDir, "overview.md"),
  `---\ntitle: "Components"\ngroup: "Overview"\norder: -1\nsummary: "Every component, what it holds, and every prop and style it takes."\n---\n\n${intro.replace("[GUIDE.md](./GUIDE.md)", "[Templates and roots](/docs/templates)")}\n`,
);

for (const [from, to] of [
  ["REFERENCE.md", "reference.md"],
  ["GUIDE.md", "guide.md"],
]) {
  const text = await readFile(join(packageDir, from), "utf8").catch(() => null);
  if (text === null) throw new Error(`${from} isn't in ${packageDir}: render with a build of the new engine (HYPER_ELEMENTS_PACKAGE)`);
  await writeFile(join(outDir, to), rename(text));
}
console.log(`wrote src/generated/`);
