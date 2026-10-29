/**
 * "Copy for AI": everything the preview knows about the template, as one
 * Markdown prompt to paste into an AI assistant: the source, what Elements and
 * React reported, the email client compatibility findings, and the link
 * checks, with what to do about them.
 */

import { clientFindings, linkFindings, renderingFindings } from "../../shared/findings";
import type { CompatResponse, LinksResponse, RenderResponse } from "../api";

function fence(text: string, language = ""): string {
  const ticks = text.includes("```") ? "````" : "```";
  return `${ticks}${language}\n${text}\n${ticks}`;
}

const LANGUAGE: Record<string, string> = { tsx: "tsx", jsx: "jsx", js: "js" };

export function aiPrompt(templatePath: string, result: RenderResponse, compat?: CompatResponse, links?: LinksResponse): string {
  const ext = templatePath.split(".").pop() ?? "tsx";
  const parts: string[] = [
    `I'm writing an email template with Unlayer Elements (@unlayer/react-elements: React components that render email-safe HTML; structure: Email > Row > Column > blocks such as Heading, Paragraph, Button, Image). Fix the problems below and give me the whole updated file. Keep using Elements components and props, and don't add CSS that email clients ignore.`,
    `## ${templatePath}`,
    fence(result.source ?? "", LANGUAGE[ext] ?? ""),
  ];

  // What to fix and to check, as the Checks drawer and `elements-preview check` count them (notes left out).
  const problems: string[] = [];
  if (!result.ok) {
    const where = result.error.file ? ` (${result.error.file}${result.error.line ? `:${result.error.line}:${result.error.column ?? 1}` : ""})` : "";
    problems.push(`- ${result.error.phase === "load" ? "It doesn't compile" : "It throws while rendering"}${where}: ${result.error.message}`);
  }
  const rendering = renderingFindings(result).filter((f) => f.level !== "info");
  // A render error comes first, and is written above with where it happened.
  if (!result.ok) rendering.shift();
  for (const finding of rendering) problems.push(`- ${finding.level === "error" ? "Error" : "Warning"}: ${finding.message}`);
  if (problems.length) parts.push("## Problems Elements and React report", problems.join("\n"));

  const clients = clientFindings(compat);
  if (clients.length) {
    parts.push(
      "## Email client compatibility (caniemail.com)",
      "Features this template uses that some email clients don't support. Remove them or add a fallback that still reads well where they're ignored:",
      clients
        .map((finding) => {
          const names = (finding.clients ?? []).map((c) => `${c.label}${c.support === "partial" ? " (partly)" : ""}`).join(", ");
          const where = finding.lines?.length ? ` (source lines ${finding.lines.join(", ")})` : "";
          return `- \`${finding.feature}\` in ${finding.block}${where}: not supported in ${names}`;
        })
        .join("\n")
    );
  }

  const linkProblems = linkFindings(links).filter((f) => f.level !== "info");
  if (linkProblems.length) {
    parts.push(
      "## Links and images",
      linkProblems.map((f) => `- ${f.level === "error" ? "Broken" : "Check"}: ${f.message}${f.url ? ` (${f.url})` : ""}${f.block ? ` in ${f.block}` : ""}`).join("\n")
    );
  }

  if (parts.length === 3) parts.push("The preview found no problems. Review it for email best practices: alt text, link text, readable sizes on phones, and dark mode.");
  return parts.join("\n\n");
}
