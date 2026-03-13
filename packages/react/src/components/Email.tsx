import Body, { type BodyProps } from "./Body";

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
