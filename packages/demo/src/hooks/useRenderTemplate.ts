import { useMemo } from "react";
import { renderToHtmlParts, renderToPlainText } from "@unlayer/react-elements";
import { templateMap } from "../templates";

interface RenderResult {
  head: string;
  html: string;
  plainText: string;
  sourceCode: string;
}

export function useRenderTemplate(templateId: string): RenderResult {
  return useMemo(() => {
    const entry = templateMap[templateId];
    if (!entry) {
      return { head: "", html: "", plainText: "", sourceCode: "" };
    }

    const element = entry.component();

    let head = "";
    let html = "";
    let plainText = "";

    try {
      const parts = renderToHtmlParts(element, { mode: "email" });
      head = parts.head;
      html = parts.body;
    } catch (e) {
      html = `<!-- Render error: ${e instanceof Error ? e.message : String(e)} -->`;
    }

    try {
      plainText = renderToPlainText(element);
    } catch (e) {
      plainText = `Render error: ${e instanceof Error ? e.message : String(e)}`;
    }

    return {
      head,
      html,
      plainText,
      sourceCode: entry.sourceCode,
    };
  }, [templateId]);
}
