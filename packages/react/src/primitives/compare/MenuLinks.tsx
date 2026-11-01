/**
 * main's Menu stories (Components/Menu), each in an email, and the same links with the new Menu: main's
 * `linkColor` is the color, `textColor` the separator's, `align` the alignment.
 *
 * One difference is main's: its links are inline-blocks with spaces between them in its markup, and spaces
 * around its separator, so each is about 4.7px further from the next than their padding says. `nextAsMain`
 * adds it to the padding. Its font is main's email default as main writes it.
 */
import { Column as MainColumn, Email as MainEmail, Menu as MainMenu, Row as MainRow } from "../../index";
import { Email, Menu, Section } from "../index";

const ITEMS = [
  { text: "Home", href: "#home" },
  { text: "About", href: "#about" },
  { text: "Services", href: "#services" },
  { text: "Contact", href: "#contact" },
];

function design(separatorColor?: string) {
  const next = (sides: number) => (
    <Email width={600} style={{ fontFamily: "arial, helvetica, sans-serif" }}>
      <Section style={{ padding: 10 }}>
        <Menu items={ITEMS} separator="|" style={{ padding: [10, sides], fontSize: 14, color: "#2563eb", lineHeight: 1.2, ...(separatorColor ? { separatorColor } : {}) }} />
      </Section>
    </Email>
  );
  return {
    main: (
      <MainEmail contentWidth="600px">
        <MainRow>
          <MainColumn>
            <MainMenu items={ITEMS} layout="horizontal" align="center" separator="|" padding="10px 16px" fontSize="14px" linkColor="#2563eb" {...(separatorColor ? { textColor: separatorColor } : {})} />
          </MainColumn>
        </MainRow>
      </MainEmail>
    ),
    next: next(16),
    nextAsMain: next(18.33),
    quirks: "its links are inline-blocks with spaces between them and around its separator, so each is about 4.7px further from the next than its padding says.",
  };
}

export const links = design();
export const separators = design("#374151");
