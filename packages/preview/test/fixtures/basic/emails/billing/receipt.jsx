import { Email, Row, Column, Heading, Paragraph, Html } from "@unlayer/react-elements";
import { money } from "@/lib/format";

export default function Receipt({ total = 4200 }) {
  return (
    <Email>
      <Row>
        <Column>
          <Heading>Receipt</Heading>
          <Paragraph>Total: {money(total)}</Paragraph>
          <Html html={'<div style="display:flex;gap:8px;background-image:linear-gradient(#fff,#eee)">Paid</div>'} />
        </Column>
      </Row>
    </Email>
  );
}
