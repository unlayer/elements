/**
 * The new Elements API, built here until it replaces the package's main entry
 * in the next major (see docs/rfcs/0001-primitives-and-exporters.md): the
 * components, component(), render() and validate(). JSX is the only way to
 * write a template; the tree it becomes is internal.
 */
export {
  Email,
  Page,
  Section,
  Row,
  Column,
  Text,
  Paragraph,
  Heading,
  Span,
  Link,
  Button,
  Image,
  Divider,
  LineBreak,
  MergeTag,
  List,
  ListItem,
  Table,
  TableRow,
  TableCell,
} from "./components";
export type {
  PrimitiveProps,
  EmailProps,
  PageProps,
  SectionProps,
  RowProps,
  ColumnProps,
  TextProps,
  ParagraphProps,
  HeadingProps,
  SpanProps,
  LinkProps,
  ButtonProps,
  ImageProps,
  DividerProps,
  LineBreakProps,
  MergeTagProps,
  ListProps,
  ListItemProps,
  TableProps,
  TableRowProps,
  TableCellProps,
} from "./components";
export { component, prop, type ComponentSpec, type CustomComponent, type CustomProps } from "./custom";
export { render, validate, type RenderOptions, type RenderResult, type ValidationResult } from "./render";
export { ElementsError, formatDiagnostics } from "@unlayer-internal/elements-core";
export type { Diagnostic, Severity } from "@unlayer-internal/elements-core";
