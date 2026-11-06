import { Button, Column, Email, Heading, Text, Row, Section } from "@hyper-elements/react";
import type { ComponentProps } from "react";
import type { ButtonProps, ColumnProps } from "@hyper-elements/react";

export const meta = { title: "Plan picker", root: "Email", component: "PlanPicker" };

const plans = [["Starter", "$0"], ["Pro", "$24"], ["Team", "$79"]];

export default function PlanPicker() {
  return (
    <Email style={{ backgroundColor: "#f1f2f6" }}>
      <Section style={{ padding: 20 }}>
        <Column style={card}>
          <Heading style={{ fontSize: 30 }}
            mobile={{ fontSize: 22 }}>
            Pick your Orbit plan
          </Heading>
          <Row style={{ gap: 12 }}>
            {plans.map(([name, price]) => (
              <Column key={name} style={plan}>
                <Text style={label}>{name}</Text>
                <Text style={amount}>{price}</Text>
              </Column>
            ))}
          </Row>
          <Button href="https://orbit.dev/plans" style={cta}
            hover={{ backgroundColor: "#4c3df0" }}>
            Choose a plan
          </Button>
        </Column>
      </Section>
    </Email>
  );
}

const card = { backgroundColor: "#fff", borderRadius: 12,
  padding: 28, gap: 18 };
const plan: ColumnProps["style"] = { backgroundColor: "#f4f3ff", borderRadius: 10,
  padding: 16 };
const label: ComponentProps<typeof Text>["style"] = { fontWeight: 700, color: "#6d5efc" };
const amount: ComponentProps<typeof Text>["style"] = { fontSize: 26, fontWeight: 700 };
const cta: ButtonProps["style"] = { backgroundColor: "#6d5efc", borderRadius: 8,
  padding: [12, 22] };
