/**
 * The primitives as React components, made from their definitions: their
 * props' types come from the same definitions that validate them.
 */
import type React from "react";
import {
  Button as ButtonDefinition,
  Column as ColumnDefinition,
  Divider as DividerDefinition,
  Email as EmailDefinition,
  Heading as HeadingDefinition,
  Image as ImageDefinition,
  LineBreak as LineBreakDefinition,
  Link as LinkDefinition,
  List as ListDefinition,
  ListItem as ListItemDefinition,
  MergeTag as MergeTagDefinition,
  Page as PageDefinition,
  Paragraph as ParagraphDefinition,
  Row as RowDefinition,
  Section as SectionDefinition,
  Span as SpanDefinition,
  Table as TableDefinition,
  TableCell as TableCellDefinition,
  TableRow as TableRowDefinition,
  Text as TextDefinition,
  type ComponentDefinition,
  type Json,
  type PropsInput,
  type StyleInput,
} from "@unlayer-internal/elements-core";
import { collectingPrimitives, recordPrimitive } from "./collect";

/** The props of a primitive: its semantic props, plus its style, phone and hover styles, and children. */
export type PrimitiveProps<D> =
  D extends ComponentDefinition<infer P, infer S>
    ? PropsInput<P> & {
        /** Stable id; one is assigned in document order when it's left out. */
        id?: string;
        style?: StyleInput<S>;
        /** Style on phones (in an Email or Page). */
        mobile?: StyleInput<S>;
        /** Style while the pointer is over it, where the component has one. */
        hover?: StyleInput<S>;
        hidden?: { mobile?: boolean; desktop?: boolean };
        /** Data from another format, kept as it is. */
        compat?: Record<string, Json>;
        children?: React.ReactNode;
      }
    : never;

/** Marks a primitive's component type. */
export const PRIMITIVE = Symbol.for("@unlayer/react-elements/primitive");

function createPrimitive<D extends ComponentDefinition<any, any>>(definition: D): React.FC<PrimitiveProps<D>> {
  const Primitive = (props: PrimitiveProps<D>): React.ReactElement => {
    const collection = collectingPrimitives();
    if (!collection) {
      throw new Error(
        `[Elements] <${definition.type}> is part of a template: render the template with render(), not this component on its own`
      );
    }
    return recordPrimitive(collection, definition.type, props as Record<string, unknown>);
  };
  Primitive.displayName = definition.type;
  (Primitive as unknown as Record<symbol, string>)[PRIMITIVE] = definition.type;
  return Primitive;
}

export const Email = createPrimitive(EmailDefinition);
export const Page = createPrimitive(PageDefinition);
export const Section = createPrimitive(SectionDefinition);
export const Row = createPrimitive(RowDefinition);
export const Column = createPrimitive(ColumnDefinition);
export const Text = createPrimitive(TextDefinition);
export const Paragraph = createPrimitive(ParagraphDefinition);
export const Heading = createPrimitive(HeadingDefinition);
export const Span = createPrimitive(SpanDefinition);
export const Link = createPrimitive(LinkDefinition);
export const Button = createPrimitive(ButtonDefinition);
export const Image = createPrimitive(ImageDefinition);
export const Divider = createPrimitive(DividerDefinition);
export const LineBreak = createPrimitive(LineBreakDefinition);
export const MergeTag = createPrimitive(MergeTagDefinition);
export const List = createPrimitive(ListDefinition);
export const ListItem = createPrimitive(ListItemDefinition);
export const Table = createPrimitive(TableDefinition);
export const TableRow = createPrimitive(TableRowDefinition);
export const TableCell = createPrimitive(TableCellDefinition);

export type EmailProps = PrimitiveProps<typeof EmailDefinition>;
export type PageProps = PrimitiveProps<typeof PageDefinition>;
export type SectionProps = PrimitiveProps<typeof SectionDefinition>;
export type RowProps = PrimitiveProps<typeof RowDefinition>;
export type ColumnProps = PrimitiveProps<typeof ColumnDefinition>;
export type TextProps = PrimitiveProps<typeof TextDefinition>;
export type ParagraphProps = PrimitiveProps<typeof ParagraphDefinition>;
export type HeadingProps = PrimitiveProps<typeof HeadingDefinition>;
export type SpanProps = PrimitiveProps<typeof SpanDefinition>;
export type LinkProps = PrimitiveProps<typeof LinkDefinition>;
export type ButtonProps = PrimitiveProps<typeof ButtonDefinition>;
export type ImageProps = PrimitiveProps<typeof ImageDefinition>;
export type DividerProps = PrimitiveProps<typeof DividerDefinition>;
export type LineBreakProps = PrimitiveProps<typeof LineBreakDefinition>;
export type MergeTagProps = PrimitiveProps<typeof MergeTagDefinition>;
export type ListProps = PrimitiveProps<typeof ListDefinition>;
export type ListItemProps = PrimitiveProps<typeof ListItemDefinition>;
export type TableProps = PrimitiveProps<typeof TableDefinition>;
export type TableRowProps = PrimitiveProps<typeof TableRowDefinition>;
export type TableCellProps = PrimitiveProps<typeof TableCellDefinition>;
