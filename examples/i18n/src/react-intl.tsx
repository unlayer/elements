import {
  Button, Column, ColumnLayouts, Email, Heading, Paragraph, Row,
  renderToHtml, renderToPlainText,
} from "@unlayer/react-elements";
import { createIntl, RawIntlProvider, useIntl } from "react-intl";
import { directionOf, type Locale, type Messages, type Order } from "./locales";

function ShippedEmail({ order }: { order: Order }) {
  const intl = useIntl();
  const values = { name: order.customer, orderId: order.id };
  const direction = directionOf(intl.locale);
  return (
    <Email
      lang={intl.locale}
      textDirection={direction}
      previewText={intl.formatMessage({ id: "shipped.preview" })}
    >
      <Row layout={ColumnLayouts.OneColumn} padding="24px">
        <Column>
          <Heading>{intl.formatMessage({ id: "shipped.heading" })}</Heading>
          <Paragraph>{intl.formatMessage({ id: "shipped.greeting" }, values)}</Paragraph>
          <Button href={order.trackingUrl}>{intl.formatMessage({ id: "shipped.cta" })}</Button>
        </Column>
      </Row>
    </Email>
  );
}

export function renderShippedEmail(locale: Locale, messages: Messages, order: Order) {
  // react-intl looks messages up by flat ids: { "shipped.heading": "…" }.
  const flat = Object.fromEntries(
    Object.entries(messages.shipped).map(([key, message]) => [`shipped.${key}`, message]),
  );
  const intl = createIntl({ locale, messages: flat });
  const email = (
    <RawIntlProvider value={intl}>
      <ShippedEmail order={order} />
    </RawIntlProvider>
  );
  return {
    subject: intl.formatMessage({ id: "shipped.subject" }, { orderId: order.id }),
    html: renderToHtml(email),
    text: renderToPlainText(email),
  };
}
