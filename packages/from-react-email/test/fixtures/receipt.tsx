import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ReceiptItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  imageUrl: string;
}

interface ReceiptEmailProps {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  paymentMethod: string;
  items: ReceiptItem[];
  shipping: number;
  taxRate: number;
  currency?: string;
  orderUrl: string;
}

const formatMoney = (amount: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

export const ReceiptEmail = ({
  customerName,
  orderNumber,
  orderDate,
  paymentMethod,
  items,
  shipping,
  taxRate,
  currency = 'USD',
  orderUrl,
}: ReceiptEmailProps) => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + shipping + tax;

  return (
    <Html>
      <Head />
      <Preview>
        Your receipt for order #{orderNumber} - {formatMoney(total, currency)}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src="https://placehold.co/140x36/111827/ffffff?text=Northwind"
              width="140"
              height="36"
              alt="Northwind"
            />
          </Section>

          <Heading style={h1}>Thanks for your order, {customerName}!</Heading>
          <Text style={paragraph}>
            We've received your payment and are getting your order ready. Here's
            your receipt for your records.
          </Text>

          <Section style={metaBox}>
            <Row>
              <Column>
                <Text style={metaLabel}>Order number</Text>
                <Text style={metaValue}>#{orderNumber}</Text>
              </Column>
              <Column>
                <Text style={metaLabel}>Order date</Text>
                <Text style={metaValue}>{orderDate}</Text>
              </Column>
              <Column>
                <Text style={metaLabel}>Payment method</Text>
                <Text style={metaValue}>{paymentMethod}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={itemsSection}>
            {items.map((item) => (
              <Row key={item.name} style={itemRow}>
                <Column style={itemImageCol}>
                  <Img
                    src={item.imageUrl}
                    width="64"
                    height="64"
                    alt={item.name}
                    style={itemImage}
                  />
                </Column>
                <Column style={itemInfoCol}>
                  <Text style={itemName}>{item.name}</Text>
                  {item.description ? (
                    <Text style={itemDescription}>{item.description}</Text>
                  ) : null}
                  <Text style={itemDescription}>Qty: {item.quantity}</Text>
                </Column>
                <Column style={itemPriceCol}>
                  <Text style={itemPrice}>
                    {formatMoney(item.quantity * item.unitPrice, currency)}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={hr} />

          <Section>
            <Row>
              <Column>
                <Text style={totalLabel}>Subtotal</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>{formatMoney(subtotal, currency)}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={totalLabel}>Shipping</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>
                  {shipping === 0 ? 'Free' : formatMoney(shipping, currency)}
                </Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={totalLabel}>Tax ({(taxRate * 100).toFixed(2)}%)</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>{formatMoney(tax, currency)}</Text>
              </Column>
            </Row>
            <Hr style={hr} />
            <Row>
              <Column>
                <Text style={grandTotalLabel}>Total</Text>
              </Column>
              <Column align="right">
                <Text style={grandTotalValue}>{formatMoney(total, currency)}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={orderUrl}>
              View your order
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Need help with your order? Visit our{' '}
            <Link href="https://northwind.example.com/help" style={footerLink}>
              help center
            </Link>{' '}
            or reply to this email.
          </Text>
          <Text style={footer}>Northwind Traders · 500 Harbor Way · Seattle, WA 98101</Text>
        </Container>
      </Body>
    </Html>
  );
};

ReceiptEmail.PreviewProps = {
  customerName: 'Priya',
  orderNumber: '10482',
  orderDate: 'Oct 4, 2026',
  paymentMethod: 'Visa ending in 4242',
  items: [
    {
      name: 'Merino Wool Beanie',
      description: 'Charcoal / One size',
      quantity: 1,
      unitPrice: 34,
      imageUrl: 'https://picsum.photos/seed/beanie/128/128',
    },
    {
      name: 'Trail Running Socks (3-pack)',
      description: 'Assorted / Medium',
      quantity: 2,
      unitPrice: 24.5,
      imageUrl: 'https://picsum.photos/seed/socks/128/128',
    },
    {
      name: 'Insulated Water Bottle',
      description: '24 oz / Forest green',
      quantity: 1,
      unitPrice: 29.99,
      imageUrl: 'https://picsum.photos/seed/bottle/128/128',
    },
  ],
  shipping: 0,
  taxRate: 0.0875,
  currency: 'USD',
  orderUrl: 'https://northwind.example.com/orders/10482',
} as ReceiptEmailProps;

export default ReceiptEmail;

const main = {
  backgroundColor: '#f3f4f6',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '0 0 32px',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden' as const,
};

const header = {
  backgroundColor: '#111827',
  padding: '24px 32px',
};

const h1 = {
  color: '#111827',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '32px',
  margin: '32px 32px 12px',
};

const paragraph = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 32px 24px',
};

const metaBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
  margin: '0 32px 24px',
  padding: '8px 16px',
};

const metaLabel = {
  color: '#6b7280',
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
  margin: '8px 0 2px',
};

const metaValue = {
  color: '#111827',
  fontSize: '14px',
  margin: '0 0 8px',
};

const itemsSection = {
  padding: '0 32px',
};

const itemRow = {
  borderBottom: '1px solid #f3f4f6',
  padding: '12px 0',
};

const itemImageCol = { width: '80px' };

const itemImage = {
  borderRadius: '6px',
  display: 'block',
};

const itemInfoCol = { paddingLeft: '8px' };

const itemPriceCol = { width: '100px', textAlign: 'right' as const };

const itemName = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 2px',
};

const itemDescription = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '18px',
  margin: '0',
};

const itemPrice = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 32px',
};

const totalLabel = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '4px 0 4px 32px',
};

const totalValue = {
  color: '#111827',
  fontSize: '14px',
  margin: '4px 32px 4px 0',
};

const grandTotalLabel = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '700',
  margin: '4px 0 4px 32px',
};

const grandTotalValue = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: '700',
  margin: '4px 32px 4px 0',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '28px 0 8px',
};

const button = {
  backgroundColor: '#111827',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '12px 24px',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0 32px 6px',
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#6b7280',
  textDecoration: 'underline',
};
