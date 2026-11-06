import { type CSSProperties } from "react";

/** The window each render is shown in: an email client's on a desktop, or a phone's. */
export type Width = "desktop" | "phone";

/** One thing a render reported: its severity, and what it says. */
export type Note = { severity: "error" | "warning" | "info"; text: string };

const list: CSSProperties = { paddingLeft: 20 };

/** What a render reported as a problem. Its info notes stay in `render()`'s diagnostics. */
export function Reported({ notes }: { notes: Note[] }) {
  const problems = notes.filter((note) => note.severity !== "info");
  if (!problems.length) return null;
  return (
    <details open style={{ font: "13px system-ui, sans-serif", marginTop: 16, color: "#9a3412" }}>
      <summary>Warnings ({problems.length})</summary>
      <ul style={list}>
        {problems.map((note, index) => (
          <li key={index}>{note.text}</li>
        ))}
      </ul>
    </details>
  );
}
