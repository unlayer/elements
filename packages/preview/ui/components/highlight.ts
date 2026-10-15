import Prism from "prismjs";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-json";

export type CodeLanguage = "html" | "tsx" | "jsx" | "js" | "json" | "text";

const GRAMMARS: Record<Exclude<CodeLanguage, "text">, string> = { html: "markup", tsx: "tsx", jsx: "jsx", js: "javascript", json: "json" };

// Past this size highlighting slows the page more than it helps.
const MAX_HIGHLIGHT = 400_000;

function escape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** The code as HTML with Prism's token spans (escaped either way). */
export function highlight(code: string, language: CodeLanguage): string {
  if (language === "text" || code.length > MAX_HIGHLIGHT) return escape(code);
  const grammar = Prism.languages[GRAMMARS[language]];
  return grammar ? Prism.highlight(code, grammar, GRAMMARS[language]) : escape(code);
}

/** The language of a template file, by its extension. */
export function sourceLanguage(path: string): CodeLanguage {
  const ext = path.split(".").pop();
  return ext === "tsx" ? "tsx" : ext === "jsx" ? "jsx" : "js";
}
