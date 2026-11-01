/**
 * main's Menu stories (Components/Menu), each in an email, and the same links with the new Menu: main's
 * `linkColor` is the color, `textColor` the separator's, `align` the alignment.
 *
 * main's links are inline-blocks with a space between each in its markup, so each is a space further from the
 * next than their padding says; `nextAsMain` puts a non-breaking space before each link but the first and before
 * the separator (before, not after: a packed cell's width leaves a trailing one out). main's spaces are in its
 * container's font size, and its menu takes the font's normal line height, where Elements writes an exact one (1.2)
 * that every client draws alike: its links may sit up to 3px from main's, across and up and down (`allowance`).
 * Its font is main's email default as main writes it.
 */
import { Column as MainColumn, Email as MainEmail, Menu as MainMenu, Row as MainRow } from "../../index";
import { Email, Menu, Section } from "../index";

const ITEMS = [
  { text: "Home", href: "#home" },
  { text: "About", href: "#about" },
  { text: "Services", href: "#services" },
  { text: "Contact", href: "#contact" },
];

const NBSP = "\u00a0";

function design(separatorColor?: string) {
  const next = (asMain: boolean) => (
    <Email width={600} style={{ fontFamily: "arial, helvetica, sans-serif" }}>
      <Section style={{ padding: 10 }}>
        <Menu
          items={asMain ? ITEMS.map((item, i) => (i > 0 ? { ...item, text: NBSP + item.text } : item)) : ITEMS}
          separator={asMain ? `${NBSP}|` : "|"}
          style={{ padding: [10, 16], fontSize: 14, color: "#2563eb", ...(separatorColor ? { separatorColor } : {}) }}
        />
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
    next: next(false),
    nextAsMain: next(true),
    quirks: "its links are inline-blocks with a space between each, so each is a space further from the next than its padding says.",
    allowance: { x: 3, y: 3 },
  };
}

export const links = design();
export const separators = design("#374151");
