// The inputs of the final review of the switch to the new engine: templates of today's components the
// stories and generated templates don't reach, each in an email, a page and a printed document. corpus/sync.mjs writes
// them to corpus/review/ (review-<name>-<root>.tsx), and the harness renders each as `rev-<name>-<root>`.
const svg = (w, h) => `"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><rect width='100%' height='100%' fill='%23c33'/></svg>"`;
const cell = (blocks, rootProps = "") => (Root) => `<${Root} ${rootProps}><Row><Column>${blocks}</Column></Row></${Root}>`;

export const INPUTS = {
  entities: cell(`<Paragraph html="&copy; 2024 Acme &mdash; all &euro;10 &rsquo;" /><Heading values={{ text: "&copy; x" } as any} /><Button href="https://example.com" values={{ text: "&euro;5" } as any} />`),
  "entity-no-semicolon": cell(`<Paragraph html="&copy 2024 S&P 500" />`),
  comments: cell(`<Paragraph html="Hello <!-- note to self --> world" /><Paragraph html="a<?php echo 1 ?>b" />`),
  "p-margins": cell(`<Paragraph html="<p>One</p><p>Two</p>" /><Paragraph html={"<p>One</p>\\n<p>Two</p>"} />`),
  "link-targets": cell(`<Paragraph html='Open <a href="https://example.com" target="_parent">the parent</a> or <a href="https://example.com" rel="nofollow">this</a>' />`),
  liquid: cell(`<Paragraph html="{% if orders > 1 %}Thanks{% endif %}" /><Paragraph html='Hi {{ name | default: "there" }}' />`),
  "row-anchor": (Root) => `<${Root}><Row><Column><Paragraph html='<a href="#details">Go to details</a>' /></Column></Row><Row anchor="details"><Column><Paragraph>Details</Paragraph></Column></Row></${Root}>`,
  "content-width-100": cell(`<Paragraph>Fluid content that runs the whole width of the window it is shown in</Paragraph>`, `contentWidth="100%"`),
  "content-width-80": cell(`<Paragraph>Content at eighty percent of the window</Paragraph>`, `contentWidth="80%"`),
  "phone-padding-0": (Root) => `<${Root}><Row><Column padding="40px" mobile={{ padding: "0px" } as any}><Paragraph>Mobile content without padding on phones</Paragraph></Column></Row></${Root}>`,
  "row-align-items": (Root) => `<${Root}><Row cells={[1, 1]} values={{ alignItems: "center" } as any}><Column backgroundColor="#eeeeee"><Paragraph>Short</Paragraph></Column><Column><Paragraph html="Long<br>Long<br>Long<br>Long" /></Column></Row></${Root}>`,
  "linked-images": cell(`<Image src=${svg(100, 50)} alt="a" action={{ url: "https://example.com" } as any} /><Image src=${svg(1000, 500)} alt="b" width={150} action={{ url: "https://example.com" } as any} />`),
  "stacked-images": (Root) => `<${Root}><Row cells={[1, 1]}><Column><Image src={{ url: ${svg(600, 300)}, width: 600, height: 300 }} alt="a" /></Column><Column><Image src={{ url: ${svg(600, 300)}, width: 600, height: 300 }} alt="b" /></Column></Row><Row cells={[1, 1, 1]}><Column><Image src={{ url: ${svg(600, 300)}, width: 600, height: 300 }} alt="c" /></Column><Column><Image src={{ url: ${svg(600, 300)}, width: 600, height: 300 }} width="50%" alt="d" /></Column><Column><Paragraph>Text</Paragraph></Column></Row></${Root}>`,
  "button-width": cell(`<Button href="https://example.com" width={300}>Go</Button><Button href="https://example.com" width="50%">Half</Button><Button href="https://example.com" width="100%">All</Button>`),
  "link-style": cell(`<Paragraph html='<a href="https://example.com">link</a> rest' linkStyle={{ inherit: false, linkColor: "#00ff00", linkUnderline: false } as any} />`),
  "flat-hide": cell(`<Paragraph values={{ hideDesktop: true } as any}>Shown on desktop</Paragraph><Paragraph values={{ hideMobile: true } as any}>Shown on phones</Paragraph>`),
  "own-direction": cell(`<Paragraph textDirection="rtl">Hello (world)!</Paragraph>`),
  "narrow-page": cell(`<Paragraph>Narrow content on a page narrower than a phone</Paragraph>`, `contentWidth="320px"`),
  "long-preview": cell(`<Paragraph>Body</Paragraph>`, `previewText={"${"A".repeat(200)}"}`),
  "underline-strike": cell(`<Paragraph html="<u><s>both</s></u> and <s><u>both</u></s>" />`),
  "heading-span": cell(`<Heading values={{ text: 'H <span style="font-size:60px">BIG</span>' } as any} /><Paragraph html='a <span style="font-size:28px">BIG</span> b' />`),
};
export const ROOTS = ["Email", "Page", "Document"];
