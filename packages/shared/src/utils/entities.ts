/**
 * Text in an HTML attribute as the browser reads it: its character references decoded, to tell what a URL's scheme is
 * (a link's, which the editor's exporters write as it's given, and a browser decodes: see semantic-props.ts's
 * unrunUrl; the Markdown sanitizer's and the rich text in children's, in the React package).
 */

/** A numeric reference's character; one past Unicode's range (or a surrogate) is U+FFFD, as browsers read it. */
export const codePoint = (n: number) => String.fromCodePoint(n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff) ? 0xfffd : n);

/** The named references a browser reads as ASCII (`&colon;`, `&lpar;`): the others are characters no check reads. */
const NAMED: Record<string, string> = {
  tab: "\t", newline: "\n", excl: "!", quot: '"', num: "#", dollar: "$", percnt: "%", amp: "&", apos: "'", lpar: "(", rpar: ")", ast: "*", midast: "*",
  plus: "+", comma: ",", period: ".", sol: "/", colon: ":", semi: ";", lt: "<", equals: "=", gt: ">", quest: "?", commat: "@", lsqb: "[", lbrack: "[",
  bsol: "\\", rsqb: "]", rbrack: "]", hat: "^", lowbar: "_", underbar: "_", grave: "`", diacriticalgrave: "`", lcub: "{", lbrace: "{", verbar: "|",
  vert: "|", verticalline: "|", rcub: "}", rbrace: "}", fjlig: "fj",
};

/** An attribute's value as the browser reads it, its references decoded (in any case, and without `;`: reading more, never less). */
export const entities = (text: string) =>
  text.replace(/&(?:#(x[\da-f]+|\d+)|([a-z]+));?/gi, (whole, n?: string, name?: string) => (n ? codePoint(n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : Number(n)) : (NAMED[name!.toLowerCase()] ?? whole)));
