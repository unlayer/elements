import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Video, { parseVideoUrl } from "./Video";
import { expectNoRenderError } from "../test-utils";

describe("parseVideoUrl", () => {
  it("parses youtube.com/watch?v= URL", () => {
    const result = parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(result).toEqual({
      type: "youtube",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
    });
  });

  it("parses youtu.be/ short URL", () => {
    const result = parseVideoUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(result).toEqual({
      type: "youtube",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
    });
  });

  it("parses youtube.com/embed/ URL", () => {
    const result = parseVideoUrl("https://www.youtube.com/embed/dQw4w9WgXcQ");
    expect(result).toEqual({
      type: "youtube",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
    });
  });

  it("parses vimeo.com/ URL", () => {
    const result = parseVideoUrl("https://vimeo.com/123456789");
    expect(result).toEqual({
      type: "vimeo",
      videoId: "123456789",
      thumbnail: "",
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
    expectNoRenderError(container);
    // A page plays it where it is
    expect(container.querySelector("iframe")?.getAttribute("src")).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
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
    expectNoRenderError(container);
    expect(container.querySelector("img")?.getAttribute("src")).toContain("placeholder");
  });

  it("has correct displayName", () => {
    expect(Video.displayName).toBe("Video");
  });
});
