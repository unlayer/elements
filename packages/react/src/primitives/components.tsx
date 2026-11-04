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
  Html as HtmlDefinition,
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
  type PropsInput,
  type InputOf,
  type StyleInput,
} from "@unlayer-internal/elements-core";
import { collectingPrimitives, recordPrimitive } from "./collect";

/** The props of a primitive: its semantic props, plus its style, phone and hover styles, and children. */
export type PrimitiveProps<D> = D extends ComponentDefinition<infer P, infer S> ? PropsInput<P> & Extras<StyleInput<S>> : never;

/** What every primitive takes beside its own props. */
interface Extras<Style> {
  /** Stable id; one is assigned in document order when it's left out. */
  id?: string;
  style?: Style;
  /** Style on phones (in an Email or Page). */
  mobile?: Style;
  /** Style while the pointer is over it, where the component has one. */
  hover?: Style;
  hidden?: { mobile?: boolean; desktop?: boolean };
  children?: React.ReactNode;
}

// Each component's props and style have names of their own (HeadingProps, HeadingStyle), so a type error names them
// ("'marginBottom' does not exist in type 'HeadingStyle'") rather than spelling out every style the component takes.
type StyleOf<D> = D extends ComponentDefinition<any, infer S> ? { [K in keyof S]?: InputOf<S[K]["kind"]> } : never;
type PropsOf<D, Style> = D extends ComponentDefinition<infer P, any> ? PropsInput<P> & Extras<Style> : never;

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

export const Email: React.FC<EmailProps> = createPrimitive(EmailDefinition);
export const Page: React.FC<PageProps> = createPrimitive(PageDefinition);
export const Section: React.FC<SectionProps> = createPrimitive(SectionDefinition);
export const Row: React.FC<RowProps> = createPrimitive(RowDefinition);
export const Column: React.FC<ColumnProps> = createPrimitive(ColumnDefinition);
export const Text: React.FC<TextProps> = createPrimitive(TextDefinition);
export const Paragraph: React.FC<ParagraphProps> = createPrimitive(ParagraphDefinition);
export const Heading: React.FC<HeadingProps> = createPrimitive(HeadingDefinition);
export const Span: React.FC<SpanProps> = createPrimitive(SpanDefinition);
export const Link: React.FC<LinkProps> = createPrimitive(LinkDefinition);
export const Button: React.FC<ButtonProps> = createPrimitive(ButtonDefinition);
export const Image: React.FC<ImageProps> = createPrimitive(ImageDefinition);
export const Divider: React.FC<DividerProps> = createPrimitive(DividerDefinition);
export const LineBreak: React.FC<LineBreakProps> = createPrimitive(LineBreakDefinition);
export const MergeTag: React.FC<MergeTagProps> = createPrimitive(MergeTagDefinition);
export const List: React.FC<ListProps> = createPrimitive(ListDefinition);
export const ListItem: React.FC<ListItemProps> = createPrimitive(ListItemDefinition);
export const Table: React.FC<TableProps> = createPrimitive(TableDefinition);
export const TableRow: React.FC<TableRowProps> = createPrimitive(TableRowDefinition);
export const TableCell: React.FC<TableCellProps> = createPrimitive(TableCellDefinition);
export const Social: React.FC<SocialProps> = createPrimitive(SocialDefinition);
export const Menu: React.FC<MenuProps> = createPrimitive(MenuDefinition);
export const Grid: React.FC<GridProps> = createPrimitive(GridDefinition);
export const Layer: React.FC<LayerProps> = createPrimitive(LayerDefinition);
/** A printed document; `Document.Page` is one of its pages. */
export const Document: React.FC<DocumentProps> & { Page: React.FC<DocumentPageProps> } = Object.assign(createPrimitive(DocumentDefinition), { Page: createPrimitive(DocumentPageDefinition) });
export const PageBreak: React.FC<PageBreakProps> = createPrimitive(PageBreakDefinition);
export const PageHeader: React.FC<PageHeaderProps> = createPrimitive(PageHeaderDefinition);
export const PageFooter: React.FC<PageFooterProps> = createPrimitive(PageFooterDefinition);
export const PageNumber: React.FC<PageNumberProps> = createPrimitive(PageNumberDefinition);
export const Canvas: React.FC<CanvasProps> = createPrimitive(CanvasDefinition);
export const Svg: React.FC<SvgProps> = createPrimitive(SvgDefinition);
export const Rect: React.FC<RectProps> = createPrimitive(RectDefinition);
export const Circle: React.FC<CircleProps> = createPrimitive(CircleDefinition);
export const Ellipse: React.FC<EllipseProps> = createPrimitive(EllipseDefinition);
export const Line: React.FC<LineProps> = createPrimitive(LineDefinition);
export const Polygon: React.FC<PolygonProps> = createPrimitive(PolygonDefinition);
export const Path: React.FC<PathProps> = createPrimitive(PathDefinition);
export const Video: React.FC<VideoProps> = createPrimitive(VideoDefinition);
/** Markup written as it is (the builder's HTML block). */
export const Html: React.FC<HtmlProps> = createPrimitive(HtmlDefinition);

export interface EmailStyle extends StyleOf<typeof EmailDefinition> {}
export interface EmailProps extends PropsOf<typeof EmailDefinition, EmailStyle> {}
export interface PageStyle extends StyleOf<typeof PageDefinition> {}
export interface PageProps extends PropsOf<typeof PageDefinition, PageStyle> {}
export interface SectionStyle extends StyleOf<typeof SectionDefinition> {}
export interface SectionProps extends PropsOf<typeof SectionDefinition, SectionStyle> {}
export interface RowStyle extends StyleOf<typeof RowDefinition> {}
export interface RowProps extends PropsOf<typeof RowDefinition, RowStyle> {}
export interface ColumnStyle extends StyleOf<typeof ColumnDefinition> {}
export interface ColumnProps extends PropsOf<typeof ColumnDefinition, ColumnStyle> {}
export interface TextStyle extends StyleOf<typeof TextDefinition> {}
export interface TextProps extends PropsOf<typeof TextDefinition, TextStyle> {}
export interface ParagraphStyle extends StyleOf<typeof ParagraphDefinition> {}
export interface ParagraphProps extends PropsOf<typeof ParagraphDefinition, ParagraphStyle> {}
export interface HeadingStyle extends StyleOf<typeof HeadingDefinition> {}
export interface HeadingProps extends PropsOf<typeof HeadingDefinition, HeadingStyle> {}
export interface SpanStyle extends StyleOf<typeof SpanDefinition> {}
export interface SpanProps extends PropsOf<typeof SpanDefinition, SpanStyle> {}
export interface LinkStyle extends StyleOf<typeof LinkDefinition> {}
export interface LinkProps extends PropsOf<typeof LinkDefinition, LinkStyle> {}
export interface ButtonStyle extends StyleOf<typeof ButtonDefinition> {}
export interface ButtonProps extends PropsOf<typeof ButtonDefinition, ButtonStyle> {}
export interface ImageStyle extends StyleOf<typeof ImageDefinition> {}
export interface ImageProps extends PropsOf<typeof ImageDefinition, ImageStyle> {}
export interface DividerStyle extends StyleOf<typeof DividerDefinition> {}
export interface DividerProps extends PropsOf<typeof DividerDefinition, DividerStyle> {}
export interface LineBreakStyle extends StyleOf<typeof LineBreakDefinition> {}
export interface LineBreakProps extends PropsOf<typeof LineBreakDefinition, LineBreakStyle> {}
export interface MergeTagStyle extends StyleOf<typeof MergeTagDefinition> {}
export interface MergeTagProps extends PropsOf<typeof MergeTagDefinition, MergeTagStyle> {}
export interface ListStyle extends StyleOf<typeof ListDefinition> {}
export interface ListProps extends PropsOf<typeof ListDefinition, ListStyle> {}
export interface ListItemStyle extends StyleOf<typeof ListItemDefinition> {}
export interface ListItemProps extends PropsOf<typeof ListItemDefinition, ListItemStyle> {}
export interface TableStyle extends StyleOf<typeof TableDefinition> {}
export interface TableProps extends PropsOf<typeof TableDefinition, TableStyle> {}
export interface TableRowStyle extends StyleOf<typeof TableRowDefinition> {}
export interface TableRowProps extends PropsOf<typeof TableRowDefinition, TableRowStyle> {}
export interface TableCellStyle extends StyleOf<typeof TableCellDefinition> {}
export interface TableCellProps extends PropsOf<typeof TableCellDefinition, TableCellStyle> {}
export interface SocialStyle extends StyleOf<typeof SocialDefinition> {}
export interface SocialProps extends PropsOf<typeof SocialDefinition, SocialStyle> {}
export interface MenuStyle extends StyleOf<typeof MenuDefinition> {}
export interface MenuProps extends PropsOf<typeof MenuDefinition, MenuStyle> {}
export interface GridStyle extends StyleOf<typeof GridDefinition> {}
export interface GridProps extends PropsOf<typeof GridDefinition, GridStyle> {}
export interface LayerStyle extends StyleOf<typeof LayerDefinition> {}
export interface LayerProps extends PropsOf<typeof LayerDefinition, LayerStyle> {}
export interface DocumentStyle extends StyleOf<typeof DocumentDefinition> {}
export interface DocumentProps extends PropsOf<typeof DocumentDefinition, DocumentStyle> {}
export interface DocumentPageStyle extends StyleOf<typeof DocumentPageDefinition> {}
export interface DocumentPageProps extends PropsOf<typeof DocumentPageDefinition, DocumentPageStyle> {}
export interface PageBreakStyle extends StyleOf<typeof PageBreakDefinition> {}
export interface PageBreakProps extends PropsOf<typeof PageBreakDefinition, PageBreakStyle> {}
export interface PageHeaderStyle extends StyleOf<typeof PageHeaderDefinition> {}
export interface PageHeaderProps extends PropsOf<typeof PageHeaderDefinition, PageHeaderStyle> {}
export interface PageFooterStyle extends StyleOf<typeof PageFooterDefinition> {}
export interface PageFooterProps extends PropsOf<typeof PageFooterDefinition, PageFooterStyle> {}
export interface PageNumberStyle extends StyleOf<typeof PageNumberDefinition> {}
export interface PageNumberProps extends PropsOf<typeof PageNumberDefinition, PageNumberStyle> {}
export interface CanvasStyle extends StyleOf<typeof CanvasDefinition> {}
export interface CanvasProps extends PropsOf<typeof CanvasDefinition, CanvasStyle> {}
export interface SvgStyle extends StyleOf<typeof SvgDefinition> {}
export interface SvgProps extends PropsOf<typeof SvgDefinition, SvgStyle> {}
export interface RectStyle extends StyleOf<typeof RectDefinition> {}
export interface RectProps extends PropsOf<typeof RectDefinition, RectStyle> {}
export interface CircleStyle extends StyleOf<typeof CircleDefinition> {}
export interface CircleProps extends PropsOf<typeof CircleDefinition, CircleStyle> {}
export interface EllipseStyle extends StyleOf<typeof EllipseDefinition> {}
export interface EllipseProps extends PropsOf<typeof EllipseDefinition, EllipseStyle> {}
export interface LineStyle extends StyleOf<typeof LineDefinition> {}
export interface LineProps extends PropsOf<typeof LineDefinition, LineStyle> {}
export interface PolygonStyle extends StyleOf<typeof PolygonDefinition> {}
export interface PolygonProps extends PropsOf<typeof PolygonDefinition, PolygonStyle> {}
export interface PathStyle extends StyleOf<typeof PathDefinition> {}
export interface PathProps extends PropsOf<typeof PathDefinition, PathStyle> {}
export interface VideoStyle extends StyleOf<typeof VideoDefinition> {}
export interface VideoProps extends PropsOf<typeof VideoDefinition, VideoStyle> {}
export interface HtmlStyle extends StyleOf<typeof HtmlDefinition> {}
export interface HtmlProps extends PropsOf<typeof HtmlDefinition, HtmlStyle> {}
