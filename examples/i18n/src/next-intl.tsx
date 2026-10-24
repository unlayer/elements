import {
  Button, Column, ColumnLayouts, Email, Heading, Paragraph, Row,
  renderToHtml, renderToPlainText,
} from "@unlayer/react-elements";
import { createTranslator } from "next-intl";
import { directionOf, type Locale, type Messages, type Order } from "./locales";

type ShippedTranslator = ReturnType<typeof createTranslator<Messages, "shipped">>;

function shippedEmail(t: ShippedTranslator, locale: Locale, order: Order) {
  const direction = directionOf(locale);
  return (
    <Email lang={locale} textDirection={direction} previewText={t("preview")}>
      <Row layout={ColumnLayouts.OneColumn} padding="24px">
        <Column>
          <Heading>{t("heading")}</Heading>
          <Paragraph>{t("greeting", { name: order.customer, orderId: order.id })}</Paragraph>
          <Button href={order.trackingUrl}>{t("cta")}</Button>
        </Column>
      </Row>
    </Email>
  );
}

export function renderShippedEmail(locale: Locale, messages: Messages, order: Order) {
  // createTranslator needs no request: it works in scripts, job workers and Next.js server code alike.
  const t = createTranslator({ locale, messages, namespace: "shipped" });
  const email = shippedEmail(t, locale, order);
  return {
    subject: t("subject", { orderId: order.id }),
    html: renderToHtml(email),
    text: renderToPlainText(email),
  };
}
