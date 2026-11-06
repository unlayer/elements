import { useMemo } from "react";
import { templateMap } from "../templates";
import { useRender } from "./useRender";

interface RenderResult {
  html: string;
  plainText: string;
  sourceCode: string;
}

export function useRenderTemplate(templateId: string): RenderResult {
  const entry = templateMap[templateId];
  const element = useMemo(() => (entry ? entry.component() : null), [entry]);
  const { html, plainText } = useRender(element);

  return { html, plainText, sourceCode: entry?.sourceCode ?? "" };
}
