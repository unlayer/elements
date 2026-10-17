/**
 * How each Elements component takes classes: the prop each style goes to, written compactly. Space-separated
 * `style=prop` pairs (`bg=backgroundColor`; a bare `padding` is `padding=padding`; `lineHeight=`: it has none, so
 * the class is reported), the flags `text` (text styles), `container` (Row, Column, the root: no containerPadding)
 * and `display` (it can be hidden), and `phone=` the props a phone variant (`max-sm:`) can set, as its `mobile` prop
 * takes them. A content block's margins and padding go to its containerPadding unless it says otherwise; one not
 * here (Html, Table, Video, a custom tool) takes only that. They live in this entry, not beside each component, so
 * the main entry, which every bundle has, doesn't carry them.
 */
const ROOT = "container bg=backgroundColor color=textColor fontFamily width=contentWidth maxWidth=contentWidth";
const TEXT = "text phone=fontSize,lineHeight,textAlign";

export const TABLES: Record<string, string> = {
  // A Row's background paints the content width, as a section in a container does; its padding classes inset the
  // content inside it, in its Columns, and a Column's margins are its Row's to place too (see row.ts).
  Row: "container display bg=columnsBackgroundColor padding phone=padding",
  Column: "container bg=backgroundColor padding margin border radius=borderRadius phone=padding,border,margin",
  Email: ROOT,
  Page: ROOT,
  Document: ROOT,
  Body: ROOT,
  Paragraph: TEXT,
  Heading: TEXT,
  // Its padding is inside it; its margins are around it.
  Button: "text bg=backgroundColor padding border radius=borderRadius width hoverBg=hoverBackgroundColor hoverColor phone=fontSize,lineHeight,textAlign,padding,width",
  // An image has no corners of its own to round.
  Image: "width maxWidth textAlign phone=width,textAlign",
  // Its line is its top border.
  Divider: "border=borderTop width textAlign phone=width,textAlign",
  Menu: "text color=textColor lineHeight= textAlign=align phone=fontSize",
  Social: "textAlign=align",
};
