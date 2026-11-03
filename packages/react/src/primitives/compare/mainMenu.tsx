/**
 * main's horizontal Menu drawn with the new components (for a design's `nextAsMain`): main writes its links and its
 * separators as inline-blocks, each separator in a link's padding too, with a space between each two in its markup.
 * The new Menu has a link's padding either side of a separator, not twice, and no spaces: main's is drawn here as a
 * Row of its own that wraps, each link and separator a Text in the links' padding, a non-breaking space before each
 * but the first (where main's space is). Separators are left out on phones, as main's are.
 */
import type { ReactElement } from "react";
import { Link, Row, Text } from "../index";

const NBSP = " ";

export interface MainMenuProps {
  items: Array<{ text: string; href: string }>;
  separator?: string;
  /** Each link's padding, [top and bottom, sides] in px (main's 5px 15px by default). */
  padding?: [number, number];
  color?: string;
  separatorColor?: string;
  fontSize?: number;
}

export function mainMenu({ items, separator = "", padding = [5, 15], color = "#0068A5", separatorColor = "#444444", fontSize = 14 }: MainMenuProps): ReactElement {
  const box = { flex: "none", padding } as const;
  return (
    <Row stackOnMobile={false} style={{ flexWrap: "wrap", justifyContent: "center", fontSize, lineHeight: 1.2 }}>
      {items.flatMap((item, index) => [
        ...(index && separator
          ? [
              <Text key={`separator-${index}`} hidden={{ mobile: true }} style={{ ...box, color: separatorColor }}>
                {NBSP + separator}
              </Text>,
            ]
          : []),
        <Text key={item.href} style={box}>
          <Link href={item.href} style={{ color, textDecoration: "none" }}>
            {(index ? NBSP : "") + item.text}
          </Link>
        </Text>,
      ])}
    </Row>
  );
}
