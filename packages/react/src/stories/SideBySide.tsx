import type { StoryObj } from "@storybook/react-vite";
import { Fragment, isValidElement, useLayoutEffect, useRef, useState, type ReactElement } from "react";
import { Email, Page, render, type RenderResult } from "../primitives/index";
import { LiveEditor } from "./LiveEditor";
import { Reported, type Note, type Width } from "./Reported";

export type { Note, Width };

export const WIDTHS: Record<Width, number> = { desktop: 760, phone: 375 };
export const GAP = 16;

export interface SideBySideProps {
  /** The documents, and what each frame shows. */
  frames: Array<{ label: string; html: string }>;
  /** What the renders reported: warnings, and notes on what some clients draw differently. */
  notes: Note[];
  width: Width;
  /** The window's width in px, where it isn't an email client's for `width` (a browser's for a page, an image's own). */
  size?: number;
}

/**
 * One render, in a frame of its own: its stylesheet stays its own, and its phone styles answer the
 * frame's width. The frame keeps that width inside, and is drawn smaller (`scale`) where two don't fit.
 */
export function Frame({ label, html, width, scale }: { label: string; html: string; width: number; scale: number }) {
  // Starts short, then takes its content's height once it has loaded.
  const [height, setHeight] = useState(200);
  return (
    <figure style={{ margin: 0, width: width * scale }}>
      <figcaption style={{ font: "600 13px system-ui, sans-serif", marginBottom: 8 }}>{label}</figcaption>
      <div style={{ height: height * scale, overflow: "hidden", outline: "1px solid #d0d7de" }}>
        <iframe
          title={`${label}: ${(html.length / 1024).toFixed(1)} KB of HTML`}
          srcDoc={html}
          width={width}
          height={height}
          style={{ display: "block", border: 0, transform: `scale(${scale})`, transformOrigin: "0 0" }}
          onLoad={(event) => setHeight(event.currentTarget.contentDocument?.documentElement.scrollHeight ?? 200)}
        />
      </div>
    </figure>
  );
}

/** Two renders of a template, in windows of one width. */
export function SideBySide({ frames, notes, width, size }: SideBySideProps) {
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(Infinity);
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setRoom(element.clientWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const window = size ?? WIDTHS[width];
  const scale = Math.min(1, (room - GAP * (frames.length - 1)) / (frames.length * window));

  return (
    <div ref={box}>
      <div style={{ display: "flex", gap: GAP, alignItems: "flex-start" }}>
        {frames.map((frame) => (
          <Frame key={frame.label} label={frame.label} html={frame.html} width={window} scale={scale} />
        ))}
      </div>
      {/* Warnings and errors are problems, shown open; info notes say what some email clients draw differently. */}
      <Reported notes={notes.filter((note) => note.severity !== "info")} summary="Warnings" open />
      <Reported notes={notes.filter((note) => note.severity === "info")} summary="Notes: what some clients draw differently" />
    </div>
  );
}

export type Args = { width: Width };

export const args: Args = { width: "desktop" };
export const argTypes = { width: { control: "inline-radio", options: ["desktop", "phone"] } } as const;

export const noted = (result: RenderResult): Note[] => result.diagnostics.map((d) => ({ severity: d.severity, text: `${d.code} at ${d.path}: ${d.message}` }));

/** A story of two templates, each rendered with render(), side by side. */
export const sideBySide = (left: { label: string; template: ReactElement }, right: { label: string; template: ReactElement }): StoryObj<Args> => ({
  loaders: [
    async () => {
      const [first, second] = await Promise.all([render(left.template), render(right.template)]);
      return { first: first.html, second: second.html, notes: [...noted(first), ...noted(second)] };
    },
  ],
  render: ({ width }, { loaded }) => (
    <>
      <SideBySide
        frames={[
          { label: left.label, html: loaded.first },
          { label: right.label, html: loaded.second },
        ]}
        notes={loaded.notes}
        width={width}
      />
      <LiveEditor template={left.template} width={width} />
    </>
  ),
});

const isElement = (value: unknown): value is ReactElement => isValidElement(value);
const literal = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(literal).join(", ")}]`;
  if (value && typeof value === "object") return `{ ${Object.entries(value).map(([key, v]) => `${/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)}: ${literal(v)}`).join(", ")} }`;
  return JSON.stringify(value);
};
const nameOf = (type: ReactElement["type"]) => (typeof type === "string" ? type : ((type as { displayName?: string; name?: string }).displayName ?? (type as { name?: string }).name ?? "Fragment"));

/** A template as the JSX an author writes, for a story's "Show code". */
function jsx(node: unknown, indent: string, names: Set<string>): string[] {
  if (Array.isArray(node)) return node.flatMap((child) => jsx(child, indent, names));
  if (node === null || node === undefined || typeof node === "boolean") return [];
  if (!isElement(node)) return [`${indent}${String(node)}`];
  const { children, ...props } = node.props as Record<string, unknown>;
  const name = nameOf(node.type);
  if (name === "Fragment" || node.type === Fragment) return jsx(children, indent, names);
  names.add(name);
  const attributes = Object.entries(props)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => (typeof value === "string" ? ` ${key}=${JSON.stringify(value)}` : value === true ? ` ${key}` : ` ${key}={${literal(value)}}`))
    .join("");
  const inside = jsx(children, `${indent}  `, names);
  if (!inside.length) return [`${indent}<${name}${attributes} />`];
  const text = inside.map((line) => line.trim());
  if (text.join(" ").length + indent.length + name.length * 2 + attributes.length < 96 && !text.some((line) => line.startsWith("<"))) return [`${indent}<${name}${attributes}>${text.join(" ")}</${name}>`];
  return [`${indent}<${name}${attributes}>`, ...inside, `${indent}</${name}>`];
}

/** What "Show code" has for a template: its imports and its JSX. */
export const code = (template: ReactElement) => {
  const names = new Set<string>();
  const lines = jsx(template, "  ", names);
  return `import { ${[...names].sort().join(", ")} } from "@unlayer/react-elements";\n\nconst template = (\n${lines.join("\n")}\n);`;
};

/** A story of one template, with its code. */
export const showing = (label: string, template: ReactElement): StoryObj<Args> => ({
  parameters: { docs: { source: { code: code(template), language: "tsx" } } },
  loaders: [
    async () => {
      const result = await render(template);
      return { html: result.html, notes: noted(result) };
    },
  ],
  render: ({ width }, { loaded }) => (
    <>
      <SideBySide frames={[{ label, html: loaded.html }]} notes={loaded.notes} width={width} />
      <LiveEditor template={template} width={width} />
    </>
  ),
});

/** A story of one template drawn as an Email and as a Page, with its code. */
export const asEmailAndPage = (template: (Root: typeof Email) => ReactElement): StoryObj<Args> => ({
  ...sideBySide({ label: "Email", template: template(Email) }, { label: "Page", template: template(Page as typeof Email) }),
  parameters: { docs: { source: { code: code(template(Email)), language: "tsx" } } },
});

/** A Page in a browser's window: 1280 wide on a desktop, 390 on a phone. */
export const browsed = (template: ReactElement): StoryObj<Args> => ({
  parameters: { docs: { source: { code: code(template), language: "tsx" } } },
  loaders: [
    async () => {
      const result = await render(template);
      return { html: result.html, notes: noted(result) };
    },
  ],
  render: ({ width }, { loaded }) => (
    <>
      <SideBySide frames={[{ label: "Page", html: loaded.html }]} notes={loaded.notes} width={width} size={width === "phone" ? 390 : 1280} />
      <LiveEditor template={template} width={width} />
    </>
  ),
});

/** A Canvas's HTML at its own size (drawn smaller where it doesn't fit), as @unlayer/elements-image writes it as a PNG. */
export const drawn = (template: ReactElement, size: number): StoryObj<Args> => ({
  argTypes: { width: { table: { disable: true } } },
  parameters: { docs: { source: { code: code(template), language: "tsx" } } },
  loaders: [
    async () => {
      const result = await render(template);
      return { html: result.html, notes: noted(result) };
    },
  ],
  render: (_, { loaded }) => <SideBySide frames={[{ label: "Canvas", html: loaded.html }]} notes={loaded.notes} width="desktop" size={size} />,
});

/** A Document's print HTML in a frame as tall as its pages. */
export const printed = (template: ReactElement): StoryObj<Args> => ({
  argTypes: { width: { table: { disable: true } } },
  parameters: { docs: { source: { code: code(template), language: "tsx" } } },
  loaders: [async () => ({ html: (await render(template)).html })],
  render: (_, { loaded }) => (
    <>
      <iframe
        title="Print HTML"
        srcDoc={loaded.html as string}
        style={{ width: "100%", height: 2400, border: 0 }}
        onLoad={(event) => {
          const frame = event.currentTarget;
          frame.style.height = `${frame.contentDocument?.documentElement.scrollHeight ?? 2400}px`;
        }}
      />
      <LiveEditor template={template} width="desktop" />
    </>
  ),
});
