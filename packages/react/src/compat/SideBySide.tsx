import type { StoryObj } from "@storybook/react-vite";
import { useLayoutEffect, useRef, useState, type ReactElement } from "react";
import { Email, Page, render } from "../primitives/index";
import { renderToHtml } from "../utils/render-to-html";

/**
 * The window each render is shown in: an email client's on a desktop, or a phone's. The desktop one has room for
 * main's Row padding, which main puts outside the content (up to 56px a side in these examples).
 */
export type Width = "desktop" | "phone";
const WIDTHS: Record<Width, number> = { desktop: 760, phone: 375 };
const GAP = 16;

export interface SideBySideProps {
  /** The design written with today's components, as main renders it. */
  main: string;
  /** The same design written with the new components, as the new engine renders it. */
  next: string;
  /** What the new engine's render() reported (warnings and notes). */
  notes: string[];
  width: Width;
  /** Where main draws something other than what its template asks, and whether the new engine draws it as main does. */
  quirks?: { what: string; drawn: boolean };
  /** How many px across and up or down the design's content may sit from main's, where main's depends on the font (the check reads it). */
  allowance?: { x?: number; y?: number };
  /** What each frame shows (main's, then the new engine's, by default). */
  labels?: [string, string];
}

/**
 * One render, in a frame of its own: its stylesheet stays its own, and its phone styles answer the
 * frame's width. The frame keeps that width inside, and is drawn smaller (`scale`) where two don't fit.
 */
function Frame({ label, html, width, scale }: { label: string; html: string; width: number; scale: number }) {
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

/** main's render next to the new engine's, in windows of one width. */
export function SideBySide({ main, next, notes, width, quirks, allowance, labels = ["main: today's components", "New engine: /primitives"] }: SideBySideProps) {
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(Infinity);
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setRoom(element.clientWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const window = WIDTHS[width];
  const scale = Math.min(1, (room - GAP) / (2 * window));

  return (
    <div ref={box} data-allowance-x={allowance?.x} data-allowance-y={allowance?.y}>
      {quirks && (
        <p style={{ font: "13px system-ui, sans-serif", margin: "0 0 12px" }}>
          {quirks.drawn ? "The new engine draws main's quirk here: " : "Main differs: "}
          {quirks.what}
        </p>
      )}
      <div style={{ display: "flex", gap: GAP, alignItems: "flex-start" }}>
        <Frame label={labels[0]} html={main} width={window} scale={scale} />
        <Frame label={labels[1]} html={next} width={window} scale={scale} />
      </div>
      {notes.length > 0 && (
        <details style={{ font: "13px system-ui, sans-serif", marginTop: 16 }}>
          <summary>What the new engine&apos;s render() reported ({notes.length})</summary>
          <ul style={{ paddingLeft: 20 }}>
            {notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/*
 * Storybook stories drawing a design both ways, side by side. The comparison gate (scripts/storybook-compare.mjs)
 * checks the two draw the same.
 */

export type Args = { width: Width; quirks: boolean };

export const args: Args = { width: "desktop", quirks: false };
export const argTypes = {
  width: { control: "inline-radio", options: ["desktop", "phone"] },
  quirks: { control: "boolean", name: "Draw main's quirks", description: "Where main draws something other than what its template asks, the new engine draws it as main does." },
} as const;

/** A design: main's template, the new one, and where main differs from what its template asks, the new one drawn as main does it. */
export interface Design {
  main: ReactElement;
  next: ReactElement;
  nextAsMain?: ReactElement;
  quirks?: string;
  /** How many px across and up or down its content may sit from main's (a menu's spaces and line height, which main leaves to the font). */
  allowance?: { x?: number; y?: number };
}

/** A story rendering a design both ways: main's template as today's components render it, the new one with render(). */
export const compare = (design: Design): StoryObj<Args> => ({
  loaders: [
    async ({ args }) => {
      const next = await render(args.quirks && design.nextAsMain ? design.nextAsMain : design.next);
      return { main: renderToHtml(design.main), next: next.html, notes: next.diagnostics.map((d) => `${d.code} at ${d.path}: ${d.message}`) };
    },
  ],
  render: ({ width, quirks }, { loaded }) => (
    <SideBySide
      main={loaded.main}
      next={loaded.next}
      notes={loaded.notes}
      width={width}
      quirks={design.quirks ? { what: design.quirks, drawn: quirks } : undefined}
      allowance={design.allowance}
    />
  ),
});


/**
 * A template drawn as a Page and as an Email (`Root` is each), side by side: the two outputs' markup differs (flexbox
 * and CSS grid, tables and inline-blocks), and the comparison gate checks they draw the same.
 */
export const outputs = (template: (Root: typeof Page) => ReactElement, allowance?: Design["allowance"]): StoryObj<Args> => ({
  loaders: [
    async () => {
      const [page, email] = await Promise.all([render(template(Page)), render(template(Email as unknown as typeof Page))]);
      return { main: page.html, next: email.html, notes: email.diagnostics.map((d) => `${d.code} at ${d.path}: ${d.message}`) };
    },
  ],
  render: ({ width }, { loaded }) => <SideBySide main={loaded.main} next={loaded.next} notes={loaded.notes} width={width} allowance={allowance} labels={["Page", "Email"]} />,
});
