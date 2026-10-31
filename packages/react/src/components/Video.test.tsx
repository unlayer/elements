import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Video, { parseVideoUrl } from "./Video";
import Email from "./Email";
import Row from "./Row";
import { Column } from "./Column";
import { renderToHtml, renderToPlainText } from "../utils/render-to-html";
import { renderToJson } from "../utils/render-to-json";

describe("parseVideoUrl", () => {
  it("parses youtube.com/watch?v= URL", () => {
    const result = parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(result).toEqual({
      url: expect.any(String),
      type: "youtube",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
    });
  });

  it("parses youtu.be/ short URL", () => {
    const result = parseVideoUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(result).toEqual({
      url: expect.any(String),
      type: "youtube",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
    });
  });

  it("parses youtube.com/embed/ URL", () => {
    const result = parseVideoUrl("https://www.youtube.com/embed/dQw4w9WgXcQ");
    expect(result).toEqual({
      url: expect.any(String),
      type: "youtube",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
    });
  });

  it("parses vimeo.com/ URL", () => {
    const result = parseVideoUrl("https://vimeo.com/123456789");
    expect(result).toEqual({
      url: "https://vimeo.com/123456789",
      type: "vimeo",
      videoId: "123456789",
      thumbnail: "",
    });
  });

  it("parses the other forms of a YouTube URL people share: Shorts, live, the no-cookie embed, `v` after other parameters", () => {
    // Each fell back to the placeholder image.
    for (const url of ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube.com/live/dQw4w9WgXcQ?si=abc", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ"]) {
      expect(parseVideoUrl(url), url).toEqual({ url, type: "youtube", videoId: "dQw4w9WgXcQ", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg" });
    }
  });

  it("returns null for unrecognized URL", () => {
    const result = parseVideoUrl("https://example.com/video.mp4");
    expect(result).toBeNull();
  });
});

describe("Video Component", () => {
  it("renders a placeholder image by default", () => {
    const { container } = render(<Video mode="email" />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toContain("placeholder");
  });

  it("renders with videoUrl shorthand without crashing", () => {
    const { container } = render(
      <Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
    );
    expect(container.firstChild).toBeTruthy();
    // YouTube thumbnail URL should be in output
    expect(container.innerHTML).toContain("youtube");
  });

  it("links an email's thumbnail to the video given as `videoUrl`, lists it in the plain text and keeps it in the design", () => {
    // The thumbnail linked nowhere and the text said `[Video]`: the URL wasn't kept (0.2 too).
    for (const url of ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://vimeo.com/76979871"]) {
      const email = <Email><Row><Column><Video videoUrl={url} /></Column></Row></Email>;
      expect(renderToHtml(email), url).toContain(`href="${url}"`);
      expect(renderToPlainText(email), url).toContain(url);
      expect((renderToJson(email).body.rows[0].columns[0].contents[0].values as { video: { url?: string } }).video.url, url).toBe(url);
    }
  });

  it("renders with full values object", () => {
    const { container } = render(
      <Video mode="email" values={{
        video: { type: "youtube", videoId: "dQw4w9WgXcQ", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg", loading: false }
      }} />
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toContain("dQw4w9WgXcQ");
  });

  it("renders without crashing with defaults", () => {
    const { container } = render(<Video />);
    expect(container.firstChild).toBeTruthy();
  });

  it("has correct displayName", () => {
    expect(Video.displayName).toBe("Video");
  });

  it("sizes its thumbnail in its slot: the column less the block's default 10px padding, as the editor does", () => {
    const html = renderToHtml(
      <Email>
        <Row padding="24px 0px">
          <Column padding="0px 24px">
            <Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
          </Column>
        </Row>
      </Email>
    );
    // 500 content − 24px×2 column padding − 10px×2 block padding = 432.
    expect(html).toMatch(/max-width: 432px;" width="432"/);
  });
});
