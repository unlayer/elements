import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Video, { parseVideoUrl } from "./Video";
import Email from "./Email";
import Row from "./Row";
import Column from "./Column";
import { renderToHtml } from "../utils/render-to-html";

describe("parseVideoUrl", () => {
  it("parses youtube.com/watch?v= URL", () => {
    const result = parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(result).toEqual({
      type: "youtube",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });
  });

  it("parses youtu.be/ short URL", () => {
    const result = parseVideoUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(result).toEqual({
      type: "youtube",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
      url: "https://youtu.be/dQw4w9WgXcQ",
    });
  });

  it("parses youtube.com/embed/ URL", () => {
    const result = parseVideoUrl("https://www.youtube.com/embed/dQw4w9WgXcQ");
    expect(result).toEqual({
      type: "youtube",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    });
  });

  it("parses youtube.com/shorts/ and youtube-nocookie.com URLs", () => {
    expect(parseVideoUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")?.videoId).toBe("dQw4w9WgXcQ");
    expect(parseVideoUrl("https://www.youtube.com/live/dQw4w9WgXcQ")?.videoId).toBe("dQw4w9WgXcQ");
    expect(parseVideoUrl("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")?.videoId).toBe("dQw4w9WgXcQ");
  });

  it("parses vimeo.com/ URL", () => {
    const result = parseVideoUrl("https://vimeo.com/123456789");
    expect(result).toEqual({
      type: "vimeo",
      videoId: "123456789",
      thumbnail: "",
      url: "https://vimeo.com/123456789",
    });
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

  it("email render links the thumbnail to the video URL", () => {
    const html = renderToHtml(
      <Email>
        <Row>
          <Column>
            <Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
          </Column>
        </Row>
      </Email>
    );
    // Thumbnail present AND wrapped in an anchor to the original video —
    // without the anchor the email block is a dead image.
    expect(html).toContain("img.youtube.com/vi/dQw4w9WgXcQ");
    expect(html).toMatch(
      /<a\s[^>]*href="https:\/\/www\.youtube\.com\/watch\?v=dQw4w9WgXcQ"/
    );
  });

  it("an explicit thumbnail prop wins over the parsed one (email mode shows thumbnails)", () => {
    const { container } = render(
      <Video
        mode="email"
        videoUrl="https://vimeo.com/123456789"
        thumbnail="https://example.com/thumb.png"
      />
    );
    expect(container.innerHTML).toContain("https://example.com/thumb.png");
  });

  it("warns on an unrecognized videoUrl instead of failing silently", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Video videoUrl="https://example.com/not-a-video" />);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("not a recognized")
    );
    warn.mockRestore();
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
});
