/**
 * main's Menu stories (Components/Menu), each in an email, and the same links with the new Menu: main's
 * `linkColor` is the color, `textColor` the separator's, `align` the alignment.
 *
 * main's links and separators are inline-blocks with a space between each in its markup, each separator in a link's
 * padding too, so each is further from the next than the new Menu puts them (a link's padding either side of a
 * separator, not twice); `nextAsMain` draws main's menu (mainMenu.tsx). main's spaces are in its container's font
 * size, and its menu takes the font's normal line height, where Elements writes an exact one (1.2) that every client
 * draws alike: its links may sit up to 3px from main's, across and up and down (`allowance`).
 * Its font is main's email default as main writes it.
 */
import { Column as MainColumn, Email as MainEmail, Menu as MainMenu, Row as MainRow } from "../../index";
import { Email, Menu, Section } from "../index";
import { mainMenu } from "./mainMenu";

const ITEMS = [
  { text: "Home", href: "#home" },
  { text: "About", href: "#about" },
  { text: "Services", href: "#services" },
  { text: "Contact", href: "#contact" },
];

function design(separatorColor?: string) {
  const next = (asMain: boolean) => (
    <Email width={600} style={{ fontFamily: "arial, helvetica, sans-serif" }}>
      <Section style={{ padding: 10 }}>
        {asMain ? (
          mainMenu({ items: ITEMS, separator: "|", padding: [10, 16], fontSize: 14, color: "#2563eb", ...(separatorColor ? { separatorColor } : {}) })
        ) : (
          <Menu items={ITEMS} separator="|" style={{ padding: [10, 16], fontSize: 14, color: "#2563eb", ...(separatorColor ? { separatorColor } : {}) }} />
        )}
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
    quirks: "its links and separators are inline-blocks with a space between each, each separator in a link's padding too, so each is further from the next than the new Menu puts them.",
    allowance: { x: 3, y: 3 },
  };
}

export const links = design();
export const separators = design("#374151");
