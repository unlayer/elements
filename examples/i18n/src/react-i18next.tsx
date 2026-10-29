import {
  Button, Column, ColumnLayouts, Email, Heading, Paragraph, Row,
  renderToHtml, renderToPlainText,
} from "@unlayer/react-elements";
import i18next, { type i18n } from "i18next";
import { I18nextProvider, useTranslation } from "react-i18next";
import type { Locale, Messages, Order } from "./locales";

/** An i18next instance per locale, initialized before anything renders with it. */
export async function createI18n(locale: Locale, messages: Messages): Promise<i18n> {
  const instance = i18next.createInstance();
  await instance.init({
    lng: locale,
    resources: { [locale]: { translation: messages } },
    interpolation: {
      // The shared message files use {name}; i18next's default is {{name}}.
      prefix: "{",
      suffix: "}",
      // Elements escapes text children already.
      escapeValue: false,
    },
  });
  return instance;
}

function ShippedEmail({ order }: { order: Order }) {
  const { t, i18n } = useTranslation();
  const direction = i18n.dir();
  return (
    <Email lang={i18n.language} textDirection={direction} previewText={t("shipped.preview")}>
      <Row layout={ColumnLayouts.OneColumn} padding="24px">
        <Column>
          <Heading>{t("shipped.heading")}</Heading>
          <Paragraph>{t("shipped.greeting", { name: order.customer, orderId: order.id })}</Paragraph>
          <Button href={order.trackingUrl}>{t("shipped.cta")}</Button>
        </Column>
      </Row>
    </Email>
  );
}

export function renderShippedEmail(i18n: i18n, order: Order) {
  const email = (
    <I18nextProvider i18n={i18n}>
      <ShippedEmail order={order} />
    </I18nextProvider>
  );
  return {
    subject: i18n.t("shipped.subject", { orderId: order.id }),
    html: renderToHtml(email),
    text: renderToPlainText(email),
  };
}
