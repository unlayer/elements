/**
 * What the components of one render share, whatever part of the template they're in: the work left to its Markdown
 * and code blocks, together (see the code entry's code-work.ts), so a template of many blocks takes what one block of
 * their size would. The render's own (each render function's, and an async render's walk and the synchronous render
 * after it alike), given to each component it calls while it calls it (see the engine's `renderShared`), as a render
 * walks its components outside its scope.
 */
import type { Shared } from "../engine";
import { scopeCache } from "./render-scope";

const SHARED = {};

/** The render's (one per call outside a render). */
export const sharedByRender = (): Shared => scopeCache(SHARED, () => ({}));
