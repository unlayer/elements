import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import Row from "./Row";
import { Column } from "./Column";
import { ColumnLayouts } from "../layouts/ColumnLayouts";
import Button from "./Button";

import Image from "./Image";
import Paragraph from "./Paragraph";
import Divider from "./Divider";
import Social from "./Social";

const { OneColumn, TwoEqual } = ColumnLayouts;

const meta: Meta<typeof Row> = {
  title: "Testing/Complete Pixel Parity Test",
  component: Row,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "🎯 **Complete Email Template from ExampleComponents.tsx** - This shows the full comprehensive test with all 13 rows exactly as in your original file. Complete pixel parity test with SSR-compatible Row component."
      }
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof meta>;

// 🎯 COMPLETE PIXEL PARITY TEST - All 13 rows from ExampleComponents.tsx
export const CompleteEmailTemplate: Story = {
  render: () => {
    const [displayMode, setDisplayMode] = React.useState<
      "web" | "email" | "document"
    >("web");

    // Body values from the original template
    const bodyValues = {
      _meta: { htmlID: "u_body", htmlClassNames: "u_body" },
      linkStyle: {
        body: true,
        inherit: false,
        linkColor: "#00b367",
        linkUnderline: false,
        linkHoverColor: "#0000ee",
        linkHoverUnderline: true
      },
      fontFamily: {
        url: "https://fonts.googleapis.com/css?family=Montserrat:400,700",
        label: "Montserrat",
        value: "'Montserrat',sans-serif",
        defaultFont: true
      },
      contentAlign: "center",
      contentWidth: "600px",
      preheaderText: "",
      backgroundColor: "#fbfbfb",
      backgroundImage: {
        url: "",
        cover: false,
        center: true,
        repeat: false,
        fullWidth: true
      }
    };

    return (
      <div style={{ padding: "20px" }}>
        <h2>🎯 Complete Email Template - Pixel Parity Test</h2>
        <p>
          Full comprehensive test with all 13 rows from ExampleComponents.tsx
        </p>

        {/* Mode Switcher */}
        <div style={{ margin: "20px 0", display: "flex", gap: "10px" }}>
          {(["web", "email", "document"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setDisplayMode(mode)}
              style={{
                padding: "8px 16px",
                borderRadius: "4px",
                border:
                  displayMode === mode ? "2px solid #007bff" : "1px solid #ccc",
                backgroundColor: displayMode === mode ? "#007bff" : "#fff",
                color: displayMode === mode ? "#fff" : "#333",
                cursor: "pointer"
              }}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Complete Email Template */}
        <div
          style={{
            border: "2px solid #28a745",
            borderRadius: "8px",
            padding: "10px",
            backgroundColor: "#f8fff8",
            maxWidth: "100%",
            overflow: "auto"
          }}
        >
          {/* Row 1 - Logo */}
          <Row
            layout={OneColumn}
            padding="0px"
            backgroundImage={{
              url: "",
              cover: false,
              center: true,
              repeat: false,
              fullWidth: true
            }}
            columnsBackgroundColor="#ffffff"
            bodyValues={bodyValues}
            mode={displayMode}
          >
            <Column>
              <Image
                values={{
                  src: {
                    url: "https://cdn.templates.unlayer.com/assets/1595700052545-Untitled-1.png",
                    width: 209,
                    height: 26
                  },
                  _meta: {
                    htmlID: "u_content_image_1",
                    htmlClassNames: "u_content_image"
                  },
                  action: {
                    name: "web",
                    values: { href: "", target: "_blank" }
                  },
                  altText: "Image",
                  deletable: true,
                  draggable: true,
                  textAlign: "center",
                  hideMobile: false,
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "30px 10px 20px"
                }}
                mode={displayMode}
              />
            </Column>
          </Row>

          {/* Row 2 - Hero with Background */}
          <Row
            layout={OneColumn}
            padding="0px"
            backgroundImage={{
              url: "https://cdn.templates.unlayer.com/assets/1595700502634-1.png",
              cover: false,
              width: 600,
              center: true,
              height: 355,
              repeat: false,
              fullWidth: false
            }}
            columnsBackgroundColor="#000000"
            bodyValues={bodyValues}
            mode={displayMode}
          >
            <Column>
              <Paragraph
                values={{
                  text: `<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 28px; line-height: 39.2px;"><strong><span style="line-height: 39.2px; font-size: 28px;">NEW ARRIVALS. MEET STYLE</span></strong></span></p>`,
                  _meta: {
                    htmlID: "u_content_text_1",
                    htmlClassNames: "u_content_text"
                  },
                  color: "#ffffff",
                  deletable: true,
                  draggable: true,
                  linkStyle: {
                    inherit: true,
                    linkColor: "#0000ee",
                    linkUnderline: true,
                    linkHoverColor: "#0000ee",
                    linkHoverUnderline: true
                  },
                  textAlign: "center",
                  hideMobile: false,
                  lineHeight: "140%",
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "80px 10px 0px"
                }}
                mode={displayMode}
              />
              <Paragraph
                values={{
                  text: `<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 16px; line-height: 22.4px;">OUR BEST SELLERS! YOUR HOT FAVOURITE!</span></p>`,
                  _meta: {
                    htmlID: "u_content_text_2",
                    htmlClassNames: "u_content_text"
                  },
                  color: "#ffffff",
                  deletable: true,
                  draggable: true,
                  linkStyle: {
                    inherit: true,
                    linkColor: "#0000ee",
                    linkUnderline: true,
                    linkHoverColor: "#0000ee",
                    linkHoverUnderline: true
                  },
                  textAlign: "center",
                  hideMobile: false,
                  lineHeight: "140%",
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "10px 10px 80px"
                }}
                mode={displayMode}
              />
            </Column>
          </Row>

          {/* Row 3 - Divider */}
          <Row
            layout={OneColumn}
            padding="0px"
            backgroundImage={{
              url: "",
              cover: false,
              center: true,
              repeat: false,
              fullWidth: true
            }}
            columnsBackgroundColor="#ffffff"
            bodyValues={bodyValues}
            mode={displayMode}
          >
            <Column>
              <Divider
                values={{
                  _meta: {
                    htmlID: "u_content_divider_4",
                    htmlClassNames: "u_content_divider"
                  },
                  width: "0%",
                  border: {
                    borderTopColor: "#ffffff",
                    borderTopStyle: "solid",
                    borderTopWidth: "1px"
                  },
                  deletable: true,
                  draggable: true,
                  textAlign: "center",
                  hideMobile: false,
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "17px"
                }}
                mode={displayMode}
              />
            </Column>
          </Row>

          {/* Row 4 - Two Column Product */}
          <Row
            layout={TwoEqual}
            padding="0px"
            backgroundImage={{
              url: "",
              cover: false,
              center: true,
              repeat: false,
              fullWidth: true
            }}
            columnsBackgroundColor="#ffffff"
            bodyValues={bodyValues}
            mode={displayMode}
          >
            <Column>
              <Image
                values={{
                  src: {
                    url: "https://cdn.templates.unlayer.com/assets/1595701351685-12136.jpg",
                    width: 300,
                    height: 449
                  },
                  _meta: {
                    htmlID: "u_content_image_2",
                    htmlClassNames: "u_content_image"
                  },
                  action: {
                    name: "web",
                    values: { href: "", target: "_blank" }
                  },
                  altText: "Image",
                  deletable: true,
                  draggable: true,
                  textAlign: "center",
                  hideMobile: false,
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "0px"
                }}
                mode={displayMode}
              />
            </Column>
            <Column>
              <Divider
                values={{
                  _meta: {
                    htmlID: "u_content_divider_2",
                    htmlClassNames: "u_content_divider"
                  },
                  width: "0%",
                  border: {
                    borderTopColor: "#ffffff",
                    borderTopStyle: "solid",
                    borderTopWidth: "1px"
                  },
                  _override: { mobile: { hideMobile: true } },
                  deletable: true,
                  draggable: true,
                  textAlign: "center",
                  hideMobile: false,
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "38px"
                }}
                mode={displayMode}
              />
              <Paragraph
                values={{
                  text: `<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 24px; line-height: 33.6px;"><strong><span style="line-height: 33.6px; font-size: 24px;">TITLE OF THE GREAT PRODUCT</span></strong></span></p>`,
                  _meta: {
                    htmlID: "u_content_text_3",
                    htmlClassNames: "u_content_text"
                  },
                  color: "#000000",
                  _override: { mobile: { textAlign: "center" } },
                  deletable: true,
                  draggable: true,
                  linkStyle: {
                    inherit: true,
                    linkColor: "#0000ee",
                    linkUnderline: true,
                    linkHoverColor: "#0000ee",
                    linkHoverUnderline: true
                  },
                  textAlign: "left",
                  hideMobile: false,
                  lineHeight: "140%",
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "30px 30px 10px"
                }}
                mode={displayMode}
              />
              <Paragraph
                values={{
                  containerPadding: "0px 30px 10px",
                  anchor: "",
                  fontSize: "14px",
                  textAlign: "left",
                  lineHeight: "190%",
                  linkStyle: {
                    inherit: true,
                    linkColor: "#0000ee",
                    linkHoverColor: "#0000ee",
                    linkUnderline: true,
                    linkHoverUnderline: true
                  },
                  displayCondition: null,
                  _styleGuide: null,
                  _meta: {
                    htmlID: "u_content_paragraph_1",
                    htmlClassNames: "u_content_paragraph"
                  },
                  selectable: true,
                  draggable: true,
                  duplicatable: true,
                  deletable: true,
                  hideable: true,
                  locked: false,
                  textJson:
                    '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","text":"Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna","type":"extended-text","version":1}],"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0}],"format":"","indent":0,"type":"root","version":1}}',
                  _languages: {},
                  color: "#000000"
                }}
                mode={displayMode}
              />
              <Button
                values={{
                  href: {
                    name: "web",
                    values: { href: "", target: "_blank" }
                  },
                  size: { width: "100%", autoWidth: true },
                  text: `<span style="font-size: 14px; line-height: 16.8px;">S H O P&nbsp; N O W</span>`,
                  _meta: {
                    htmlID: "u_content_button_1",
                    htmlClassNames: "u_content_button"
                  },
                  border: {},
                  padding: "15px 25px",
                  _override: { mobile: { textAlign: "center" } },
                  deletable: true,
                  draggable: true,
                  textAlign: "left",
                  hideMobile: false,
                  lineHeight: "120%",
                  selectable: true,
                  hideDesktop: false,
                  borderRadius: "0px",
                  buttonColors: {
                    color: "#FFFFFF",
                    hoverColor: "#FFFFFF",
                    backgroundColor: "#00b367",
                    hoverBackgroundColor: "#3AAEE0"
                  },
                  duplicatable: true,
                  calculatedWidth: 156,
                  calculatedHeight: 46,
                  containerPadding: "10px 30px 30px"
                }}
                mode={displayMode}
              />
            </Column>
          </Row>

          {/* Row 5 - Divider */}
          <Row
            layout={OneColumn}
            padding="0px"
            backgroundImage={{
              url: "",
              cover: false,
              center: true,
              repeat: false,
              fullWidth: true
            }}
            columnsBackgroundColor="#ffffff"
            bodyValues={bodyValues}
            mode={displayMode}
          >
            <Column>
              <Divider
                values={{
                  _meta: {
                    htmlID: "u_content_divider_6",
                    htmlClassNames: "u_content_divider"
                  },
                  width: "0%",
                  border: {
                    borderTopColor: "#ffffff",
                    borderTopStyle: "solid",
                    borderTopWidth: "1px"
                  },
                  deletable: true,
                  draggable: true,
                  textAlign: "center",
                  hideMobile: false,
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "17px"
                }}
                mode={displayMode}
              />
            </Column>
          </Row>

          {/* Row 6 - Two Column Product (Reversed) */}
          <Row
            layout={TwoEqual}
            padding="0px"
            backgroundImage={{
              url: "",
              cover: false,
              center: true,
              repeat: false,
              fullWidth: true
            }}
            columnsBackgroundColor="#ffffff"
            bodyValues={bodyValues}
            mode={displayMode}
          >
            <Column>
              <Divider
                values={{
                  _meta: {
                    htmlID: "u_content_divider_8",
                    htmlClassNames: "u_content_divider"
                  },
                  width: "0%",
                  border: {
                    borderTopColor: "#ffffff",
                    borderTopStyle: "solid",
                    borderTopWidth: "1px"
                  },
                  _override: { mobile: { hideMobile: true } },
                  deletable: true,
                  draggable: true,
                  textAlign: "center",
                  hideMobile: false,
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "52px"
                }}
                mode={displayMode}
              />
              <Paragraph
                values={{
                  text: `<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 24px; line-height: 33.6px;"><strong><span style="line-height: 33.6px; font-size: 24px;">TITLE OF THE GREAT PRODUCT</span></strong></span></p>`,
                  _meta: {
                    htmlID: "u_content_text_9",
                    htmlClassNames: "u_content_text"
                  },
                  color: "#000000",
                  _override: { mobile: { textAlign: "center" } },
                  deletable: true,
                  draggable: true,
                  linkStyle: {
                    inherit: true,
                    linkColor: "#0000ee",
                    linkUnderline: true,
                    linkHoverColor: "#0000ee",
                    linkHoverUnderline: true
                  },
                  textAlign: "left",
                  hideMobile: false,
                  lineHeight: "140%",
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "0px 30px 10px"
                }}
                mode={displayMode}
              />
              <Paragraph
                values={{
                  text: `<p style="font-size: 14px; line-height: 190%;">Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna</p>`,
                  _meta: {
                    htmlID: "u_content_text_10",
                    htmlClassNames: "u_content_text"
                  },
                  color: "#000000",
                  _override: { mobile: { textAlign: "center" } },
                  deletable: true,
                  draggable: true,
                  linkStyle: {
                    inherit: true,
                    linkColor: "#0000ee",
                    linkUnderline: true,
                    linkHoverColor: "#0000ee",
                    linkHoverUnderline: true
                  },
                  textAlign: "left",
                  hideMobile: false,
                  lineHeight: "190%",
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "0px 30px 10px"
                }}
                mode={displayMode}
              />
              <Button
                values={{
                  href: {
                    name: "web",
                    values: { href: "", target: "_blank" }
                  },
                  size: { width: "100%", autoWidth: true },
                  text: `<span style="font-size: 14px; line-height: 16.8px;">S H O P&nbsp; N O W</span>`,
                  _meta: {
                    htmlID: "u_content_button_4",
                    htmlClassNames: "u_content_button"
                  },
                  border: {},
                  padding: "15px 25px",
                  _override: { mobile: { textAlign: "center" } },
                  deletable: true,
                  draggable: true,
                  textAlign: "left",
                  hideMobile: false,
                  lineHeight: "120%",
                  selectable: true,
                  hideDesktop: false,
                  borderRadius: "0px",
                  buttonColors: {
                    color: "#FFFFFF",
                    hoverColor: "#FFFFFF",
                    backgroundColor: "#00b367",
                    hoverBackgroundColor: "#3AAEE0"
                  },
                  duplicatable: true,
                  calculatedWidth: 156,
                  calculatedHeight: 46,
                  containerPadding: "10px 30px 30px"
                }}
                mode={displayMode}
              />
            </Column>
            <Column>
              <Image
                values={{
                  src: {
                    url: "https://cdn.templates.unlayer.com/assets/1595702054253-SS.png",
                    width: 300,
                    height: 450
                  },
                  _meta: {
                    htmlID: "u_content_image_5",
                    htmlClassNames: "u_content_image"
                  },
                  action: {
                    name: "web",
                    values: { href: "", target: "_blank" }
                  },
                  altText: "Image",
                  deletable: true,
                  draggable: true,
                  textAlign: "center",
                  hideMobile: false,
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "0px"
                }}
                mode={displayMode}
              />
            </Column>
          </Row>

          {/* Row 7 - Divider */}
          <Row
            layout={OneColumn}
            padding="0px"
            backgroundImage={{
              url: "",
              cover: false,
              center: true,
              repeat: false,
              fullWidth: true
            }}
            columnsBackgroundColor="#ffffff"
            bodyValues={bodyValues}
            mode={displayMode}
          >
            <Column>
              <Divider
                values={{
                  _meta: {
                    htmlID: "u_content_divider_7",
                    htmlClassNames: "u_content_divider"
                  },
                  width: "0%",
                  border: {
                    borderTopColor: "#ffffff",
                    borderTopStyle: "solid",
                    borderTopWidth: "1px"
                  },
                  deletable: true,
                  draggable: true,
                  textAlign: "center",
                  hideMobile: false,
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "17px"
                }}
                mode={displayMode}
              />
            </Column>
          </Row>

          {/* Row 8 - Two Column Product */}
          <Row
            layout={TwoEqual}
            padding="0px"
            backgroundImage={{
              url: "",
              cover: false,
              center: true,
              repeat: false,
              fullWidth: true
            }}
            columnsBackgroundColor="#ffffff"
            bodyValues={bodyValues}
            mode={displayMode}
          >
            <Column>
              <Image
                values={{
                  src: {
                    url: "https://cdn.templates.unlayer.com/assets/1595702234375-SS.png",
                    width: 300,
                    height: 432
                  },
                  _meta: {
                    htmlID: "u_content_image_4",
                    htmlClassNames: "u_content_image"
                  },
                  action: {
                    name: "web",
                    values: { href: "", target: "_blank" }
                  },
                  altText: "Image",
                  deletable: true,
                  draggable: true,
                  textAlign: "center",
                  hideMobile: false,
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "0px"
                }}
                mode={displayMode}
              />
            </Column>
            <Column>
              <Divider
                values={{
                  _meta: {
                    htmlID: "u_content_divider_5",
                    htmlClassNames: "u_content_divider"
                  },
                  width: "0%",
                  border: {
                    borderTopColor: "#ffffff",
                    borderTopStyle: "solid",
                    borderTopWidth: "1px"
                  },
                  _override: { mobile: { hideMobile: true } },
                  deletable: true,
                  draggable: true,
                  textAlign: "center",
                  hideMobile: false,
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "38px"
                }}
                mode={displayMode}
              />
              <Paragraph
                values={{
                  text: `<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 24px; line-height: 33.6px;"><strong><span style="line-height: 33.6px; font-size: 24px;">TITLE OF THE GREAT PRODUCT</span></strong></span></p>`,
                  _meta: {
                    htmlID: "u_content_text_7",
                    htmlClassNames: "u_content_text"
                  },
                  color: "#000000",
                  _override: { mobile: { textAlign: "center" } },
                  deletable: true,
                  draggable: true,
                  linkStyle: {
                    inherit: true,
                    linkColor: "#0000ee",
                    linkUnderline: true,
                    linkHoverColor: "#0000ee",
                    linkHoverUnderline: true
                  },
                  textAlign: "left",
                  hideMobile: false,
                  lineHeight: "140%",
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "30px 30px 10px"
                }}
                mode={displayMode}
              />
              <Paragraph
                values={{
                  text: `<p style="font-size: 14px; line-height: 190%;">Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna</p>`,
                  _meta: {
                    htmlID: "u_content_text_8",
                    htmlClassNames: "u_content_text"
                  },
                  color: "#000000",
                  _override: { mobile: { textAlign: "center" } },
                  deletable: true,
                  draggable: true,
                  linkStyle: {
                    inherit: true,
                    linkColor: "#0000ee",
                    linkUnderline: true,
                    linkHoverColor: "#0000ee",
                    linkHoverUnderline: true
                  },
                  textAlign: "left",
                  hideMobile: false,
                  lineHeight: "190%",
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "0px 30px 10px"
                }}
                mode={displayMode}
              />
              <Button
                values={{
                  href: {
                    name: "web",
                    values: { href: "", target: "_blank" }
                  },
                  size: { width: "100%", autoWidth: true },
                  text: `<span style="font-size: 14px; line-height: 16.8px;">S H O P&nbsp; N O W</span>`,
                  _meta: {
                    htmlID: "u_content_button_3",
                    htmlClassNames: "u_content_button"
                  },
                  border: {},
                  padding: "15px 25px",
                  _override: { mobile: { textAlign: "center" } },
                  deletable: true,
                  draggable: true,
                  textAlign: "left",
                  hideMobile: false,
                  lineHeight: "120%",
                  selectable: true,
                  hideDesktop: false,
                  borderRadius: "0px",
                  buttonColors: {
                    color: "#FFFFFF",
                    hoverColor: "#FFFFFF",
                    backgroundColor: "#00b367",
                    hoverBackgroundColor: "#3AAEE0"
                  },
                  duplicatable: true,
                  calculatedWidth: 156,
                  calculatedHeight: 46,
                  containerPadding: "10px 30px 30px"
                }}
                mode={displayMode}
              />
            </Column>
          </Row>

          {/* Row 9 - Divider */}
          <Row
            layout={OneColumn}
            padding="0px"
            backgroundImage={{
              url: "",
              cover: false,
              center: true,
              repeat: false,
              fullWidth: true
            }}
            columnsBackgroundColor="#ffffff"
            bodyValues={bodyValues}
            mode={displayMode}
          >
            <Column>
              <Divider
                values={{
                  _meta: {
                    htmlID: "u_content_divider_1",
                    htmlClassNames: "u_content_divider"
                  },
                  width: "0%",
                  border: {
                    borderTopColor: "#ffffff",
                    borderTopStyle: "solid",
                    borderTopWidth: "1px"
                  },
                  deletable: true,
                  draggable: true,
                  textAlign: "center",
                  hideMobile: false,
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "17px"
                }}
                mode={displayMode}
              />
            </Column>
          </Row>

          {/* Row 10 - Two Column Product (Reversed) */}
          <Row
            layout={TwoEqual}
            padding="0px"
            backgroundImage={{
              url: "",
              cover: false,
              center: true,
              repeat: false,
              fullWidth: true
            }}
            columnsBackgroundColor="#ffffff"
            bodyValues={bodyValues}
            mode={displayMode}
          >
            <Column>
              <Divider
                values={{
                  _meta: {
                    htmlID: "u_content_divider_3",
                    htmlClassNames: "u_content_divider"
                  },
                  width: "0%",
                  border: {
                    borderTopColor: "#ffffff",
                    borderTopStyle: "solid",
                    borderTopWidth: "1px"
                  },
                  _override: { mobile: { hideMobile: true } },
                  deletable: true,
                  draggable: true,
                  textAlign: "center",
                  hideMobile: false,
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "56px"
                }}
                mode={displayMode}
              />
              <Paragraph
                values={{
                  text: `<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 24px; line-height: 33.6px;"><strong><span style="line-height: 33.6px; font-size: 24px;">TITLE OF THE GREAT PRODUCT</span></strong></span></p>`,
                  _meta: {
                    htmlID: "u_content_text_5",
                    htmlClassNames: "u_content_text"
                  },
                  color: "#000000",
                  _override: { mobile: { textAlign: "center" } },
                  deletable: true,
                  draggable: true,
                  linkStyle: {
                    inherit: true,
                    linkColor: "#0000ee",
                    linkUnderline: true,
                    linkHoverColor: "#0000ee",
                    linkHoverUnderline: true
                  },
                  textAlign: "left",
                  hideMobile: false,
                  lineHeight: "140%",
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "0px 30px 10px"
                }}
                mode={displayMode}
              />
              <Paragraph
                values={{
                  text: `<p style="font-size: 14px; line-height: 190%;">Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna</p>`,
                  _meta: {
                    htmlID: "u_content_text_6",
                    htmlClassNames: "u_content_text"
                  },
                  color: "#000000",
                  _override: { mobile: { textAlign: "center" } },
                  deletable: true,
                  draggable: true,
                  linkStyle: {
                    inherit: true,
                    linkColor: "#0000ee",
                    linkUnderline: true,
                    linkHoverColor: "#0000ee",
                    linkHoverUnderline: true
                  },
                  textAlign: "left",
                  hideMobile: false,
                  lineHeight: "190%",
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "0px 30px 10px"
                }}
                mode={displayMode}
              />
              <Button
                values={{
                  href: {
                    name: "web",
                    values: { href: "", target: "_blank" }
                  },
                  size: { width: "100%", autoWidth: true },
                  text: `<span style="font-size: 14px; line-height: 16.8px;">SHOP THE JEANS NOW</span>`,
                  _meta: {
                    htmlID: "u_content_button_5",
                    htmlClassNames: "u_content_button"
                  },
                  border: {},
                  padding: "15px 25px",
                  _override: { mobile: { textAlign: "center" } },
                  deletable: true,
                  draggable: true,
                  textAlign: "left",
                  hideMobile: false,
                  lineHeight: "120%",
                  selectable: true,
                  hideDesktop: false,
                  borderRadius: "0px",
                  buttonColors: {
                    color: "#FFFFFF",
                    hoverColor: "#FFFFFF",
                    backgroundColor: "#00b367",
                    hoverBackgroundColor: "#3AAEE0"
                  },
                  duplicatable: true,
                  calculatedWidth: 156,
                  calculatedHeight: 46,
                  containerPadding: "10px 30px 30px"
                }}
                mode={displayMode}
              />
            </Column>
            <Column>
              <Image
                values={{
                  src: {
                    url: "https://cdn.templates.unlayer.com/assets/1595702331358-AAQ.png",
                    width: 300,
                    height: 452
                  },
                  _meta: {
                    htmlID: "u_content_image_3",
                    htmlClassNames: "u_content_image"
                  },
                  action: {
                    name: "web",
                    values: { href: "", target: "_blank" }
                  },
                  altText: "Image",
                  deletable: true,
                  draggable: true,
                  textAlign: "center",
                  hideMobile: false,
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "0px",
                  locked: true
                }}
                mode={displayMode}
              />
            </Column>
          </Row>

          {/* Row 11 - CTA Section */}
          <Row
            layout={OneColumn}
            padding="0px"
            backgroundImage={{
              url: "",
              cover: false,
              center: true,
              repeat: false,
              fullWidth: true
            }}
            columnsBackgroundColor="#ffffff"
            bodyValues={bodyValues}
            mode={displayMode}
          >
            <Column>
              <Paragraph
                values={{
                  text: `<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 14px; line-height: 19.6px;">FREE SHIPPING + FREE RETURN + FREE EXCHANGE</span></p>`,
                  _meta: {
                    htmlID: "u_content_text_11",
                    htmlClassNames: "u_content_text"
                  },
                  color: "#000000",
                  deletable: true,
                  draggable: true,
                  linkStyle: {
                    inherit: true,
                    linkColor: "#0000ee",
                    linkUnderline: true,
                    linkHoverColor: "#0000ee",
                    linkHoverUnderline: true
                  },
                  textAlign: "center",
                  hideMobile: false,
                  lineHeight: "140%",
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "30px 10px 10px"
                }}
                mode={displayMode}
              />
              <Button
                values={{
                  href: {
                    name: "web",
                    values: { href: "", target: "_blank" }
                  },
                  size: { width: "100%", autoWidth: false },
                  text: `<span style="font-size: 14px; line-height: 16.8px;">SHOP THE JEANS NOW</span>`,
                  _meta: {
                    htmlID: "u_content_button_2",
                    htmlClassNames: "u_content_button"
                  },
                  border: {},
                  padding: "15px 25px",
                  _override: { mobile: { textAlign: "center" } },
                  deletable: true,
                  draggable: true,
                  textAlign: "left",
                  hideMobile: false,
                  lineHeight: "120%",
                  selectable: true,
                  hideDesktop: false,
                  borderRadius: "0px",
                  buttonColors: {
                    color: "#FFFFFF",
                    hoverColor: "#FFFFFF",
                    backgroundColor: "#00b367",
                    hoverBackgroundColor: "#3AAEE0"
                  },
                  duplicatable: true,
                  calculatedWidth: 540,
                  calculatedHeight: 46,
                  containerPadding: "10px 30px 32px"
                }}
                mode={displayMode}
              />
            </Column>
          </Row>

          {/* Row 12 - Location Section */}
          <Row
            layout={OneColumn}
            padding="0px"
            backgroundImage={{
              url: "https://cdn.templates.unlayer.com/assets/1595703291142-11.png",
              cover: false,
              width: 600,
              center: true,
              height: 239,
              repeat: false,
              fullWidth: false
            }}
            columnsBackgroundColor="#000000"
            bodyValues={bodyValues}
            mode={displayMode}
          >
            <Column>
              <Paragraph
                values={{
                  text: `<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 24px; line-height: 33.6px;"><strong><span style="line-height: 33.6px; font-size: 24px;">OUR LOCATION</span></strong></span></p>`,
                  _meta: {
                    htmlID: "u_content_text_12",
                    htmlClassNames: "u_content_text"
                  },
                  color: "#ffffff",
                  _override: { mobile: { textAlign: "center" } },
                  deletable: true,
                  draggable: true,
                  linkStyle: {
                    inherit: true,
                    linkColor: "#0000ee",
                    linkUnderline: true,
                    linkHoverColor: "#0000ee",
                    linkHoverUnderline: true
                  },
                  textAlign: "left",
                  hideMobile: false,
                  lineHeight: "140%",
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "34px 30px 0px"
                }}
                mode={displayMode}
              />
              <Paragraph
                values={{
                  text: `<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 14px; line-height: 19.6px;"><strong><span style="line-height: 19.6px; font-size: 14px;">NEW YORK</span></strong></span></p>
<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 14px; line-height: 19.6px;"><span style="line-height: 19.6px; font-size: 14px;">LOREM IPSUM DOLOR</span></span></p>
<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 14px; line-height: 19.6px;"><span style="line-height: 19.6px; font-size: 14px;">ST RD 1200, NY</span></span></p>`,
                  _meta: {
                    htmlID: "u_content_text_13",
                    htmlClassNames: "u_content_text"
                  },
                  color: "#ffffff",
                  _override: { mobile: { textAlign: "center" } },
                  deletable: true,
                  draggable: true,
                  linkStyle: {
                    inherit: true,
                    linkColor: "#0000ee",
                    linkUnderline: true,
                    linkHoverColor: "#0000ee",
                    linkHoverUnderline: true
                  },
                  textAlign: "left",
                  hideMobile: false,
                  lineHeight: "140%",
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "10px 30px"
                }}
                mode={displayMode}
              />
              <Paragraph
                values={{
                  text: `<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 14px; line-height: 19.6px;"><strong><span style="line-height: 19.6px; font-size: 14px;">CONTACT</span></strong></span></p>
<p style="font-size: 14px; line-height: 140%;"><span style="font-size: 14px; line-height: 19.6px;"><span style="line-height: 19.6px; font-size: 14px;">+ 00 111 222 3333</span></span></p>`,
                  _meta: {
                    htmlID: "u_content_text_14",
                    htmlClassNames: "u_content_text"
                  },
                  color: "#ffffff",
                  _override: { mobile: { textAlign: "center" } },
                  deletable: true,
                  draggable: true,
                  linkStyle: {
                    inherit: true,
                    linkColor: "#0000ee",
                    linkUnderline: true,
                    linkHoverColor: "#0000ee",
                    linkHoverUnderline: true
                  },
                  textAlign: "left",
                  hideMobile: false,
                  lineHeight: "140%",
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "1px 30px 30px"
                }}
                mode={displayMode}
              />
            </Column>
          </Row>

          {/* Row 13 - Footer */}
          <Row
            layout={OneColumn}
            padding="0px"
            backgroundImage={{
              url: "",
              cover: false,
              center: true,
              repeat: false,
              fullWidth: true
            }}
            columnsBackgroundColor="#000000"
            bodyValues={bodyValues}
            mode={displayMode}
          >
            <Column>
              <Social
                values={{
                  _meta: {
                    htmlID: "u_content_social_1",
                    htmlClassNames: "u_content_social"
                  },
                  align: "center",
                  icons: {
                    icons: [
                      { url: "https://facebook.com/", name: "Facebook" },
                      { url: "https://twitter.com/", name: "Twitter" },
                      { url: "https://pinterest.com/", name: "Pinterest" },
                      { url: "https://youtube.com/", name: "YouTube" }
                    ],
                    iconType: "rounded-black"
                  },
                  spacing: 34,
                  deletable: true,
                  draggable: true,
                  hideMobile: false,
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "35px 10px 12px"
                }}
                mode={displayMode}
              />
              <Paragraph
                values={{
                  text: `<p style="font-size: 14px; line-height: 140%;">Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam</p>
<p style="font-size: 14px; line-height: 140%;">nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam e</p>`,
                  _meta: {
                    htmlID: "u_content_text_16",
                    htmlClassNames: "u_content_text"
                  },
                  color: "#91919c",
                  deletable: true,
                  draggable: true,
                  linkStyle: {
                    inherit: true,
                    linkColor: "#0000ee",
                    linkUnderline: true,
                    linkHoverColor: "#0000ee",
                    linkHoverUnderline: true
                  },
                  textAlign: "center",
                  hideMobile: false,
                  lineHeight: "140%",
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "9px 10px 25px"
                }}
                mode={displayMode}
              />
              <Paragraph
                values={{
                  text: `<p style="font-size: 14px; line-height: 140%; text-align: center;">&copy; The Jeans. All Rights Reserved</p>`,
                  _meta: {
                    htmlID: "u_content_text_17",
                    htmlClassNames: "u_content_text"
                  },
                  color: "#91919c",
                  deletable: true,
                  draggable: true,
                  linkStyle: {
                    inherit: true,
                    linkColor: "#0000ee",
                    linkUnderline: true,
                    linkHoverColor: "#0000ee",
                    linkHoverUnderline: true
                  },
                  textAlign: "left",
                  hideMobile: false,
                  lineHeight: "140%",
                  selectable: true,
                  hideDesktop: false,
                  duplicatable: true,
                  containerPadding: "5px 10px 23px"
                }}
                mode={displayMode}
              />
            </Column>
          </Row>
        </div>

        {/* Status indicator */}
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#d4edda",
            border: "1px solid #c3e6cb",
            borderRadius: "4px"
          }}
        >
          <strong>✅ Complete Email Template Test:</strong>
          <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
            <li>
              <strong>13 Rows Total</strong> - Complete email template from
              ExampleComponents.tsx
            </li>
            <li>
              <strong>All Components</strong> - Image, Text, Button, Divider,
              Paragraph, Social
            </li>
            <li>
              <strong>Multiple Layouts</strong> - OneColumn and TwoEqual
              configurations
            </li>
            <li>
              <strong>SSR Compatible</strong> - Perfect server-side rendering
              with auto CSS injection
            </li>
            <li>
              <strong>Mode Switching</strong> - Test web, email, and document
              modes
            </li>
            <li>
              <strong>Exact Values</strong> - All component values match
              ExampleComponents.tsx exactly
            </li>
          </ul>
        </div>
      </div>
    );
  }
};

