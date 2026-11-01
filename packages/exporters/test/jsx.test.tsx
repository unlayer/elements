import { close, Fragment, h, Merged, NotOutlook, open, Outlook, raw, styleText } from "../src/jsx";

const html = (element: unknown) => String(element);

describe("the writers' JSX", () => {
  it("writes elements, their attributes in order and their style last, leaving out what has no value", () => {
    expect(html(<td align="center" style={{ fontSize: 0 }} width={290} class={undefined} hidden={false} />)).toBe('<td align="center" width="290" style="font-size:0"></td>');
    expect(html(<img src="a.png" alt="" />)).toBe('<img src="a.png" alt="">');
    expect(html(<br />)).toBe("<br>");
  });

  it("escapes text and attributes, always", () => {
    const evil = `"><script>x</script>'`;
    const attribute = "&quot;&gt;&lt;script&gt;x&lt;/script&gt;&#39;";
    expect(html(<a href={evil}>{evil}</a>)).toBe(`<a href="${attribute}">"&gt;&lt;script&gt;x&lt;/script&gt;'</a>`);
    expect(html(<p style={{ fontFamily: `"a" </style>` }} />)).toBe('<p style="font-family:&quot;a&quot; &lt;/style&gt;"></p>');
  });

  it("writes a style's values by property: px, unitless, padding, borders and radii from their objects, short colors", () => {
    expect(
      styleText([
        { padding: { top: 8, right: 12, bottom: 8, left: 12 }, border: { top: { width: 1, style: "solid", color: "#cccccc" } }, borderRadius: 4, msoPaddingAlt: "8px 12px" },
        [["line-height", "24px"]],
        ["color", "#ffffff"],
        { lineHeight: 1.5, fontWeight: 700, width: 0, gap: undefined, maxWidth: "50%" },
      ])
    ).toBe("padding:8px 12px;border-top:1px solid #ccc;border-radius:4px;mso-padding-alt:8px 12px;line-height:24px;color:#fff;line-height:1.5;font-weight:700;width:0;max-width:50%");
  });

  it("writes fragments, lists and nothing for empty children", () => {
    const items = ["a", "b"];
    expect(html(<tr><>{items.map((item) => <td>{item}</td>)}</>{null}{false}{0}</tr>)).toBe("<tr><td>a</td><td>b</td>0</tr>");
  });

  it("writes Outlook's conditional comments, merges neighbours of a kind, and writes tags apart", () => {
    const td = <td width={100} />;
    expect(
      html(
        <Merged>
          <Outlook>{open(<table width="100%" />)}{open(td)}</Outlook>
          <Outlook>{raw("x")}</Outlook>
          <div>column</div>
          <NotOutlook><div /></NotOutlook>
          <NotOutlook><div /></NotOutlook>
          <Outlook>{close("td")}</Outlook>
        </Merged>
      )
    ).toBe('<!--[if mso]><table width="100%"><td width="100">x<![endif]--><div>column</div><!--[if !mso]><!--><div></div><div></div><!--<![endif]--><!--[if mso]></td><![endif]-->');
    // Without <Merged> each comment stays its own.
    expect(html(<><Outlook>a</Outlook><Outlook>b</Outlook></>)).toBe("<!--[if mso]>a<![endif]--><!--[if mso]>b<![endif]-->");
  });
});
