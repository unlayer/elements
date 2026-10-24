import { Paragraph } from "@unlayer/react-elements";

export function Footer({ company }: { company: string }) {
  return <Paragraph color="#71717a">Sent with care by {company}</Paragraph>;
}
