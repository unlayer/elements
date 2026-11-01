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
  Social as SocialDefinition,
  Menu as MenuDefinition,
  Grid as GridDefinition,
  Layer as LayerDefinition,
  Document as DocumentDefinition,
  DocumentPage as DocumentPageDefinition,
  PageBreak as PageBreakDefinition,
  PageHeader as PageHeaderDefinition,
  PageFooter as PageFooterDefinition,
  PageNumber as PageNumberDefinition,
  Canvas as CanvasDefinition,
  Svg as SvgDefinition,
  Rect as RectDefinition,
  Circle as CircleDefinition,
  Ellipse as EllipseDefinition,
  Line as LineDefinition,
  Polygon as PolygonDefinition,
  Path as PathDefinition,
  Video as VideoDefinition,
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
export const Social = createPrimitive(SocialDefinition);
export const Menu = createPrimitive(MenuDefinition);
export const Grid = createPrimitive(GridDefinition);
export const Layer = createPrimitive(LayerDefinition);
/** A printed document; `Document.Page` is one of its pages. */
export const Document = Object.assign(createPrimitive(DocumentDefinition), { Page: createPrimitive(DocumentPageDefinition) });
export const PageBreak = createPrimitive(PageBreakDefinition);
export const PageHeader = createPrimitive(PageHeaderDefinition);
export const PageFooter = createPrimitive(PageFooterDefinition);
export const PageNumber = createPrimitive(PageNumberDefinition);
export const Canvas = createPrimitive(CanvasDefinition);
export const Svg = createPrimitive(SvgDefinition);
export const Rect = createPrimitive(RectDefinition);
export const Circle = createPrimitive(CircleDefinition);
export const Ellipse = createPrimitive(EllipseDefinition);
export const Line = createPrimitive(LineDefinition);
export const Polygon = createPrimitive(PolygonDefinition);
export const Path = createPrimitive(PathDefinition);
export const Video = createPrimitive(VideoDefinition);

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
export type SocialProps = PrimitiveProps<typeof SocialDefinition>;
export type MenuProps = PrimitiveProps<typeof MenuDefinition>;
export type GridProps = PrimitiveProps<typeof GridDefinition>;
export type LayerProps = PrimitiveProps<typeof LayerDefinition>;
export type DocumentProps = PrimitiveProps<typeof DocumentDefinition>;
export type DocumentPageProps = PrimitiveProps<typeof DocumentPageDefinition>;
export type PageBreakProps = PrimitiveProps<typeof PageBreakDefinition>;
export type PageHeaderProps = PrimitiveProps<typeof PageHeaderDefinition>;
export type PageFooterProps = PrimitiveProps<typeof PageFooterDefinition>;
export type PageNumberProps = PrimitiveProps<typeof PageNumberDefinition>;
export type CanvasProps = PrimitiveProps<typeof CanvasDefinition>;
export type SvgProps = PrimitiveProps<typeof SvgDefinition>;
export type RectProps = PrimitiveProps<typeof RectDefinition>;
export type CircleProps = PrimitiveProps<typeof CircleDefinition>;
export type EllipseProps = PrimitiveProps<typeof EllipseDefinition>;
export type LineProps = PrimitiveProps<typeof LineDefinition>;
export type PolygonProps = PrimitiveProps<typeof PolygonDefinition>;
export type PathProps = PrimitiveProps<typeof PathDefinition>;
export type VideoProps = PrimitiveProps<typeof VideoDefinition>;
