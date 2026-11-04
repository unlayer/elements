import type { StoryObj } from "@storybook/react-vite";
import { useLayoutEffect, useRef, useState, type ReactElement } from "react";
import { render, type RenderResult } from "../primitives/index";

/** The window each render is shown in: an email client's on a desktop, or a phone's. */
export type Width = "desktop" | "phone";
const WIDTHS: Record<Width, number> = { desktop: 760, phone: 375 };
const GAP = 16;

export interface SideBySideProps {
  /** The two documents, and what each frame shows. */
  frames: [{ label: string; html: string }, { label: string; html: string }];
  /** What the renders reported (warnings and notes). */
  notes: string[];
  width: Width;
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

/** Two renders of a template, in windows of one width. */
export function SideBySide({ frames, notes, width }: SideBySideProps) {
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
    <div ref={box}>
      <div style={{ display: "flex", gap: GAP, alignItems: "flex-start" }}>
        {frames.map((frame) => (
          <Frame key={frame.label} label={frame.label} html={frame.html} width={window} scale={scale} />
        ))}
      </div>
      {notes.length > 0 && (
        <details style={{ font: "13px system-ui, sans-serif", marginTop: 16 }}>
          <summary>What the render reported ({notes.length})</summary>
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

export type Args = { width: Width };

export const args: Args = { width: "desktop" };
export const argTypes = { width: { control: "inline-radio", options: ["desktop", "phone"] } } as const;

const noted = (result: RenderResult) => result.diagnostics.map((d) => `${d.code} at ${d.path}: ${d.message}`);

/** A story of two templates, each rendered with render(), side by side. */
export const sideBySide = (left: { label: string; template: ReactElement }, right: { label: string; template: ReactElement }): StoryObj<Args> => ({
  loaders: [
    async () => {
      const [first, second] = await Promise.all([render(left.template), render(right.template)]);
      return { first: first.html, second: second.html, notes: [...noted(first), ...noted(second)] };
    },
  ],
  render: ({ width }, { loaded }) => (
    <SideBySide
      frames={[
        { label: left.label, html: loaded.first },
        { label: right.label, html: loaded.second },
      ]}
      notes={loaded.notes}
      width={width}
    />
  ),
});
