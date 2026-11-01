import { useLayoutEffect, useRef, useState } from "react";

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
export function SideBySide({ main, next, notes, width, quirks }: SideBySideProps) {
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
      {quirks && (
        <p style={{ font: "13px system-ui, sans-serif", margin: "0 0 12px" }}>
          {quirks.drawn ? "The new engine draws main's quirk here: " : "Main differs: "}
          {quirks.what}
        </p>
      )}
      <div style={{ display: "flex", gap: GAP, alignItems: "flex-start" }}>
        <Frame label="main: today's components" html={main} width={window} scale={scale} />
        <Frame label="New engine: /primitives" html={next} width={window} scale={scale} />
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
