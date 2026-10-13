/**
 * Pairs whose verdict is known, to check the oracle's reading (read.js and
 * oracle.ts) before trusting it: a wrong reading would mislabel every pair.
 */
const doc = (body: string, css = "") => `<!doctype html><html><head><style>${css}</style></head><body style="margin:0;font-family:Arial">${body}</body></html>`;
const line = '<p style="margin:0">A line that stays where it is</p>';

export const SELF_TEST: Array<{ name: string; a: string; b: string; differs: boolean }> = [
  { name: "a color written two ways", a: doc('<p style="color:#ff0000">Red words</p>'), b: doc('<p style="color:rgb(255, 0, 0)">Red words</p>'), differs: false },
  { name: "another color", a: doc('<p style="color:#ff0000">Red words</p>'), b: doc('<p style="color:#0000ff">Red words</p>'), differs: true },
  { name: "a size 1px off is the same", a: doc('<p style="font-size:16px">Sized words</p>'), b: doc('<p style="font-size:16.5px">Sized words</p>'), differs: false },
  { name: "an underline from a block above", a: doc('<div style="text-decoration:underline"><p>Underlined words</p></div>'), b: doc("<div><p>Underlined words</p></div>"), differs: true },
  { name: "no underline across a float", a: doc('<div style="text-decoration:underline"><p style="float:left;margin:0">Floated words</p></div>'), b: doc('<div><p style="float:left;margin:0">Floated words</p></div>'), differs: false },
  { name: "a box shown again inside a hidden one", a: doc('<div style="visibility:hidden"><p style="visibility:visible">Shown words</p><p>Hidden words</p></div>'), b: doc("<div><p>Shown words</p></div>"), differs: false },
  { name: "lines a max-height cuts off", a: doc('<p style="max-height:20px;overflow:hidden;line-height:20px;width:100px;margin:0">one two three four five six seven</p>'), b: doc('<p style="line-height:20px;width:100px;margin:0">one two three four five six seven</p>'), differs: true },
  { name: "text pushed off by text-indent", a: doc('<p style="text-indent:-9999px;overflow:hidden">Gone words</p>'), b: doc("<p></p>"), differs: false },
  { name: "screen reader only text", a: doc(`${line}<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">Reader words</span>`), b: doc(line), differs: false },
  { name: "a sized block moved to the right", a: doc(`${line}<div style="width:200px;margin-left:auto">Moved block</div>`), b: doc(`${line}<div style="width:200px">Moved block</div>`), differs: true },
  { name: "the whole email shifted", a: doc('<div style="padding-left:100px"><p>First line</p><p>Second line</p></div>'), b: doc("<div><p>First line</p><p>Second line</p></div>"), differs: false },
  { name: "a phone rule hides words", a: doc('<p class="d">Desktop words</p>', "@media (max-width:600px){.d{display:none}}"), b: doc("<p>Desktop words</p>"), differs: true },
  { name: "faint text", a: doc('<div style="opacity:0.3"><p>Faint words</p></div>'), b: doc("<div><p>Faint words</p></div>"), differs: true },
  { name: "a background behind the text", a: doc('<div style="background:#111827;color:#fff"><p>On dark</p></div>'), b: doc('<div style="color:#fff"><p>On dark</p></div>'), differs: true },
  { name: "the preview text in the email", a: doc('<div data-skip-in-text="true" style="display:none">Preview words</div><p>Body</p>'), b: doc("<p>Preview words</p><p>Body</p>"), differs: true },
  { name: "overflow on an inline box clips nothing", a: doc('<p><span style="overflow:hidden">Inline words</span></p>'), b: doc("<p><span>Inline words</span></p>"), differs: false },
  { name: "letter case as a style", a: doc('<p style="text-transform:uppercase">Case words</p>'), b: doc("<p>Case words</p>"), differs: true },
];
