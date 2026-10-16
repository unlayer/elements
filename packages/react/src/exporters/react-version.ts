import { version } from "react";

const [major, minor] = String(version).split(".").map(Number);

/** React 18 writes some attributes, styles and children otherwise than React 19 (see attributes.ts and markup.ts). */
export const REACT_18 = major < 19;

/** React 19.3 added `credentialless` to its boolean attributes and `maskType` to its SVG attributes. */
export const REACT_19_3 = major > 19 || (major === 19 && minor >= 3);
