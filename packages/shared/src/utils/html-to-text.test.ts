import { describe, it, expect } from "vitest";
import { htmlToPlainText } from "./html-to-text";

describe("htmlToPlainText", () => {
  it("returns empty string for empty input", () => {
    expect(htmlToPlainText("")).toBe("");
    expect(htmlToPlainText(undefined as any)).toBe("");
  });

  it("keeps preformatted text (code) as it is: its indentation, blank lines and markup's text", () => {
    const html = '<p>Before</p><pre style="x"><code><span style="color:red">if</span> (a) {\n    go(&quot;x&quot;);\n\n  }</code></pre><p>After</p>';
    expect(htmlToPlainText(html)).toBe('Before\nif (a) {\n    go("x");\n\n  }\nAfter');
  });

  it("returns plain text unchanged", () => {
    expect(htmlToPlainText("Hello World")).toBe("Hello World");
  });

  // Headings
  it("converts h1/h2 to uppercase", () => {
    expect(htmlToPlainText("<h1>Welcome</h1>")).toBe("WELCOME");
    expect(htmlToPlainText("<h2>Features</h2>")).toBe("FEATURES");
  });

  it("keeps an email service's tags (`<%first_name%>`), which a browser reads as text too: in headings as written", () => {
    expect(htmlToPlainText("<p>Hi <%first_name%>, <b>bold</b> <%= user.name %></p><h1>Hi <%first_name%></h1><ul><li>For <%company%></li></ul>")).toBe(
      "Hi <%first_name%>, bold <%= user.name %>\n\nHI <%first_name%>\n- For <%company%>"
    );
    // What isn't one is still a tag.
    expect(htmlToPlainText("<p>a<%b c>d</p>")).toBe("ad");
  });

  it("uppercases an h1/h2 around its entities, which still decode (`Q&A`, not `Q&AMP;A`)", () => {
    expect(htmlToPlainText("<h1>Q&amp;A &lt;3 caf\u00e9</h1>")).toBe("Q&A <3 CAF\u00c9");
  });

  it("converts h3-h6 as-is (not uppercased)", () => {
    expect(htmlToPlainText("<h3>Details</h3>")).toBe("Details");
    expect(htmlToPlainText("<h6>Fine Print</h6>")).toBe("Fine Print");
  });

  // Links
  it("converts links to text (url) format", () => {
    const html = '<a href="https://example.com">Click here</a>';
    expect(htmlToPlainText(html)).toBe("Click here (https://example.com)");
  });

  it("avoids duplicate URL when link text equals href", () => {
    const html = '<a href="https://example.com">https://example.com</a>';
    expect(htmlToPlainText(html)).toBe("https://example.com");
  });

  it("keeps a heading's links as a paragraph's, in each `links` mode, their URLs as written (not in capitals)", () => {
    const html = '<h1><a href="https://example.com/Pay?id=A1&amp;b=2">Pay invoice</a></h1><h3>See <strong><a href="https://example.com/Terms">terms</a></strong></h3><h2><a href="https://example.com/Docs">https://example.com/Docs</a></h2>';
    expect(htmlToPlainText(html)).toBe("PAY INVOICE (https://example.com/Pay?id=A1&b=2)\n\nSee terms (https://example.com/Terms)\n\nhttps://example.com/Docs");
    expect(htmlToPlainText(html, { links: "after" })).toBe("PAY INVOICE [1]\n\nSee terms [2]\n\nhttps://example.com/Docs\n\n[1] https://example.com/Pay?id=A1&b=2\n[2] https://example.com/Terms");
    expect(htmlToPlainText(html, { links: "none" })).toBe("PAY INVOICE\n\nSee terms\n\nhttps://example.com/Docs");
    expect(htmlToPlainText(html, { uppercaseHeadings: false })).toMatch(/^Pay invoice \(https:\/\/example\.com\/Pay\?id=A1&b=2\)\n/);
  });

  it("keeps a link's whole URL, whichever quote its attribute is in, and a link in preformatted text", () => {
    expect(htmlToPlainText(`<p><a href="https://example.com/it's">a</a> <a title='x > y' href='https://example.com/"q"'>b</a> <a data-href="x" href="https://example.com/c">c</a></p>`)).toBe(
      `a (https://example.com/it's) b (https://example.com/"q") c (https://example.com/c)`
    );
    expect(htmlToPlainText('<pre>run <a href="https://example.com/cli">the CLI</a>\n  then</pre>', { links: "after" })).toBe("run the CLI [1]\n  then\n\n[1] https://example.com/cli");
  });

  // Line breaks
  it("converts <br> to newlines", () => {
    expect(htmlToPlainText("Line 1<br>Line 2")).toBe("Line 1\nLine 2");
    expect(htmlToPlainText("Line 1<br/>Line 2")).toBe("Line 1\nLine 2");
    expect(htmlToPlainText("Line 1<br />Line 2")).toBe("Line 1\nLine 2");
    // In a heading, a link and a list item too.
    expect(htmlToPlainText("<h1>Welcome back,<br>Ada</h1>")).toBe("WELCOME BACK,\nADA");
    expect(htmlToPlainText('<a href="https://x.com/t">Track<br>order</a>')).toBe("Track\norder (https://x.com/t)");
    expect(htmlToPlainText("<ul><li>One<br>more</li></ul>")).toBe("- One\nmore");
  });

  // Block elements
  it("converts closing block tags to newlines", () => {
    expect(htmlToPlainText("<p>Paragraph 1</p><p>Paragraph 2</p>")).toBe("Paragraph 1\nParagraph 2");
  });

  // Lists
  it("converts list items to dashes", () => {
    const html = "<ul><li>First</li><li>Second</li><li>Third</li></ul>";
    expect(htmlToPlainText(html)).toBe("- First\n- Second\n- Third");
  });

  // Horizontal rules
  it("converts <hr> to dashes", () => {
    expect(htmlToPlainText("Above<hr>Below")).toBe("Above\n---\nBelow");
  });

  // Images
  it("converts images with alt text to [alt]", () => {
    expect(htmlToPlainText('<img alt="Logo" src="logo.png">')).toBe("[Logo]");
  });

  it("removes images without alt text", () => {
    expect(htmlToPlainText('<img src="logo.png">')).toBe("");
  });

  // Entities
  it("decodes named HTML entities", () => {
    expect(htmlToPlainText("&amp; &lt; &gt; &quot;")).toBe('& < > "');
    expect(htmlToPlainText("&nbsp;")).toBe("");
    expect(htmlToPlainText("&copy; 2026")).toBe("\u00A9 2026");
  });

  it("decodes numeric HTML entities", () => {
    expect(htmlToPlainText("&#169;")).toBe("\u00A9"); // ©
    expect(htmlToPlainText("&#x00A9;")).toBe("\u00A9"); // ©
  });

  it("decodes common currency and symbol named entities", () => {
    expect(htmlToPlainText("Price &pound;5, &euro;9, &yen;100, &cent;50")).toBe(
      "Price £5, €9, ¥100, ¢50"
    ); // pound euro yen cent
    expect(htmlToPlainText("5&deg; &times; &frac12; &divide; &plusmn;")).toBe(
      "5° × ½ ÷ ±"
    ); // deg times frac12 divide plusmn
    expect(htmlToPlainText("&sect;2 &para;3 &micro;g")).toBe(
      "§2 ¶3 µg"
    ); // sect para micro
  });

  it("decodes typographic quote named entities", () => {
    expect(htmlToPlainText("&ldquo;Hi&rdquo; &lsquo;yo&rsquo;")).toBe(
      "“Hi” ‘yo’"
    );
  });

  it("decodes Latin-1 accented named entities", () => {
    // Cafe resume naive Zoe Francois Munoz Strasse (with accents)
    expect(
      htmlToPlainText(
        "Caf&eacute; r&eacute;sum&eacute; na&iuml;ve Zo&euml; Fran&ccedil;ois Mu&ntilde;oz Stra&szlig;e"
      )
    ).toBe(
      "Café résumé naïve Zoë François Muñoz Straße"
    );
  });

  it("leaves unknown named entities untouched", () => {
    expect(htmlToPlainText("&notanentity; x")).toBe("&notanentity; x");
  });

  // Skip elements
  it("skips elements with data-skip-in-text attribute", () => {
    const html = '<div data-skip-in-text="true">hidden preview</div><p>Visible content</p>';
    expect(htmlToPlainText(html)).toBe("Visible content");
  });

  // Style/script/head removal
  it("removes style, script, and head blocks", () => {
    const html = "<style>.foo { color: red; }</style><script>alert(1)</script><p>Content</p>";
    expect(htmlToPlainText(html)).toBe("Content");
  });

  // Whitespace collapsing
  it("collapses multiple blank lines to max 2", () => {
    const html = "<p>One</p><p></p><p></p><p></p><p>Two</p>";
    const text = htmlToPlainText(html);
    expect(text).not.toContain("\n\n\n");
  });

  it("trims leading and trailing whitespace", () => {
    const html = "  <p>Hello</p>  ";
    expect(htmlToPlainText(html)).toBe("Hello");
  });

  // Complex example
  it("handles a realistic email fragment", () => {
    const html = `
      <div data-skip-in-text="true">Preview text here</div>
      <h1>Order Confirmed</h1>
      <p>Thank you for your purchase.</p>
      <a href="https://store.com/track">Track your order</a>
      <hr>
      <p>Store Inc &copy; 2026</p>
    `;
    const text = htmlToPlainText(html);
    expect(text).toContain("ORDER CONFIRMED");
    expect(text).toContain("Thank you for your purchase.");
    expect(text).toContain("Track your order (https://store.com/track)");
    expect(text).toContain("---");
    expect(text).toContain("\u00A9 2026");
    expect(text).not.toContain("Preview text here");
  });

  describe("options", () => {
    const html = '<h1>Hello &amp; welcome</h1><p>Read <a href="https://example.com/a?b=1&amp;c=2">the guide</a> and <a href="https://example.com/b">the FAQ</a>.</p><div class="footer md:x">Unsubscribe <a href="https://example.com/u">here</a></div><img src="x.png" alt="Logo"><p>One two three four five six seven eight</p>';

    it("write the same text without them as with none given", () => {
      expect(htmlToPlainText(html, {})).toBe(htmlToPlainText(html));
      expect(htmlToPlainText(html)).toBe(
        "HELLO & WELCOME\nRead the guide (https://example.com/a?b=1&c=2) and the FAQ (https://example.com/b).\nUnsubscribe here (https://example.com/u)\n[Logo]One two three four five six seven eight"
      );
    });

    it("links: inline (the default), listed after the text, or left out", () => {
      expect(htmlToPlainText(html, { links: "after" })).toBe(
        "HELLO & WELCOME\nRead the guide [1] and the FAQ [2].\nUnsubscribe here [3]\n[Logo]One two three four five six seven eight\n\n[1] https://example.com/a?b=1&c=2\n[2] https://example.com/b\n[3] https://example.com/u"
      );
      expect(htmlToPlainText(html, { links: "none" })).toContain("Read the guide and the FAQ.\nUnsubscribe here\n");
    });

    it("headings as written, and lines wrapped between words", () => {
      expect(htmlToPlainText(html, { uppercaseHeadings: false })).toMatch(/^Hello & welcome\n/);
      const wrapped = htmlToPlainText("<p>One two three four five six seven eight</p><p>https://example.com/a-very-long-link-that-cannot-wrap</p>", { wordwrap: 12 });
      expect(wrapped).toBe("One two\nthree four\nfive six\nseven eight\nhttps://example.com/a-very-long-link-that-cannot-wrap");
    });

    it("skip elements by tag or class, with what's in them, as data-skip-in-text marks them", () => {
      expect(htmlToPlainText(html, { skip: ["img", ".md:x", "h1"] })).toBe("Read the guide (https://example.com/a?b=1&c=2) and the FAQ (https://example.com/b).\nOne two three four five six seven eight");
      expect(htmlToPlainText('<div data-skip-in-text="true"><div>nested <div>deep</div></div> gone</div><p>kept</p>')).toBe("kept");
      // A class that only starts like it isn't it.
      expect(htmlToPlainText('<p class="footers">kept</p>', { skip: [".footer"] })).toBe("kept");
    });
  });

  describe("in time linear in the HTML's size, whatever it holds", () => {
    const fill = (unit: string, bytes: number) => unit.repeat(Math.ceil(bytes / unit.length)).slice(0, bytes);
    const time = (html: string, options?: Parameters<typeof htmlToPlainText>[1]) => {
      const start = performance.now();
      htmlToPlainText(html, options);
      return performance.now() - start;
    };

    it("reads tags nothing closes, and runs of spaces in preformatted text, once", () => {
      // Each regex looked from each place it could start to the end where nothing ended it, again from the next: 40
      // KB of `<img alt="a" ` took a minute, 80,000 spaces in a <pre> 11 s.
      const shapes = ["<", "<<", '<img alt="a" ', "<a  ", "<a href=\"x\">", "<a '", "<li>", "<h1>", "<h3>", "<pre>", "<pre x", "<hr", "<img ", "<head", "<style", "<script", "<!--", "<a-0-0-0", '<div data-skip-in-text="true">', "<%\"", "<&"];
      for (const unit of shapes) expect([unit, time(fill(unit, 102400)) < 500]).toEqual([unit, true]);
      expect(time("<pre>\n" + " ".repeat(102400) + "x\n</pre>")).toBeLessThan(500);
      // As before: its lines' trailing spaces off, its indentation kept.
      expect(htmlToPlainText("<pre>\n" + " ".repeat(1000) + "x  \n</pre>")).toBe("\n" + " ".repeat(1000) + "x\n");
    });

    it("costs about ten times as much for ten times as much of any short shape (random, seeded)", () => {
      const pieces = ["<a ", '<a href="x">', "</a>", "<li>", "</li>", "<h1>", "</h1>", "<h3>", "<pre>", "</pre>", "</td>", "<img ", '<img alt="a" ', "alt=", '"', "'", ">", "/>", "<", "<!--", "-->", "<head", "</head>", "<style", "<script", "<br", " ", "\t", "\n", "\r", "\u2028", "a", "&", "&amp;", "<%", "%>", "<p>", "</p>", '<div data-skip-in-text="true">', "<div>", "</div>", "<hr", "-", "x-"];
      let seed = 7;
      const random = (n: number) => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0), Math.floor((seed / 2 ** 32) * n));
      const slow: string[] = [];
      for (let run = 0; run < 150; run++) {
        let unit = "";
        for (let i = 0, n = 1 + random(5); i < n; i++) unit += pieces[random(pieces.length)];
        const options = [{}, { links: "after" as const }, { skip: ["img", ".promo"] }][random(3)];
        const small = Math.max(time(fill(unit, 10240), options), 1);
        const large = time(fill(unit, 102400), options);
        if (large > 20 * small && large > 50) slow.push(`${JSON.stringify(unit)}: ${small.toFixed(1)} ms for 10 KB, ${large.toFixed(1)} ms for 100 KB`);
      }
      expect(slow).toEqual([]);
    }, 60_000);
  });
});

