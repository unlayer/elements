/**
 * The installed React's version, read from its public `React.version`: React 18 and 19 write some markup otherwise
 * (host.ts, attributes.ts, the string exporters). Nothing else of React's is read.
 */
import React from "react";

const version = (v: string) => v.split(/[.-]/).slice(0, 2).map((n) => Number.parseInt(n, 10) || 0);

const [MAJOR, MINOR] = version(String(React.version));
/** React 18 renders some elements, attributes, styles and children otherwise than React 19. */
export const REACT_18 = MAJOR < 19;
/** React 18.2 and 18.3 reject a `<title>`'s `dangerouslySetInnerHTML` (18.0, 18.1 and 19 write it). */
export const REACT_18_2 = MAJOR === 18 && MINOR >= 2;
/** React 19.3 added `credentialless` to its boolean attributes and `maskType` to its SVG attributes. */
export const REACT_19_3 = MAJOR > 19 || (MAJOR === 19 && MINOR >= 3);
