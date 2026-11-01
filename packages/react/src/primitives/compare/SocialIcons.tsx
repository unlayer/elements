/**
 * main's Social stories (Components/Social), each in an email, and the same icons with the new Social: main's
 * `url` is `href`, `iconSize` is `size`, `spacing` is the gap, and the block's padding is its Section's.
 */
import { Column as MainColumn, Email as MainEmail, Row as MainRow, Social as MainSocial } from "../../index";
import { Email, Section, Social } from "../index";

type Icon = { name: string; url: string };

function design(icons: Icon[], iconType: "circle" | "rounded" | "squared", size: number, spacing: number, padding: number) {
  return {
    main: (
      <MainEmail contentWidth="600px">
        <MainRow>
          <MainColumn>
            <MainSocial icons={icons} iconType={iconType} iconSize={size} spacing={spacing} align="center" containerPadding={`${padding}px`} />
          </MainColumn>
        </MainRow>
      </MainEmail>
    ),
    next: (
      <Email width={600}>
        <Section style={{ padding }}>
          <Social icons={icons.map(({ name, url }) => ({ name, href: url.includes("@") && !url.includes(":") ? `mailto:${url}` : url }))} iconType={iconType} size={size} style={{ gap: spacing }} />
        </Section>
      </Email>
    ),
  };
}

export const bar = design(
  [
    { name: "Facebook", url: "https://facebook.com/company" },
    { name: "X", url: "https://x.com/company" },
    { name: "Instagram", url: "https://instagram.com/company" },
    { name: "LinkedIn", url: "https://linkedin.com/company" },
    { name: "YouTube", url: "https://youtube.com/company" },
  ],
  "circle",
  40,
  12,
  30
);

export const rounded = design(
  [
    { name: "Facebook", url: "https://facebook.com/company" },
    { name: "X", url: "https://x.com/company" },
    { name: "YouTube", url: "https://youtube.com/company" },
    { name: "Instagram", url: "https://instagram.com/company" },
  ],
  "rounded",
  40,
  15,
  25
);

export const squared = design(
  [
    { name: "Facebook", url: "https://facebook.com/company" },
    { name: "X", url: "https://x.com/company" },
    { name: "LinkedIn", url: "https://linkedin.com/company" },
    { name: "Instagram", url: "https://instagram.com/company" },
  ],
  "squared",
  36,
  12,
  20
);

export const footer = design(
  [
    { name: "Facebook", url: "https://facebook.com/company" },
    { name: "X", url: "https://x.com/company" },
    { name: "Instagram", url: "https://instagram.com/company" },
    { name: "Email", url: "contact@company.com" },
  ],
  "circle",
  28,
  8,
  16
);
