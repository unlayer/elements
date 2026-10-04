import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Timer from "./Timer";
import { renderToJson } from "../utils/render-to-json";
import Email from "./Email";
import Row from "./Row";
import Column from "./Column";

describe("Timer Component", () => {
  it("has correct displayName", () => {
    expect(Timer.displayName).toBe("Timer");
  });

  it("renders a plain <img> in email mode (no <script>) — email-client safe", () => {
    const { container } = render(
      <Timer mode="email" endTime="2026-12-31 23:59:59" timezone="UTC" />
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toContain("countdown.gif");
    // A countdown timer must never rely on JS — email clients strip it.
    expect(container.innerHTML).not.toContain("<script");
  });

  it("renders a plain <img> in web mode too", () => {
    const { container } = render(
      <Timer mode="web" endTime="2026-12-31 23:59:59" timezone="UTC" />
    );
    expect(container.querySelector("img")).not.toBeNull();
    expect(container.innerHTML).not.toContain("<script");
  });

  describe("imageUrl (custom countdown-image provider)", () => {
    const CUSTOM =
      "https://i.nifty.dev/abc123?end=2026-12-31T23:59:59Z&tz=America/Los_Angeles";

    it("uses the provided imageUrl verbatim as the <img> src", () => {
      const { container } = render(<Timer mode="email" imageUrl={CUSTOM} />);
      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img!.getAttribute("src")).toBe(CUSTOM);
    });

    it("works in web mode as well", () => {
      const { container } = render(<Timer mode="web" imageUrl={CUSTOM} />);
      expect(container.querySelector("img")!.getAttribute("src")).toBe(CUSTOM);
    });

    it("still honors other countdown props alongside imageUrl", () => {
      const { container } = render(
        <Timer mode="email" imageUrl={CUSTOM} alt="Sale ends soon" />
      );
      const img = container.querySelector("img");
      expect(img!.getAttribute("src")).toBe(CUSTOM);
      expect(img!.getAttribute("alt")).toBe("Sale ends soon");
    });
  });

  it("maps href to a clickable link (storage shape round-trips via renderToJson)", () => {
    const json = renderToJson(
      <Email>
        <Row>
          <Column>
            <Timer
              endTime="2026-12-31 23:59:59"
              timezone="UTC"
              href="https://example.com/sale"
            />
          </Column>
        </Row>
      </Email>
    );
    const timer = json.body.rows[0].columns[0].contents[0];
    expect(timer.type).toBe("timer");
    expect(timer.values.action).toEqual({
      name: "web",
      values: { href: "https://example.com/sale", target: "_blank" },
    });
  });

  it("round-trips a custom imageUrl through renderToJson as countdown.countdownUrl", () => {
    const CUSTOM = "https://i.nifty.dev/abc123?end=2026-12-31T23:59:59Z";
    const json = renderToJson(
      <Email>
        <Row>
          <Column>
            <Timer imageUrl={CUSTOM} />
          </Column>
        </Row>
      </Email>
    );
    const timer = json.body.rows[0].columns[0].contents[0];
    expect(timer.values.countdown.countdownUrl).toBe(CUSTOM);
  });
});
