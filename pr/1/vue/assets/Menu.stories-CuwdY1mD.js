import{c as w,Y as v,m as g}from"./create-component-D1merdym.js";import{T as p}from"./Text-Bju3ph6h.js";import{H as f}from"./Heading-BlN1fPTG.js";import{C as c,R as u,B as m}from"./Column-BthB5a2A.js";import"./iframe-BMyXcb8A.js";import"./preload-helper-PPVm8Dsz.js";import"./index-8x7ipbY-.js";const y={items:[]},s={align:"center",menu:y,layout:"horizontal",separator:"|"},t=w({name:"Menu",defaultValues:s,propMapper:e=>{const{items:d,...b}=e;if(Array.isArray(d)){const h=d.map((i,k)=>({key:String(k+1),text:i.text,link:{name:"web",values:{href:i.href,target:i.target??"_blank"}}})),x=g(b,s,"Menu");return x.menu={items:h},x}return g(e,s,"Menu")},exporters:v}),T={title:"Components/Menu",component:t,parameters:{layout:"centered",docs:{description:{component:`
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

\`\`\`html
<Menu
  :items="[
    { text: 'Home', href: '/' },
    { text: 'About', href: '/about' },
  ]"
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
}`}}}},tags:["autodocs"]},n={render:()=>({components:{Menu:t},setup(){return{items:[{text:"Home",href:"#home"},{text:"About",href:"#about"},{text:"Services",href:"#services"},{text:"Contact",href:"#contact"}]}},template:`
      <Menu
        :items="items"
        layout="horizontal"
        align="center"
        separator="|"
        padding="10px 16px"
        fontSize="14px"
        linkColor="#2563eb"
      />
    `}),parameters:{docs:{description:{story:`**Shorthand API** -- pass \`items\` as a simple array of \`{ text, href }\` objects.

\`\`\`html
<Menu
  :items="[
    { text: 'Home', href: '/' },
    { text: 'About', href: '/about' },
    { text: 'Contact', href: '/contact' },
  ]"
  separator="|"
  linkColor="#2563eb"
/>
\`\`\``}}}},a={render:()=>({components:{Menu:t},setup(){return{values:{menu:{items:[{text:"Home",link:{name:"web",values:{href:"#home",target:"_blank"}}},{text:"About",link:{name:"web",values:{href:"#about",target:"_blank"}}},{text:"Services",link:{name:"web",values:{href:"#services",target:"_blank"}}},{text:"Contact",link:{name:"web",values:{href:"#contact",target:"_blank"}}}]},layout:"horizontal",align:"center",separator:"|",padding:"10px 16px",fontSize:"14px",fontWeight:"normal",linkColor:"#2563eb",textColor:"#374151",letterSpacing:"0px"}}},template:`
      <Menu :values="values" />
    `}),parameters:{docs:{description:{story:"**Full Control** -- use the `values` prop for complete exporter-format control."}}}},o={render:()=>({components:{Body:m,Row:u,Column:c,Heading:f,Text:p,Menu:t},setup(){return{menuValues:{menu:{items:[{text:"Products",link:{name:"web",values:{href:"https://example.com/products",target:"_blank"}}},{text:"Pricing",link:{name:"web",values:{href:"https://example.com/pricing",target:"_blank"}}},{text:"Blog",link:{name:"web",values:{href:"https://example.com/blog",target:"_blank"}}},{text:"Support",link:{name:"web",values:{href:"https://example.com/support",target:"_blank"}}}]},layout:"horizontal",align:"center",separator:"|",padding:"8px 14px",fontSize:"14px",fontWeight:"normal",linkColor:"#4b5563",textColor:"#9ca3af",letterSpacing:"0px",containerPadding:"0"}}},template:`
      <Body mode="email" background-color="#f4f4f5" content-width="600px">
        <!-- Header bar -->
        <Row :cells="[1]" background-color="#ffffff" padding="32px 24px 16px 24px">
          <Column>
            <Heading text="Acme Inc." level="h2" font-size="28px" color="#111827" text-align="center" />
          </Column>
        </Row>

        <!-- Navigation menu -->
        <Row :cells="[1]" background-color="#ffffff" padding="0px 24px 24px 24px">
          <Column>
            <Menu :values="menuValues" />
          </Column>
        </Row>

        <!-- Thin accent divider -->
        <Row :cells="[1]" background-color="#2563eb" padding="0px">
          <Column padding="2px">
            <Text text="&nbsp;" font-size="1px" />
          </Column>
        </Row>

        <!-- Email body content -->
        <Row :cells="[1]" background-color="#ffffff" padding="40px 32px">
          <Column>
            <Heading text="Your weekly digest is here" level="h1" font-size="24px" color="#111827" text-align="left" />
            <Text
              text="Here is a summary of what happened this week across your projects and teams. Click on any section to dive deeper."
              font-size="15px"
              color="#4b5563"
              text-align="left"
            />
          </Column>
        </Row>
      </Body>
    `}),parameters:{layout:"fullscreen",docs:{description:{story:`
**Email Header with Navigation**

A realistic email header layout with company heading centered above the navigation.
Four links separated by pipe characters with a thin blue accent divider separating
header from body content.

\`\`\`html
<Body mode="email" content-width="600px">
  <Row><Column>
    <Heading text="Acme Inc." level="h2" />
  </Column></Row>
  <Row><Column>
    <Menu :values="menuValues" />
  </Column></Row>
</Body>
\`\`\`
        `}}}},r={render:()=>({components:{Body:m,Row:u,Column:c,Text:p,Menu:t},setup(){return{menuValues:{menu:{items:[{text:"View Online",link:{name:"web",values:{href:"https://example.com/view",target:"_blank"}}},{text:"Unsubscribe",link:{name:"web",values:{href:"https://example.com/unsubscribe",target:"_blank"}}},{text:"Privacy Policy",link:{name:"web",values:{href:"https://example.com/privacy",target:"_blank"}}},{text:"Terms",link:{name:"web",values:{href:"https://example.com/terms",target:"_blank"}}}]},layout:"horizontal",align:"center",separator:"-",padding:"6px 10px",fontSize:"12px",fontWeight:"normal",linkColor:"#6b7280",textColor:"#d1d5db",letterSpacing:"0px",containerPadding:"0"}}},template:`
      <Body mode="email" background-color="#f9fafb" content-width="600px">
        <!-- Spacer / end-of-email visual break -->
        <Row :cells="[1]" background-color="#e5e7eb" padding="0px">
          <Column padding="1px">
            <Text text="&nbsp;" font-size="1px" />
          </Column>
        </Row>

        <!-- Footer content -->
        <Row :cells="[1]" background-color="#f9fafb" padding="28px 24px 12px 24px">
          <Column>
            <Text
              text="Acme Inc. | 123 Main Street, San Francisco, CA 94105"
              font-size="12px"
              color="#9ca3af"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Footer menu links -->
        <Row :cells="[1]" background-color="#f9fafb" padding="0px 24px 28px 24px">
          <Column>
            <Menu :values="menuValues" />
          </Column>
        </Row>
      </Body>
    `}),parameters:{layout:"fullscreen",docs:{description:{story:`
**Email Footer Links**

Standard email footer with unsubscribe, privacy, and legal links.
Uses muted gray tones and a compact font size to keep the footer
unobtrusive while remaining accessible.

\`\`\`html
<Menu
  :values="{
    menu: { items: [
      { text: 'Unsubscribe', link: { ... } },
      { text: 'Privacy Policy', link: { ... } },
    ]},
    separator: '-',
    fontSize: '12px',
    linkColor: '#6b7280',
  }"
/>
\`\`\`
        `}}}},l={render:()=>({components:{Body:m,Row:u,Column:c,Heading:f,Text:p,Menu:t},setup(){return{menuValues:{menu:{items:[{text:"DASHBOARD",link:{name:"web",values:{href:"/dashboard",target:"_self"}}},{text:"ANALYTICS",link:{name:"web",values:{href:"/analytics",target:"_self"}}},{text:"TEMPLATES",link:{name:"web",values:{href:"/templates",target:"_self"}}},{text:"INTEGRATIONS",link:{name:"web",values:{href:"/integrations",target:"_self"}}},{text:"SETTINGS",link:{name:"web",values:{href:"/settings",target:"_self"}}}]},layout:"horizontal",align:"center",separator:"",padding:"10px 20px",fontSize:"12px",fontWeight:"700",linkColor:"#94a3b8",textColor:"#475569",letterSpacing:"1.5px",containerPadding:"0"}}},template:`
      <Body background-color="#0f172a" content-width="800px">
        <!-- Dark navigation bar -->
        <Row :cells="[1]" background-color="#1e293b" padding="20px 32px">
          <Column>
            <Menu :values="menuValues" />
          </Column>
        </Row>

        <!-- Hero content below nav -->
        <Row :cells="[1]" background-color="#0f172a" padding="64px 40px 48px 40px">
          <Column>
            <Heading
              text="Ship faster with Unlayer"
              level="h1"
              font-size="44px"
              color="#f8fafc"
              text-align="center"
            />
            <Text
              text="Drag-and-drop email and page builders you can embed in your SaaS in minutes, not months."
              font-size="18px"
              color="#94a3b8"
              text-align="center"
            />
          </Column>
        </Row>
      </Body>
    `}),parameters:{layout:"fullscreen",docs:{description:{story:`
**Bold Styled Navigation Bar**

An uppercase, letter-spaced navigation bar on a dark slate background.
No separators -- spacing alone distinguishes links. Paired with a hero
section to show how the menu fits into a full-page layout.

Key styling choices:
- \`fontWeight: "700"\` and \`letterSpacing: "1.5px"\` for bold, airy uppercase text
- \`separator: ""\` removes dividers for a minimal look
- \`linkColor: "#94a3b8"\` (slate-400) for muted links on dark backgrounds

\`\`\`html
<Menu
  :values="{
    menu: { items: [...] },
    separator: '',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '1.5px',
    linkColor: '#94a3b8',
  }"
/>
\`\`\`
        `}}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Menu
    },
    setup() {
      const items = [{
        text: 'Home',
        href: '#home'
      }, {
        text: 'About',
        href: '#about'
      }, {
        text: 'Services',
        href: '#services'
      }, {
        text: 'Contact',
        href: '#contact'
      }];
      return {
        items
      };
    },
    template: \`
      <Menu
        :items="items"
        layout="horizontal"
        align="center"
        separator="|"
        padding="10px 16px"
        fontSize="14px"
        linkColor="#2563eb"
      />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: \`**Shorthand API** -- pass \\\`items\\\` as a simple array of \\\`{ text, href }\\\` objects.

\\\`\\\`\\\`html
<Menu
  :items="[
    { text: 'Home', href: '/' },
    { text: 'About', href: '/about' },
    { text: 'Contact', href: '/contact' },
  ]"
  separator="|"
  linkColor="#2563eb"
/>
\\\`\\\`\\\`\`
      }
    }
  }
}`,...n.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Menu
    },
    setup() {
      const values = {
        menu: {
          items: [{
            text: 'Home',
            link: {
              name: 'web',
              values: {
                href: '#home',
                target: '_blank'
              }
            }
          }, {
            text: 'About',
            link: {
              name: 'web',
              values: {
                href: '#about',
                target: '_blank'
              }
            }
          }, {
            text: 'Services',
            link: {
              name: 'web',
              values: {
                href: '#services',
                target: '_blank'
              }
            }
          }, {
            text: 'Contact',
            link: {
              name: 'web',
              values: {
                href: '#contact',
                target: '_blank'
              }
            }
          }]
        },
        layout: 'horizontal',
        align: 'center',
        separator: '|',
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: 'normal',
        linkColor: '#2563eb',
        textColor: '#374151',
        letterSpacing: '0px'
      };
      return {
        values
      };
    },
    template: \`
      <Menu :values="values" />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Full Control** -- use the \`values\` prop for complete exporter-format control.'
      }
    }
  }
}`,...a.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Body,
      Row,
      Column,
      Heading,
      Text,
      Menu
    },
    setup() {
      const menuValues = {
        menu: {
          items: [{
            text: 'Products',
            link: {
              name: 'web',
              values: {
                href: 'https://example.com/products',
                target: '_blank'
              }
            }
          }, {
            text: 'Pricing',
            link: {
              name: 'web',
              values: {
                href: 'https://example.com/pricing',
                target: '_blank'
              }
            }
          }, {
            text: 'Blog',
            link: {
              name: 'web',
              values: {
                href: 'https://example.com/blog',
                target: '_blank'
              }
            }
          }, {
            text: 'Support',
            link: {
              name: 'web',
              values: {
                href: 'https://example.com/support',
                target: '_blank'
              }
            }
          }]
        },
        layout: 'horizontal',
        align: 'center',
        separator: '|',
        padding: '8px 14px',
        fontSize: '14px',
        fontWeight: 'normal',
        linkColor: '#4b5563',
        textColor: '#9ca3af',
        letterSpacing: '0px',
        containerPadding: '0'
      };
      return {
        menuValues
      };
    },
    template: \`
      <Body mode="email" background-color="#f4f4f5" content-width="600px">
        <!-- Header bar -->
        <Row :cells="[1]" background-color="#ffffff" padding="32px 24px 16px 24px">
          <Column>
            <Heading text="Acme Inc." level="h2" font-size="28px" color="#111827" text-align="center" />
          </Column>
        </Row>

        <!-- Navigation menu -->
        <Row :cells="[1]" background-color="#ffffff" padding="0px 24px 24px 24px">
          <Column>
            <Menu :values="menuValues" />
          </Column>
        </Row>

        <!-- Thin accent divider -->
        <Row :cells="[1]" background-color="#2563eb" padding="0px">
          <Column padding="2px">
            <Text text="&nbsp;" font-size="1px" />
          </Column>
        </Row>

        <!-- Email body content -->
        <Row :cells="[1]" background-color="#ffffff" padding="40px 32px">
          <Column>
            <Heading text="Your weekly digest is here" level="h1" font-size="24px" color="#111827" text-align="left" />
            <Text
              text="Here is a summary of what happened this week across your projects and teams. Click on any section to dive deeper."
              font-size="15px"
              color="#4b5563"
              text-align="left"
            />
          </Column>
        </Row>
      </Body>
    \`
  }),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: \`
**Email Header with Navigation**

A realistic email header layout with company heading centered above the navigation.
Four links separated by pipe characters with a thin blue accent divider separating
header from body content.

\\\`\\\`\\\`html
<Body mode="email" content-width="600px">
  <Row><Column>
    <Heading text="Acme Inc." level="h2" />
  </Column></Row>
  <Row><Column>
    <Menu :values="menuValues" />
  </Column></Row>
</Body>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Body,
      Row,
      Column,
      Text,
      Menu
    },
    setup() {
      const menuValues = {
        menu: {
          items: [{
            text: 'View Online',
            link: {
              name: 'web',
              values: {
                href: 'https://example.com/view',
                target: '_blank'
              }
            }
          }, {
            text: 'Unsubscribe',
            link: {
              name: 'web',
              values: {
                href: 'https://example.com/unsubscribe',
                target: '_blank'
              }
            }
          }, {
            text: 'Privacy Policy',
            link: {
              name: 'web',
              values: {
                href: 'https://example.com/privacy',
                target: '_blank'
              }
            }
          }, {
            text: 'Terms',
            link: {
              name: 'web',
              values: {
                href: 'https://example.com/terms',
                target: '_blank'
              }
            }
          }]
        },
        layout: 'horizontal',
        align: 'center',
        separator: '-',
        padding: '6px 10px',
        fontSize: '12px',
        fontWeight: 'normal',
        linkColor: '#6b7280',
        textColor: '#d1d5db',
        letterSpacing: '0px',
        containerPadding: '0'
      };
      return {
        menuValues
      };
    },
    template: \`
      <Body mode="email" background-color="#f9fafb" content-width="600px">
        <!-- Spacer / end-of-email visual break -->
        <Row :cells="[1]" background-color="#e5e7eb" padding="0px">
          <Column padding="1px">
            <Text text="&nbsp;" font-size="1px" />
          </Column>
        </Row>

        <!-- Footer content -->
        <Row :cells="[1]" background-color="#f9fafb" padding="28px 24px 12px 24px">
          <Column>
            <Text
              text="Acme Inc. | 123 Main Street, San Francisco, CA 94105"
              font-size="12px"
              color="#9ca3af"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Footer menu links -->
        <Row :cells="[1]" background-color="#f9fafb" padding="0px 24px 28px 24px">
          <Column>
            <Menu :values="menuValues" />
          </Column>
        </Row>
      </Body>
    \`
  }),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: \`
**Email Footer Links**

Standard email footer with unsubscribe, privacy, and legal links.
Uses muted gray tones and a compact font size to keep the footer
unobtrusive while remaining accessible.

\\\`\\\`\\\`html
<Menu
  :values="{
    menu: { items: [
      { text: 'Unsubscribe', link: { ... } },
      { text: 'Privacy Policy', link: { ... } },
    ]},
    separator: '-',
    fontSize: '12px',
    linkColor: '#6b7280',
  }"
/>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...r.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Body,
      Row,
      Column,
      Heading,
      Text,
      Menu
    },
    setup() {
      const menuValues = {
        menu: {
          items: [{
            text: 'DASHBOARD',
            link: {
              name: 'web',
              values: {
                href: '/dashboard',
                target: '_self'
              }
            }
          }, {
            text: 'ANALYTICS',
            link: {
              name: 'web',
              values: {
                href: '/analytics',
                target: '_self'
              }
            }
          }, {
            text: 'TEMPLATES',
            link: {
              name: 'web',
              values: {
                href: '/templates',
                target: '_self'
              }
            }
          }, {
            text: 'INTEGRATIONS',
            link: {
              name: 'web',
              values: {
                href: '/integrations',
                target: '_self'
              }
            }
          }, {
            text: 'SETTINGS',
            link: {
              name: 'web',
              values: {
                href: '/settings',
                target: '_self'
              }
            }
          }]
        },
        layout: 'horizontal',
        align: 'center',
        separator: '',
        padding: '10px 20px',
        fontSize: '12px',
        fontWeight: '700',
        linkColor: '#94a3b8',
        textColor: '#475569',
        letterSpacing: '1.5px',
        containerPadding: '0'
      };
      return {
        menuValues
      };
    },
    template: \`
      <Body background-color="#0f172a" content-width="800px">
        <!-- Dark navigation bar -->
        <Row :cells="[1]" background-color="#1e293b" padding="20px 32px">
          <Column>
            <Menu :values="menuValues" />
          </Column>
        </Row>

        <!-- Hero content below nav -->
        <Row :cells="[1]" background-color="#0f172a" padding="64px 40px 48px 40px">
          <Column>
            <Heading
              text="Ship faster with Unlayer"
              level="h1"
              font-size="44px"
              color="#f8fafc"
              text-align="center"
            />
            <Text
              text="Drag-and-drop email and page builders you can embed in your SaaS in minutes, not months."
              font-size="18px"
              color="#94a3b8"
              text-align="center"
            />
          </Column>
        </Row>
      </Body>
    \`
  }),
  parameters: {
    layout: 'fullscreen',
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

\\\`\\\`\\\`html
<Menu
  :values="{
    menu: { items: [...] },
    separator: '',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '1.5px',
    linkColor: '#94a3b8',
  }"
/>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...l.parameters?.docs?.source}}};const H=["Default","FullValuesAPI","EmailHeader","FooterLinks","StyledNavigation"];export{n as Default,o as EmailHeader,r as FooterLinks,a as FullValuesAPI,l as StyledNavigation,H as __namedExportsOrder,T as default};
