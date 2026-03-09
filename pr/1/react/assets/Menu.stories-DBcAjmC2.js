import{j as e}from"./jsx-runtime-BuBrmdJl.js";import{c as w,I as S,m as y,X as A,C as n}from"./index-xl_HwiZZ.js";import{B as f}from"./Body-Cjhsl7Tj.js";import{R as t,C as a}from"./Column-kmhgVWZI.js";import{H as u}from"./Heading-O9025Ml3.js";import{P as o}from"./Paragraph-BSzw9DuB.js";import{U as x}from"./UnlayerProvider-CHPipS4O.js";import"./iframe-BJvI4iaB.js";import"./preload-helper-PPVm8Dsz.js";const m={...S},c=w({name:"Menu",defaultValues:m,propMapper:g=>{const{items:h,...k}=g;if(Array.isArray(h)){const v=h.map((d,C)=>({key:String(C+1),text:d.text,link:{name:"web",values:{href:d.href,target:d.target??"_blank"}}})),b=y(k,m,"Menu");return b.menu={items:v},b}return y(g,m,"Menu")},displayName:"Menu",exporters:A}),W={title:"Components/Menu",component:c,parameters:{layout:"centered",docs:{description:{component:`
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
        `}}},argTypes:{},tags:["autodocs"]},r={args:{items:[{text:"Home",href:"#home"},{text:"About",href:"#about"},{text:"Services",href:"#services"},{text:"Contact",href:"#contact"}],layout:"horizontal",align:"center",separator:"|",padding:"10px 16px",fontSize:"14px",linkColor:"#2563eb"},parameters:{docs:{description:{story:`**Shorthand API** — pass \`items\` as a simple array of \`{ text, href }\` objects.

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
\`\`\``}}}},i={args:{menu:{items:[{text:"Home",link:{name:"web",values:{href:"#home",target:"_blank"}}},{text:"About",link:{name:"web",values:{href:"#about",target:"_blank"}}},{text:"Services",link:{name:"web",values:{href:"#services",target:"_blank"}}},{text:"Contact",link:{name:"web",values:{href:"#contact",target:"_blank"}}}]},layout:"horizontal",align:"center",separator:"|",padding:"10px 16px",fontSize:"14px",fontWeight:"normal",linkColor:"#2563eb",textColor:"#374151",letterSpacing:"0px"},parameters:{docs:{description:{story:`**Full Control** — use the \`menu\` prop with full link config objects for complete control.

\`\`\`tsx
<Menu
  menu={{
    items: [
      { text: "Home", link: { name: "web", values: { href: "#home", target: "_blank" } } },
      { text: "About", link: { name: "web", values: { href: "#about", target: "_blank" } } },
    ]
  }}
  separator="|"
  linkColor="#2563eb"
/>
\`\`\``}}}},l={render:()=>e.jsx(x,{config:{mode:"email"},children:e.jsxs(f,{backgroundColor:"#f4f4f5",contentAlign:"center",contentWidth:"600px",fontFamily:{label:"Arial",value:"Arial, Helvetica, sans-serif"},textColor:"#1f2937",children:[e.jsx(t,{layout:n.OneColumn,backgroundColor:"#ffffff",padding:"32px 24px 16px 24px",children:e.jsx(a,{children:e.jsx(u,{level:"h2",fontSize:"28px",fontWeight:"700",color:"#111827",textAlign:"center",fontFamily:"Arial, Helvetica, sans-serif",lineHeight:"110%",containerPadding:"0 0 4px 0",children:"Acme Inc."})})}),e.jsx(t,{layout:n.OneColumn,backgroundColor:"#ffffff",padding:"0px 24px 24px 24px",children:e.jsx(a,{children:e.jsx(c,{menu:{items:[{text:"Products",link:{name:"web",values:{href:"https://example.com/products",target:"_blank"}}},{text:"Pricing",link:{name:"web",values:{href:"https://example.com/pricing",target:"_blank"}}},{text:"Blog",link:{name:"web",values:{href:"https://example.com/blog",target:"_blank"}}},{text:"Support",link:{name:"web",values:{href:"https://example.com/support",target:"_blank"}}}]},layout:"horizontal",align:"center",separator:"|",padding:"8px 14px",fontSize:"14px",fontWeight:"normal",linkColor:"#4b5563",textColor:"#9ca3af",letterSpacing:"0px",fontFamily:{label:"Arial",value:"Arial, Helvetica, sans-serif"},containerPadding:"0"})})}),e.jsx(t,{layout:n.OneColumn,backgroundColor:"#2563eb",padding:"0px",children:e.jsx(a,{padding:"2px",children:e.jsx(o,{text:" ",fontSize:"1px",lineHeight:"1px",containerPadding:"0"})})}),e.jsx(t,{layout:n.OneColumn,backgroundColor:"#ffffff",padding:"40px 32px",children:e.jsxs(a,{children:[e.jsx(u,{level:"h1",fontSize:"24px",fontWeight:"700",color:"#111827",textAlign:"left",fontFamily:"Arial, Helvetica, sans-serif",lineHeight:"130%",containerPadding:"0 0 16px 0",children:"Your weekly digest is here"}),e.jsx(o,{text:"Here is a summary of what happened this week across your projects and teams. Click on any section to dive deeper.",fontSize:"15px",color:"#4b5563",textAlign:"left",lineHeight:"160%",fontFamily:"Arial, Helvetica, sans-serif",containerPadding:"0"})]})})]})}),parameters:{layout:"fullscreen",docs:{description:{story:`
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
      <Heading level="h2">Acme Inc.</Heading>
    </Column></Row>
    <Row><Column>
      <Menu
        menu={{ items: [...] }}
        separator="|"
      />
    </Column></Row>
  </Body>
</UnlayerProvider>
\`\`\`
        `}}}},s={render:()=>e.jsx(x,{config:{mode:"email"},children:e.jsxs(f,{backgroundColor:"#f9fafb",contentAlign:"center",contentWidth:"600px",fontFamily:{label:"Arial",value:"Arial, Helvetica, sans-serif"},textColor:"#6b7280",children:[e.jsx(t,{layout:n.OneColumn,backgroundColor:"#e5e7eb",padding:"0px",children:e.jsx(a,{padding:"1px",children:e.jsx(o,{text:" ",fontSize:"1px",lineHeight:"1px",containerPadding:"0"})})}),e.jsx(t,{layout:n.OneColumn,backgroundColor:"#f9fafb",padding:"28px 24px 12px 24px",children:e.jsx(a,{children:e.jsx(o,{text:"Acme Inc. | 123 Main Street, San Francisco, CA 94105",fontSize:"12px",color:"#9ca3af",textAlign:"center",lineHeight:"150%",fontFamily:"Arial, Helvetica, sans-serif",containerPadding:"0 0 12px 0"})})}),e.jsx(t,{layout:n.OneColumn,backgroundColor:"#f9fafb",padding:"0px 24px 28px 24px",children:e.jsx(a,{children:e.jsx(c,{menu:{items:[{text:"View Online",link:{name:"web",values:{href:"https://example.com/view",target:"_blank"}}},{text:"Unsubscribe",link:{name:"web",values:{href:"https://example.com/unsubscribe",target:"_blank"}}},{text:"Privacy Policy",link:{name:"web",values:{href:"https://example.com/privacy",target:"_blank"}}},{text:"Terms",link:{name:"web",values:{href:"https://example.com/terms",target:"_blank"}}}]},layout:"horizontal",align:"center",separator:"-",padding:"6px 10px",fontSize:"12px",fontWeight:"normal",linkColor:"#6b7280",textColor:"#d1d5db",letterSpacing:"0px",fontFamily:{label:"Arial",value:"Arial, Helvetica, sans-serif"},containerPadding:"0"})})})]})}),parameters:{layout:"fullscreen",docs:{description:{story:`
**Email Footer Links**

Standard email footer with unsubscribe, privacy, and legal links.
Uses muted gray tones and a compact font size to keep the footer
unobtrusive while remaining accessible.

\`\`\`tsx
<Menu
  menu={{ items: [
    { text: "Unsubscribe", link: { ... } },
    { text: "Privacy Policy", link: { ... } },
  ]}}
  separator="-"
  fontSize="12px"
  linkColor="#6b7280"
/>
\`\`\`
        `}}}},p={render:()=>e.jsx(x,{config:{mode:"web"},children:e.jsxs(f,{backgroundColor:"#0f172a",contentAlign:"center",contentWidth:"800px",fontFamily:{label:"Inter",value:"Inter, system-ui, -apple-system, sans-serif"},textColor:"#ffffff",children:[e.jsx(t,{layout:n.OneColumn,backgroundColor:"#1e293b",padding:"20px 32px",children:e.jsx(a,{children:e.jsx(c,{menu:{items:[{text:"DASHBOARD",link:{name:"web",values:{href:"/dashboard",target:"_self"}}},{text:"ANALYTICS",link:{name:"web",values:{href:"/analytics",target:"_self"}}},{text:"TEMPLATES",link:{name:"web",values:{href:"/templates",target:"_self"}}},{text:"INTEGRATIONS",link:{name:"web",values:{href:"/integrations",target:"_self"}}},{text:"SETTINGS",link:{name:"web",values:{href:"/settings",target:"_self"}}}]},layout:"horizontal",align:"center",separator:"",padding:"10px 20px",fontSize:"12px",fontWeight:"700",linkColor:"#94a3b8",textColor:"#475569",letterSpacing:"1.5px",fontFamily:{label:"Inter",value:"Inter, system-ui, -apple-system, sans-serif"},containerPadding:"0"})})}),e.jsx(t,{layout:n.OneColumn,backgroundColor:"#0f172a",padding:"64px 40px 48px 40px",children:e.jsxs(a,{children:[e.jsx(u,{level:"h1",fontSize:"44px",fontWeight:"800",color:"#f8fafc",textAlign:"center",fontFamily:"Inter, system-ui, sans-serif",lineHeight:"110%",containerPadding:"0 0 20px 0",children:"Ship faster with Unlayer"}),e.jsx(o,{text:"Drag-and-drop email and page builders you can embed in your SaaS in minutes, not months.",fontSize:"18px",color:"#94a3b8",textAlign:"center",lineHeight:"160%",fontFamily:"Inter, system-ui, sans-serif",containerPadding:"0"})]})})]})}),parameters:{layout:"fullscreen",docs:{description:{story:`
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
  menu={{ items: [...] }}
  separator=""
  fontSize="12px"
  fontWeight="700"
  letterSpacing="1.5px"
  linkColor="#94a3b8"
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
  },
  parameters: {
    docs: {
      description: {
        story: \`**Full Control** — use the \\\`menu\\\` prop with full link config objects for complete control.

\\\`\\\`\\\`tsx
<Menu
  menu={{
    items: [
      { text: "Home", link: { name: "web", values: { href: "#home", target: "_blank" } } },
      { text: "About", link: { name: "web", values: { href: "#about", target: "_blank" } } },
    ]
  }}
  separator="|"
  linkColor="#2563eb"
/>
\\\`\\\`\\\`\`
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
            <Heading level="h2" fontSize="28px" fontWeight="700" color="#111827" textAlign="center" fontFamily="Arial, Helvetica, sans-serif" lineHeight="110%" containerPadding="0 0 4px 0">
              Acme Inc.
            </Heading>
          </Column>
        </Row>

        {/* Navigation menu */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0px 24px 24px 24px">
          <Column>
            <Menu menu={{
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
          }} layout="horizontal" align="center" separator="|" padding="8px 14px" fontSize="14px" fontWeight="normal" linkColor="#4b5563" textColor="#9ca3af" letterSpacing="0px" fontFamily={{
            label: "Arial",
            value: "Arial, Helvetica, sans-serif"
          }} containerPadding="0" />
          </Column>
        </Row>

        {/* Thin accent divider */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#2563eb" padding="0px">
          <Column padding="2px">
            <Paragraph text=" " fontSize="1px" lineHeight="1px" containerPadding="0" />
          </Column>
        </Row>

        {/* Email body content */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="40px 32px">
          <Column>
            <Heading level="h1" fontSize="24px" fontWeight="700" color="#111827" textAlign="left" fontFamily="Arial, Helvetica, sans-serif" lineHeight="130%" containerPadding="0 0 16px 0">
              Your weekly digest is here
            </Heading>
            <Paragraph text="Here is a summary of what happened this week across your projects and teams. Click on any section to dive deeper." fontSize="15px" color="#4b5563" textAlign="left" lineHeight="160%" fontFamily="Arial, Helvetica, sans-serif" containerPadding="0" />
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
      <Heading level="h2">Acme Inc.</Heading>
    </Column></Row>
    <Row><Column>
      <Menu
        menu={{ items: [...] }}
        separator="|"
      />
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
            <Paragraph text=" " fontSize="1px" lineHeight="1px" containerPadding="0" />
          </Column>
        </Row>

        {/* Footer content */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#f9fafb" padding="28px 24px 12px 24px">
          <Column>
            <Paragraph text="Acme Inc. | 123 Main Street, San Francisco, CA 94105" fontSize="12px" color="#9ca3af" textAlign="center" lineHeight="150%" fontFamily="Arial, Helvetica, sans-serif" containerPadding="0 0 12px 0" />
          </Column>
        </Row>

        {/* Footer menu links */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#f9fafb" padding="0px 24px 28px 24px">
          <Column>
            <Menu menu={{
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
          }} layout="horizontal" align="center" separator="-" padding="6px 10px" fontSize="12px" fontWeight="normal" linkColor="#6b7280" textColor="#d1d5db" letterSpacing="0px" fontFamily={{
            label: "Arial",
            value: "Arial, Helvetica, sans-serif"
          }} containerPadding="0" />
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
  menu={{ items: [
    { text: "Unsubscribe", link: { ... } },
    { text: "Privacy Policy", link: { ... } },
  ]}}
  separator="-"
  fontSize="12px"
  linkColor="#6b7280"
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
            <Menu menu={{
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
          }} layout="horizontal" align="center" separator="" padding="10px 20px" fontSize="12px" fontWeight="700" linkColor="#94a3b8" textColor="#475569" letterSpacing="1.5px" fontFamily={{
            label: "Inter",
            value: "Inter, system-ui, -apple-system, sans-serif"
          }} containerPadding="0" />
          </Column>
        </Row>

        {/* Hero content below nav */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#0f172a" padding="64px 40px 48px 40px">
          <Column>
            <Heading level="h1" fontSize="44px" fontWeight="800" color="#f8fafc" textAlign="center" fontFamily="Inter, system-ui, sans-serif" lineHeight="110%" containerPadding="0 0 20px 0">
              Ship faster with Unlayer
            </Heading>
            <Paragraph text="Drag-and-drop email and page builders you can embed in your SaaS in minutes, not months." fontSize="18px" color="#94a3b8" textAlign="center" lineHeight="160%" fontFamily="Inter, system-ui, sans-serif" containerPadding="0" />
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
  menu={{ items: [...] }}
  separator=""
  fontSize="12px"
  fontWeight="700"
  letterSpacing="1.5px"
  linkColor="#94a3b8"
/>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...p.parameters?.docs?.source}}};const M=["Default","FullPropsAPI","EmailHeader","FooterLinks","StyledNavigation"];export{r as Default,l as EmailHeader,s as FooterLinks,i as FullPropsAPI,p as StyledNavigation,M as __namedExportsOrder,W as default};
