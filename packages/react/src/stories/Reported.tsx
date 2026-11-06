import { type CSSProperties } from "react";

/** The window each render is shown in: an email client's on a desktop, or a phone's. */
export type Width = "desktop" | "phone";

/** One thing a render reported: its severity, and what it says. */
export type Note = { severity: "error" | "warning" | "info"; text: string };

const list: CSSProperties = { paddingLeft: 20 };

/** A list of what a render reported, under a summary that says how many. */
export function Reported({ notes, summary, open }: { notes: Note[]; summary: string; open?: boolean }) {
  if (!notes.length) return null;
  return (
    <details open={open} style={{ font: "13px system-ui, sans-serif", marginTop: 16, color: open ? "#9a3412" : "#57606a" }}>
      <summary>
        {summary} ({notes.length})
      </summary>
      <ul style={list}>
        {notes.map((note, index) => (
          <li key={index}>{note.text}</li>
        ))}
      </ul>
    </details>
  );
}
