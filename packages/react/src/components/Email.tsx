import Body, { type BodyProps } from "./Body";
import { OWN } from "../utils/create-component";
import { ROOT } from "../utils/root-type";

export type EmailProps = Omit<BodyProps, "mode">;

/**
 * Email - Renders email-client safe HTML (tables for Outlook, Gmail, Yahoo).
 *
 * Thin wrapper around Body with mode locked to "email".
 *
 * @example
 * ```tsx
 * <Email backgroundColor="#f4f4f5" contentWidth="560px" previewText="Welcome!">
 *   <Row><Column><Paragraph text="Hello" /></Column></Row>
 * </Email>
 * ```
 */
export default function Email(props: EmailProps) {
  return <Body {...props} mode="email" />;
}

Email.displayName = "Email";
((Email as unknown) as Record<symbol, boolean>)[OWN] = true;
((Email as unknown) as Record<symbol, string>)[ROOT] = "Email";
