import{j as n}from"./jsx-runtime-BViy6Hjz.js";import{c as w,Y as S,m as y,C as e}from"./create-component-CW9wB-ex.js";import{B as f}from"./Body-cH7i1EFI.js";import{R as t,C as a}from"./Column-DVLxTzkl.js";import{H as m}from"./Heading-D12kPId9.js";import{T as o}from"./Text-Bfdt0Ggz.js";import{U as x}from"./UnlayerProvider-CEqhXvNd.js";import"./iframe-skTCxvcs.js";import"./preload-helper-PPVm8Dsz.js";const A={items:[]},u={align:"center",menu:A,layout:"horizontal",separator:"|"},c=w({name:"Menu",defaultValues:u,propMapper:g=>{const{items:h,...v}=g;if(Array.isArray(h)){const k=h.map((d,C)=>({key:String(C+1),text:d.text,link:{name:"web",values:{href:d.href,target:d.target??"_blank"}}})),b=y(v,u,"Menu");return b.menu={items:k},b}return y(g,u,"Menu")},displayName:"Menu",exporters:S}),U={title:"Components/Menu",component:c,parameters:{layout:"centered",docs:{description:{component:`
# Menu Component

Navigation menu for emails and web pages with horizontal/vertical layouts,
configurable separators, and full typographic control.

## Features
- **Horizontal & vertical** menu layouts
- **Separator characters** between items (|, -, etc.)
- **Link support** for web URLs, email addresses, and custom actions
- **Typography** control including font size, weight, color, and letter spacing
- **Email-safe** rendering optimized for all major email clients

## Quick Start

\`\`\`tsx
<Menu
  items={[
    { text: "Home", href: "/" },
    { text: "About", href: "/about" },
  ]}
  separator="|"
  linkColor="#2563eb"
/>
\`\`\`
        `}}},argTypes:{values:{description:'**Menu Configuration Object**\n\n- `menu.items`: Array of menu items with text and link config\n- `layout`: "horizontal" or "vertical"\n- `separator`: Character between items (e.g. "|", "-")\n- `fontSize`, `fontWeight`, `linkColor`, `textColor`: Typography\n- `padding`, `letterSpacing`, `containerPadding`: Spacing',control:!1,table:{type:{summary:"MenuValues",detail:`{
  menu: { items: Array<{ text: string; link: LinkConfig }> };
  layout: "horizontal" | "vertical";
  separator: string;
  fontSize: string;
  fontWeight: string;
  linkColor: string;
  textColor: string;
  padding: string;
  letterSpacing: string;
}`}}}},tags:["autodocs"]},r={args:{items:[{text:"Home",href:"#home"},{text:"About",href:"#about"},{text:"Services",href:"#services"},{text:"Contact",href:"#contact"}],layout:"horizontal",align:"center",separator:"|",padding:"10px 16px",fontSize:"14px",linkColor:"#2563eb"},parameters:{docs:{description:{story:`**Shorthand API** — pass \`items\` as a simple array of \`{ text, href }\` objects.

\`\`\`tsx
<Menu
  items={[
    { text: "Home", href: "/" },
    { text: "About", href: "/about" },
    { text: "Contact", href: "/contact" },
  ]}
  separator="|"
  linkColor="#2563eb"
/>
\`\`\``}}}},i={args:{values:{menu:{items:[{text:"Home",link:{name:"web",values:{href:"#home",target:"_blank"}}},{text:"About",link:{name:"web",values:{href:"#about",target:"_blank"}}},{text:"Services",link:{name:"web",values:{href:"#services",target:"_blank"}}},{text:"Contact",link:{name:"web",values:{href:"#contact",target:"_blank"}}}]},layout:"horizontal",align:"center",separator:"|",padding:"10px 16px",fontSize:"14px",fontWeight:"normal",linkColor:"#2563eb",textColor:"#374151",letterSpacing:"0px"}},parameters:{docs:{description:{story:"**Full Control** — use the `values` prop for complete exporter-format control."}}}},l={render:()=>n.jsx(x,{config:{mode:"email"},children:n.jsxs(f,{backgroundColor:"#f4f4f5",contentAlign:"center",contentWidth:"600px",fontFamily:{label:"Arial",value:"Arial, Helvetica, sans-serif"},textColor:"#1f2937",children:[n.jsx(t,{layout:e.OneColumn,backgroundColor:"#ffffff",padding:"32px 24px 16px 24px",children:n.jsx(a,{children:n.jsx(m,{values:{text:"Acme Inc.",headingType:"h2",fontSize:"28px",fontWeight:"700",color:"#111827",textAlign:"center",fontFamily:"Arial, Helvetica, sans-serif",lineHeight:"110%",containerPadding:"0 0 4px 0"}})})}),n.jsx(t,{layout:e.OneColumn,backgroundColor:"#ffffff",padding:"0px 24px 24px 24px",children:n.jsx(a,{children:n.jsx(c,{values:{menu:{items:[{text:"Products",link:{name:"web",values:{href:"https://example.com/products",target:"_blank"}}},{text:"Pricing",link:{name:"web",values:{href:"https://example.com/pricing",target:"_blank"}}},{text:"Blog",link:{name:"web",values:{href:"https://example.com/blog",target:"_blank"}}},{text:"Support",link:{name:"web",values:{href:"https://example.com/support",target:"_blank"}}}]},layout:"horizontal",align:"center",separator:"|",padding:"8px 14px",fontSize:"14px",fontWeight:"normal",linkColor:"#4b5563",textColor:"#9ca3af",letterSpacing:"0px",fontFamily:{label:"Arial",value:"Arial, Helvetica, sans-serif"},containerPadding:"0"}})})}),n.jsx(t,{layout:e.OneColumn,backgroundColor:"#2563eb",padding:"0px",children:n.jsx(a,{padding:"2px",children:n.jsx(o,{values:{text:"&nbsp;",fontSize:"1px",lineHeight:"1px",containerPadding:"0"}})})}),n.jsx(t,{layout:e.OneColumn,backgroundColor:"#ffffff",padding:"40px 32px",children:n.jsxs(a,{children:[n.jsx(m,{values:{text:"Your weekly digest is here",headingType:"h1",fontSize:"24px",fontWeight:"700",color:"#111827",textAlign:"left",fontFamily:"Arial, Helvetica, sans-serif",lineHeight:"130%",containerPadding:"0 0 16px 0"}}),n.jsx(o,{values:{text:"Here is a summary of what happened this week across your projects and teams. Click on any section to dive deeper.",fontSize:"15px",color:"#4b5563",textAlign:"left",lineHeight:"160%",fontFamily:"Arial, Helvetica, sans-serif",containerPadding:"0"}})]})})]})}),parameters:{layout:"fullscreen",docs:{description:{story:`
**Email Header with UnlayerProvider**

A realistic email header layout wrapped in \`UnlayerProvider\` with
\`config={{ mode: "email" }}\`. The mode propagates automatically to every
child -- no \`mode\` prop needed on individual components.

Key points:
- \`UnlayerProvider\` sets mode once at the top level
- Company heading centered above the navigation
- Four links separated by pipe characters
- Thin blue accent divider separating header from body content

\`\`\`tsx
<UnlayerProvider config={{ mode: "email" }}>
  <Body contentWidth="600px">
    <Row><Column>
      <Heading values={{ text: "Acme Inc." }} />
    </Column></Row>
    <Row><Column>
      <Menu values={{ menu: { items: [...] }, separator: "|" }} />
    </Column></Row>
  </Body>
</UnlayerProvider>
\`\`\`
        `}}}},s={render:()=>n.jsx(x,{config:{mode:"email"},children:n.jsxs(f,{backgroundColor:"#f9fafb",contentAlign:"center",contentWidth:"600px",fontFamily:{label:"Arial",value:"Arial, Helvetica, sans-serif"},textColor:"#6b7280",children:[n.jsx(t,{layout:e.OneColumn,backgroundColor:"#e5e7eb",padding:"0px",children:n.jsx(a,{padding:"1px",children:n.jsx(o,{values:{text:"&nbsp;",fontSize:"1px",lineHeight:"1px",containerPadding:"0"}})})}),n.jsx(t,{layout:e.OneColumn,backgroundColor:"#f9fafb",padding:"28px 24px 12px 24px",children:n.jsx(a,{children:n.jsx(o,{values:{text:"Acme Inc. | 123 Main Street, San Francisco, CA 94105",fontSize:"12px",color:"#9ca3af",textAlign:"center",lineHeight:"150%",fontFamily:"Arial, Helvetica, sans-serif",containerPadding:"0 0 12px 0"}})})}),n.jsx(t,{layout:e.OneColumn,backgroundColor:"#f9fafb",padding:"0px 24px 28px 24px",children:n.jsx(a,{children:n.jsx(c,{values:{menu:{items:[{text:"View Online",link:{name:"web",values:{href:"https://example.com/view",target:"_blank"}}},{text:"Unsubscribe",link:{name:"web",values:{href:"https://example.com/unsubscribe",target:"_blank"}}},{text:"Privacy Policy",link:{name:"web",values:{href:"https://example.com/privacy",target:"_blank"}}},{text:"Terms",link:{name:"web",values:{href:"https://example.com/terms",target:"_blank"}}}]},layout:"horizontal",align:"center",separator:"-",padding:"6px 10px",fontSize:"12px",fontWeight:"normal",linkColor:"#6b7280",textColor:"#d1d5db",letterSpacing:"0px",fontFamily:{label:"Arial",value:"Arial, Helvetica, sans-serif"},containerPadding:"0"}})})})]})}),parameters:{layout:"fullscreen",docs:{description:{story:`
**Email Footer Links**

Standard email footer with unsubscribe, privacy, and legal links.
Uses muted gray tones and a compact font size to keep the footer
unobtrusive while remaining accessible.

\`\`\`tsx
<Menu
  values={{
    menu: { items: [
      { text: "Unsubscribe", link: { ... } },
      { text: "Privacy Policy", link: { ... } },
    ]},
    separator: "-",
    fontSize: "12px",
    linkColor: "#6b7280",
  }}
/>
\`\`\`
        `}}}},p={render:()=>n.jsx(x,{config:{mode:"web"},children:n.jsxs(f,{backgroundColor:"#0f172a",contentAlign:"center",contentWidth:"800px",fontFamily:{label:"Inter",value:"Inter, system-ui, -apple-system, sans-serif"},textColor:"#ffffff",children:[n.jsx(t,{layout:e.OneColumn,backgroundColor:"#1e293b",padding:"20px 32px",children:n.jsx(a,{children:n.jsx(c,{values:{menu:{items:[{text:"DASHBOARD",link:{name:"web",values:{href:"/dashboard",target:"_self"}}},{text:"ANALYTICS",link:{name:"web",values:{href:"/analytics",target:"_self"}}},{text:"TEMPLATES",link:{name:"web",values:{href:"/templates",target:"_self"}}},{text:"INTEGRATIONS",link:{name:"web",values:{href:"/integrations",target:"_self"}}},{text:"SETTINGS",link:{name:"web",values:{href:"/settings",target:"_self"}}}]},layout:"horizontal",align:"center",separator:"",padding:"10px 20px",fontSize:"12px",fontWeight:"700",linkColor:"#94a3b8",textColor:"#475569",letterSpacing:"1.5px",fontFamily:{label:"Inter",value:"Inter, system-ui, -apple-system, sans-serif"},containerPadding:"0"}})})}),n.jsx(t,{layout:e.OneColumn,backgroundColor:"#0f172a",padding:"64px 40px 48px 40px",children:n.jsxs(a,{children:[n.jsx(m,{values:{text:"Ship faster with Unlayer",headingType:"h1",fontSize:"44px",fontWeight:"800",color:"#f8fafc",textAlign:"center",fontFamily:"Inter, system-ui, sans-serif",lineHeight:"110%",containerPadding:"0 0 20px 0"}}),n.jsx(o,{values:{text:"Drag-and-drop email and page builders you can embed in your SaaS in minutes, not months.",fontSize:"18px",color:"#94a3b8",textAlign:"center",lineHeight:"160%",fontFamily:"Inter, system-ui, sans-serif",containerPadding:"0"}})]})})]})}),parameters:{layout:"fullscreen",docs:{description:{story:`
**Bold Styled Navigation Bar**

An uppercase, letter-spaced navigation bar on a dark slate background.
No separators -- spacing alone distinguishes links. Paired with a hero
section to show how the menu fits into a full-page layout.

Key styling choices:
- \`fontWeight: "700"\` and \`letterSpacing: "1.5px"\` for bold, airy uppercase text
- \`separator: ""\` removes dividers for a minimal look
- \`linkColor: "#94a3b8"\` (slate-400) for muted links on dark backgrounds

\`\`\`tsx
<Menu
  values={{
    menu: { items: [...] },
    separator: "",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    linkColor: "#94a3b8",
  }}
/>
\`\`\`
        `}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    items: [{
      text: "Home",
      href: "#home"
    }, {
      text: "About",
      href: "#about"
    }, {
      text: "Services",
      href: "#services"
    }, {
      text: "Contact",
      href: "#contact"
    }],
    layout: "horizontal",
    align: "center",
    separator: "|",
    padding: "10px 16px",
    fontSize: "14px",
    linkColor: "#2563eb"
  },
  parameters: {
    docs: {
      description: {
        story: \`**Shorthand API** — pass \\\`items\\\` as a simple array of \\\`{ text, href }\\\` objects.

\\\`\\\`\\\`tsx
<Menu
  items={[
    { text: "Home", href: "/" },
    { text: "About", href: "/about" },
    { text: "Contact", href: "/contact" },
  ]}
  separator="|"
  linkColor="#2563eb"
/>
\\\`\\\`\\\`\`
      }
    }
  }
}`,...r.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      menu: {
        items: [{
          text: "Home",
          link: {
            name: "web",
            values: {
              href: "#home",
              target: "_blank"
            }
          }
        }, {
          text: "About",
          link: {
            name: "web",
            values: {
              href: "#about",
              target: "_blank"
            }
          }
        }, {
          text: "Services",
          link: {
            name: "web",
            values: {
              href: "#services",
              target: "_blank"
            }
          }
        }, {
          text: "Contact",
          link: {
            name: "web",
            values: {
              href: "#contact",
              target: "_blank"
            }
          }
        }]
      },
      layout: "horizontal",
      align: "center",
      separator: "|",
      padding: "10px 16px",
      fontSize: "14px",
      fontWeight: "normal",
      linkColor: "#2563eb",
      textColor: "#374151",
      letterSpacing: "0px"
    }
  },
  parameters: {
    docs: {
      description: {
        story: "**Full Control** — use the \`values\` prop for complete exporter-format control."
      }
    }
  }
}`,...i.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <UnlayerProvider config={{
    mode: "email"
  }}>
      <Body backgroundColor="#f4f4f5" contentAlign="center" contentWidth="600px" fontFamily={{
      label: "Arial",
      value: "Arial, Helvetica, sans-serif"
    }} textColor="#1f2937">
        {/* Header bar */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="32px 24px 16px 24px">
          <Column>
            <Heading values={{
            text: "Acme Inc.",
            headingType: "h2",
            fontSize: "28px",
            fontWeight: "700",
            color: "#111827",
            textAlign: "center",
            fontFamily: "Arial, Helvetica, sans-serif",
            lineHeight: "110%",
            containerPadding: "0 0 4px 0"
          }} />
          </Column>
        </Row>

        {/* Navigation menu */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 24px 24px 24px">
          <Column>
            <Menu values={{
            menu: {
              items: [{
                text: "Products",
                link: {
                  name: "web",
                  values: {
                    href: "https://example.com/products",
                    target: "_blank"
                  }
                }
              }, {
                text: "Pricing",
                link: {
                  name: "web",
                  values: {
                    href: "https://example.com/pricing",
                    target: "_blank"
                  }
                }
              }, {
                text: "Blog",
                link: {
                  name: "web",
                  values: {
                    href: "https://example.com/blog",
                    target: "_blank"
                  }
                }
              }, {
                text: "Support",
                link: {
                  name: "web",
                  values: {
                    href: "https://example.com/support",
                    target: "_blank"
                  }
                }
              }]
            },
            layout: "horizontal",
            align: "center",
            separator: "|",
            padding: "8px 14px",
            fontSize: "14px",
            fontWeight: "normal",
            linkColor: "#4b5563",
            textColor: "#9ca3af",
            letterSpacing: "0px",
            fontFamily: {
              label: "Arial",
              value: "Arial, Helvetica, sans-serif"
            },
            containerPadding: "0"
          }} />
          </Column>
        </Row>

        {/* Thin accent divider */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#2563eb" padding="0px">
          <Column padding="2px">
            <Text values={{
            text: "&nbsp;",
            fontSize: "1px",
            lineHeight: "1px",
            containerPadding: "0"
          }} />
          </Column>
        </Row>

        {/* Email body content */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="40px 32px">
          <Column>
            <Heading values={{
            text: "Your weekly digest is here",
            headingType: "h1",
            fontSize: "24px",
            fontWeight: "700",
            color: "#111827",
            textAlign: "left",
            fontFamily: "Arial, Helvetica, sans-serif",
            lineHeight: "130%",
            containerPadding: "0 0 16px 0"
          }} />
            <Text values={{
            text: "Here is a summary of what happened this week across your projects and teams. Click on any section to dive deeper.",
            fontSize: "15px",
            color: "#4b5563",
            textAlign: "left",
            lineHeight: "160%",
            fontFamily: "Arial, Helvetica, sans-serif",
            containerPadding: "0"
          }} />
          </Column>
        </Row>
      </Body>
    </UnlayerProvider>,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story: \`
**Email Header with UnlayerProvider**

A realistic email header layout wrapped in \\\`UnlayerProvider\\\` with
\\\`config={{ mode: "email" }}\\\`. The mode propagates automatically to every
child -- no \\\`mode\\\` prop needed on individual components.

Key points:
- \\\`UnlayerProvider\\\` sets mode once at the top level
- Company heading centered above the navigation
- Four links separated by pipe characters
- Thin blue accent divider separating header from body content

\\\`\\\`\\\`tsx
<UnlayerProvider config={{ mode: "email" }}>
  <Body contentWidth="600px">
    <Row><Column>
      <Heading values={{ text: "Acme Inc." }} />
    </Column></Row>
    <Row><Column>
      <Menu values={{ menu: { items: [...] }, separator: "|" }} />
    </Column></Row>
  </Body>
</UnlayerProvider>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...l.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <UnlayerProvider config={{
    mode: "email"
  }}>
      <Body backgroundColor="#f9fafb" contentAlign="center" contentWidth="600px" fontFamily={{
      label: "Arial",
      value: "Arial, Helvetica, sans-serif"
    }} textColor="#6b7280">
        {/* Spacer / end-of-email visual break */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#e5e7eb" padding="0px">
          <Column padding="1px">
            <Text values={{
            text: "&nbsp;",
            fontSize: "1px",
            lineHeight: "1px",
            containerPadding: "0"
          }} />
          </Column>
        </Row>

        {/* Footer content */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#f9fafb" padding="28px 24px 12px 24px">
          <Column>
            <Text values={{
            text: "Acme Inc. | 123 Main Street, San Francisco, CA 94105",
            fontSize: "12px",
            color: "#9ca3af",
            textAlign: "center",
            lineHeight: "150%",
            fontFamily: "Arial, Helvetica, sans-serif",
            containerPadding: "0 0 12px 0"
          }} />
          </Column>
        </Row>

        {/* Footer menu links */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#f9fafb" padding="0px 24px 28px 24px">
          <Column>
            <Menu values={{
            menu: {
              items: [{
                text: "View Online",
                link: {
                  name: "web",
                  values: {
                    href: "https://example.com/view",
                    target: "_blank"
                  }
                }
              }, {
                text: "Unsubscribe",
                link: {
                  name: "web",
                  values: {
                    href: "https://example.com/unsubscribe",
                    target: "_blank"
                  }
                }
              }, {
                text: "Privacy Policy",
                link: {
                  name: "web",
                  values: {
                    href: "https://example.com/privacy",
                    target: "_blank"
                  }
                }
              }, {
                text: "Terms",
                link: {
                  name: "web",
                  values: {
                    href: "https://example.com/terms",
                    target: "_blank"
                  }
                }
              }]
            },
            layout: "horizontal",
            align: "center",
            separator: "-",
            padding: "6px 10px",
            fontSize: "12px",
            fontWeight: "normal",
            linkColor: "#6b7280",
            textColor: "#d1d5db",
            letterSpacing: "0px",
            fontFamily: {
              label: "Arial",
              value: "Arial, Helvetica, sans-serif"
            },
            containerPadding: "0"
          }} />
          </Column>
        </Row>
      </Body>
    </UnlayerProvider>,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story: \`
**Email Footer Links**

Standard email footer with unsubscribe, privacy, and legal links.
Uses muted gray tones and a compact font size to keep the footer
unobtrusive while remaining accessible.

\\\`\\\`\\\`tsx
<Menu
  values={{
    menu: { items: [
      { text: "Unsubscribe", link: { ... } },
      { text: "Privacy Policy", link: { ... } },
    ]},
    separator: "-",
    fontSize: "12px",
    linkColor: "#6b7280",
  }}
/>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...s.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <UnlayerProvider config={{
    mode: "web"
  }}>
      <Body backgroundColor="#0f172a" contentAlign="center" contentWidth="800px" fontFamily={{
      label: "Inter",
      value: "Inter, system-ui, -apple-system, sans-serif"
    }} textColor="#ffffff">
        {/* Dark navigation bar */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#1e293b" padding="20px 32px">
          <Column>
            <Menu values={{
            menu: {
              items: [{
                text: "DASHBOARD",
                link: {
                  name: "web",
                  values: {
                    href: "/dashboard",
                    target: "_self"
                  }
                }
              }, {
                text: "ANALYTICS",
                link: {
                  name: "web",
                  values: {
                    href: "/analytics",
                    target: "_self"
                  }
                }
              }, {
                text: "TEMPLATES",
                link: {
                  name: "web",
                  values: {
                    href: "/templates",
                    target: "_self"
                  }
                }
              }, {
                text: "INTEGRATIONS",
                link: {
                  name: "web",
                  values: {
                    href: "/integrations",
                    target: "_self"
                  }
                }
              }, {
                text: "SETTINGS",
                link: {
                  name: "web",
                  values: {
                    href: "/settings",
                    target: "_self"
                  }
                }
              }]
            },
            layout: "horizontal",
            align: "center",
            separator: "",
            padding: "10px 20px",
            fontSize: "12px",
            fontWeight: "700",
            linkColor: "#94a3b8",
            textColor: "#475569",
            letterSpacing: "1.5px",
            fontFamily: {
              label: "Inter",
              value: "Inter, system-ui, -apple-system, sans-serif"
            },
            containerPadding: "0"
          }} />
          </Column>
        </Row>

        {/* Hero content below nav */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#0f172a" padding="64px 40px 48px 40px">
          <Column>
            <Heading values={{
            text: "Ship faster with Unlayer",
            headingType: "h1",
            fontSize: "44px",
            fontWeight: "800",
            color: "#f8fafc",
            textAlign: "center",
            fontFamily: "Inter, system-ui, sans-serif",
            lineHeight: "110%",
            containerPadding: "0 0 20px 0"
          }} />
            <Text values={{
            text: "Drag-and-drop email and page builders you can embed in your SaaS in minutes, not months.",
            fontSize: "18px",
            color: "#94a3b8",
            textAlign: "center",
            lineHeight: "160%",
            fontFamily: "Inter, system-ui, sans-serif",
            containerPadding: "0"
          }} />
          </Column>
        </Row>
      </Body>
    </UnlayerProvider>,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story: \`
**Bold Styled Navigation Bar**

An uppercase, letter-spaced navigation bar on a dark slate background.
No separators -- spacing alone distinguishes links. Paired with a hero
section to show how the menu fits into a full-page layout.

Key styling choices:
- \\\`fontWeight: "700"\\\` and \\\`letterSpacing: "1.5px"\\\` for bold, airy uppercase text
- \\\`separator: ""\\\` removes dividers for a minimal look
- \\\`linkColor: "#94a3b8"\\\` (slate-400) for muted links on dark backgrounds

\\\`\\\`\\\`tsx
<Menu
  values={{
    menu: { items: [...] },
    separator: "",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    linkColor: "#94a3b8",
  }}
/>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...p.parameters?.docs?.source}}};const W=["Default","FullValuesAPI","EmailHeader","FooterLinks","StyledNavigation"];export{r as Default,l as EmailHeader,s as FooterLinks,i as FullValuesAPI,p as StyledNavigation,W as __namedExportsOrder,U as default};
