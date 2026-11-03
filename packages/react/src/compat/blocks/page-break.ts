/**
 * A page break: nothing in an email or on a page, where legacy writes nothing for it; in a printed document it keeps
 * its legacy HTML (a page break CSS breaks the page after), as a page, the new engine's output for legacy's flowing
 * document, has no PageBreak of its own (the new Document's pages don't flow).
 */
import type { Place, TreeNode } from "../lower";

export const pageBreak = (_: unknown, place: Place): TreeNode | null | undefined => (place.mode === "document" ? undefined : null);
