import Body, { type BodyProps } from "./Body";
import { OWN } from "../utils/create-component";
import { ROOT } from "../utils/root-type";

export type PageProps = Omit<BodyProps, "mode">;

/**
 * Page - Renders with div/flexbox for responsive web display.
 *
 * Thin wrapper around Body with mode locked to "web".
 *
 * @example
 * ```tsx
 * <Page backgroundColor="#ffffff" contentWidth="960px">
 *   <Row><Column><Paragraph text="Hello" /></Column></Row>
 * </Page>
 * ```
 */
export default function Page(props: PageProps) {
  return <Body {...props} mode="web" />;
}

Page.displayName = "Page";
((Page as unknown) as Record<symbol, boolean>)[OWN] = true;
((Page as unknown) as Record<symbol, string>)[ROOT] = "Page";
