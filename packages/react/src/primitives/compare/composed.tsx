/**
 * main's Social and Menu, written with primitives (there's no component for either): a line of linked icons,
 * and a line of links with a separator between them that phones don't show.
 */
import { Image, Link, Row, Text } from "../index";

/** main's Social: its icons (from its CDN, in its style), each a link, centered, `spacing` apart. */
export function social(icons: Array<{ name: string; url: string }>, { type, size, spacing = 12 }: { type: "rounded" | "circle"; size: number; spacing?: number }) {
  return (
    <Row stackOnMobile={false} style={{ gap: spacing, justifyContent: "center" }}>
      {icons.map((icon) => (
        <Link key={icon.name} href={icon.url} title={icon.name} style={{ flex: "none" }}>
          <Image src={`https://cdn.tools.unlayer.com/social/icons/${type}/${icon.name.toLowerCase()}.png`} alt={`${icon.name} icon`} style={{ width: size }} />
        </Link>
      ))}
    </Row>
  );
}

/** main's Menu: its links centered, 34px apart (15px of padding each side and the space between them), `separator` between them on desktop, at the browser's normal line height. */
export function menu(items: Array<{ text: string; href: string }>, separator: string) {
  return (
    <Row stackOnMobile={false} style={{ gap: 34, justifyContent: "center", padding: [5, 0], fontSize: 14, lineHeight: 1.2 }}>
      {items.flatMap((item, i) => [
        ...(i
          ? [
              <Text key={`separator-${i}`} hidden={{ mobile: true }} style={{ flex: "none", color: "#444444" }}>
                {separator}
              </Text>,
            ]
          : []),
        <Link key={item.href} href={item.href} style={{ flex: "none", color: "#0068A5", textDecoration: "none" }}>
          {item.text}
        </Link>,
      ])}
    </Row>
  );
}
