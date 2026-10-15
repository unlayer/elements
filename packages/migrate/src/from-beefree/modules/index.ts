/** Each Beefree module type's conversion (`mailup-bee-newsletter-modules-<kind>`). */
import type { ModuleContext, ModuleResult } from "../context";
import type { BeefreeModule } from "../types";
import { button } from "./button";
import { divider, spacer } from "./divider";
import { addon, carousel, form, html, icons, mergeContent, table, unknown, video } from "./embed";
import { image } from "./image";
import { menu } from "./menu";
import { social } from "./social";
import { heading, list, paragraph, text } from "./text";

type Convert = (descriptor: Record<string, any>, ctx: ModuleContext, module: BeefreeModule) => ModuleResult;

const MODULES: Record<string, Convert> = {
  text,
  paragraph,
  heading,
  list,
  image,
  button,
  divider,
  spacer,
  social,
  menu,
  html,
  video,
  icons,
  "merge-content": mergeContent,
  form,
  table,
  carousel,
  addon,
  // An empty column's placeholder: nothing to show.
  empty: () => [],
};

/** A module's kind: `text` for `mailup-bee-newsletter-modules-text`. */
export const moduleKind = (type: unknown) => String(type ?? "").replace(/^mailup-bee-newsletter-modules-/, "") || "untyped";

export function convertModule(module: BeefreeModule, ctx: ModuleContext): ModuleResult {
  const kind = moduleKind(module.type);
  const descriptor = module.descriptor && typeof module.descriptor === "object" ? module.descriptor : {};
  const convert = MODULES[kind];
  return convert ? convert(descriptor, ctx, module) : unknown(descriptor, ctx, `"${kind}"`);
}
