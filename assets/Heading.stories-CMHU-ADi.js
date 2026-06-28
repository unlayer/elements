import{j as e}from"./jsx-runtime-Dl1zKUgA.js";import{H as n}from"./Heading-DT4TGWwu.js";import"./iframe-B0drAsko.js";import"./preload-helper-PPVm8Dsz.js";import"./create-component-BRXiI3nx.js";const b={title:"Components/Heading",component:n,parameters:{layout:"centered",docs:{description:{component:`
Semantic heading elements (H1-H6) with **schema-driven typography defaults** and **SEO optimization**.

## Key Features
- **Semantic HTML**: Proper H1, H2, H3, H4, H5, H6 elements
- **SEO Optimized**: Proper heading hierarchy for search engines
- **Rich Typography**: Custom fonts, sizes, colors, spacing
- **Responsive**: Mobile-optimized sizing and line heights
- **Email-Safe**: Conservative styling for email clients
- **Performance**: CDN-loaded with fallback rendering

## Heading Hierarchy
- **H1**: Main page title, primary heading (largest)
- **H2**: Section headings, major topics
- **H3**: Subsection headings, article titles
- **H4**: Minor headings, card titles
- **H5**: Small headings, labels
- **H6**: Smallest headings, captions

## Common Use Cases
- Article and blog post titles
- Section headers in emails and web pages
- Product names and feature headings
- Navigation and menu headings
- Card titles and callout headers
- Email newsletter section titles

## Usage

\`\`\`tsx
<Heading level="h1" color="#111827" fontSize="36px" fontWeight="800">
  Welcome to Our Platform
</Heading>
\`\`\`
        `}}},argTypes:{mode:{control:{type:"select"},options:["web","email","document"],description:"**Rendering Mode** - Controls output format and heading optimizations",table:{defaultValue:{summary:"web"},type:{summary:"RenderMode"}}}},tags:["autodocs"]},i={render:()=>e.jsx(n,{level:"h1",children:"Welcome to Our Platform"}),parameters:{docs:{description:{story:`
**Simplest Usage - Text as Children**

Just pass your heading text as children with a semantic level:

\`\`\`tsx
<Heading level="h1">
  Welcome to Our Platform
</Heading>
\`\`\`

Perfect for:
- Quick prototyping
- Simple headings with default styling
- SEO-friendly semantic HTML
        `}}}},t={render:()=>e.jsx(n,{level:"h2",color:"#2563eb",fontSize:"32px",fontWeight:"700",textAlign:"center",lineHeight:"1.2",letterSpacing:"-0.025em",children:"Features & Benefits"}),parameters:{docs:{description:{story:`
**Semantic Props + Children**

Combine semantic styling props with children text for a clean, readable API:

\`\`\`tsx
<Heading
  level="h2"
  color="#2563eb"
  fontSize="32px"
  fontWeight="700"
  textAlign="center"
  lineHeight="1.2"
>
  Features & Benefits
</Heading>
\`\`\`

Available semantic props:
- \`level\`: Semantic level ("h1" | "h2" | "h3" | "h4" | "h5" | "h6")
- \`color\`: Text color (any CSS color)
- \`fontSize\`: Text size (e.g., "32px", "2rem")
- \`fontWeight\`: Text weight (e.g., "700", "800", "bold")
- \`fontFamily\`: Font family object
- \`textAlign\`: "left" | "center" | "right"
- \`lineHeight\`: Line spacing (e.g., "1.2", "1.4")
- \`letterSpacing\`: Letter spacing (e.g., "-0.025em")
- \`containerPadding\`: Padding around heading
        `}}}},o={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"20px",maxWidth:"800px"},children:[e.jsx(n,{level:"h1",fontSize:"36px",fontWeight:"800",color:"#111827",children:"H1 - Main Page Title"}),e.jsx(n,{level:"h2",fontSize:"28px",fontWeight:"700",color:"#1f2937",children:"H2 - Section Heading"}),e.jsx(n,{level:"h3",fontSize:"24px",fontWeight:"600",color:"#374151",children:"H3 - Subsection Title"}),e.jsx(n,{level:"h4",fontSize:"20px",fontWeight:"600",color:"#4b5563",children:"H4 - Component Title"})]}),parameters:{docs:{description:{story:`
**Complete Heading Hierarchy**

Shows all heading levels with semantic props:

\`\`\`tsx
<Heading level="h1" fontSize="36px" fontWeight="800">
  H1 - Main Page Title
</Heading>

<Heading level="h2" fontSize="28px" fontWeight="700">
  H2 - Section Heading
</Heading>

<Heading level="h3" fontSize="24px" fontWeight="600">
  H3 - Subsection Title
</Heading>
\`\`\`

Proper heading hierarchy improves SEO and accessibility!
        `}}}},r={render:()=>e.jsx(n,{level:"h2",mode:"web",children:"Default Heading Text"}),parameters:{docs:{description:{story:"**Default Heading** - Uses children text with a semantic level prop for a clean, React-idiomatic API."}}}},l={name:"H1 Heading",render:()=>e.jsx(n,{level:"h1",fontSize:"36px",fontWeight:"800",color:"#111827",textAlign:"center",lineHeight:"1.1",letterSpacing:"-0.025em",mode:"web",children:"Welcome to Our Platform"})},a={name:"H2 Heading",render:()=>e.jsx(n,{level:"h2",fontSize:"28px",fontWeight:"700",color:"#1f2937",textAlign:"left",lineHeight:"1.2",containerPadding:"0 0 16px 0",mode:"web",children:"Features & Benefits"})},d={name:"H3 Heading",render:()=>e.jsx(n,{level:"h3",fontSize:"24px",fontWeight:"600",color:"#374151",textAlign:"left",lineHeight:"1.3",mode:"web",children:"Getting Started Guide"})},s={name:"H4 Heading",render:()=>e.jsx(n,{level:"h4",fontSize:"20px",fontWeight:"600",color:"#4b5563",textAlign:"left",lineHeight:"1.4",mode:"web",children:"Advanced Configuration"})},g={render:()=>e.jsx(n,{level:"h2",fontSize:"32px",fontWeight:"700",color:"#7c3aed",textAlign:"center",lineHeight:"1.2",textTransform:"uppercase",letterSpacing:"0.05em",mode:"web",children:"Premium Features"})},c={render:()=>e.jsx(n,{level:"h1",fontSize:"40px",fontWeight:"800",color:"#8b5cf6",textAlign:"center",lineHeight:"1.1",letterSpacing:"-0.02em",mode:"web",children:"The Future is Here"}),parameters:{docs:{description:{story:"**Gradient-Inspired Heading** - Uses a vibrant purple color that evokes gradient aesthetics while being compatible with Unlayer's renderer system."}}}},h={render:()=>e.jsx(n,{level:"h1",fontSize:"28px",fontWeight:"bold",color:"#333333",textAlign:"center",lineHeight:"1.2",fontFamily:{label:"Arial",value:"Arial, Helvetica, sans-serif"},mode:"email",children:"Monthly Newsletter"})},p={render:()=>e.jsx(n,{level:"h2",fontSize:"26px",fontWeight:"600",color:"#2563eb",textAlign:"left",lineHeight:"1.3",linkStyle:{inherit:!1,linkColor:"#2563eb",linkHoverColor:"#1d4ed8",linkUnderline:!1,linkHoverUnderline:!0},mode:"web",children:"Read Our Blog"})},f={render:()=>e.jsx(n,{level:"h2",fontSize:"30px",fontWeight:"600",color:"#1f2937",textAlign:"center",lineHeight:"1.2",fontFamily:{label:"Source Sans Pro",value:"Source Sans Pro, Arial, sans-serif"},letterSpacing:"0.025em",mode:"web",children:"Enterprise Solutions"})},m={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"24px",padding:"40px",background:"#ffffff",maxWidth:"800px"},children:[e.jsxs("div",{children:[e.jsx("h3",{style:{margin:"0 0 20px",color:"#1f2937",fontSize:"24px",fontWeight:"700"},children:"Heading Hierarchy"}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"16px"},children:[e.jsx(n,{level:"h1",fontSize:"36px",fontWeight:"800",color:"#111827",textAlign:"left",lineHeight:"1.1",mode:"web",children:"H1 - Main Page Title"}),e.jsx(n,{level:"h2",fontSize:"28px",fontWeight:"700",color:"#1f2937",textAlign:"left",lineHeight:"1.2",mode:"web",children:"H2 - Section Heading"}),e.jsx(n,{level:"h3",fontSize:"24px",fontWeight:"600",color:"#374151",textAlign:"left",lineHeight:"1.3",mode:"web",children:"H3 - Subsection Title"}),e.jsx(n,{level:"h4",fontSize:"20px",fontWeight:"600",color:"#4b5563",textAlign:"left",lineHeight:"1.4",mode:"web",children:"H4 - Component Title"}),e.jsx(n,{level:"h5",fontSize:"18px",fontWeight:"600",color:"#6b7280",textAlign:"left",lineHeight:"1.4",mode:"web",children:"H5 - Small Section"}),e.jsx(n,{level:"h6",fontSize:"16px",fontWeight:"600",color:"#9ca3af",textAlign:"left",lineHeight:"1.5",mode:"web",children:"H6 - Minor Heading"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{style:{margin:"0 0 20px",color:"#1f2937",fontSize:"24px",fontWeight:"700"},children:"Styled Headings"}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"20px"},children:[e.jsx(n,{level:"h2",fontSize:"24px",fontWeight:"700",color:"#7c3aed",textAlign:"center",textTransform:"uppercase",letterSpacing:"0.1em",mode:"web",children:"PREMIUM FEATURES"}),e.jsx(n,{level:"h2",fontSize:"32px",fontWeight:"800",color:"#667eea",textAlign:"center",lineHeight:"1.2",mode:"web",children:"Gradient Magic Heading"}),e.jsx(n,{level:"h3",fontSize:"26px",fontWeight:"600",color:"#1f2937",textAlign:"left",letterSpacing:"0.025em",fontFamily:{label:"Source Sans Pro",value:"Source Sans Pro, Arial, sans-serif"},mode:"web",children:"Professional Business Title"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{style:{margin:"0 0 20px",color:"#1f2937",fontSize:"24px",fontWeight:"700"},children:"Color Variations"}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:"16px"},children:[e.jsx(n,{level:"h3",fontSize:"24px",fontWeight:"600",color:"#2563eb",textAlign:"center",mode:"web",children:"Primary Blue"}),e.jsx(n,{level:"h3",fontSize:"24px",fontWeight:"600",color:"#059669",textAlign:"center",mode:"web",children:"Success Green"}),e.jsx(n,{level:"h3",fontSize:"24px",fontWeight:"600",color:"#d97706",textAlign:"center",mode:"web",children:"Warning Orange"}),e.jsx(n,{level:"h3",fontSize:"24px",fontWeight:"600",color:"#dc2626",textAlign:"center",mode:"web",children:"Danger Red"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{style:{margin:"0 0 20px",color:"#1f2937",fontSize:"24px",fontWeight:"700"},children:"Email-Safe Headings"}),e.jsx("div",{style:{backgroundColor:"#f9fafb",padding:"24px",borderRadius:"8px"},children:e.jsx(n,{level:"h1",fontSize:"28px",fontWeight:"bold",color:"#333333",textAlign:"center",lineHeight:"1.2",fontFamily:{label:"Arial",value:"Arial, Helvetica, sans-serif"},mode:"email",children:"Email Newsletter Title"})})]})]})};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <Heading level="h1">
      Welcome to Our Platform
    </Heading>,
  parameters: {
    docs: {
      description: {
        story: \`
**Simplest Usage - Text as Children**

Just pass your heading text as children with a semantic level:

\\\`\\\`\\\`tsx
<Heading level="h1">
  Welcome to Our Platform
</Heading>
\\\`\\\`\\\`

Perfect for:
- Quick prototyping
- Simple headings with default styling
- SEO-friendly semantic HTML
        \`
      }
    }
  }
}`,...i.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <Heading level="h2" color="#2563eb" fontSize="32px" fontWeight="700" textAlign="center" lineHeight="1.2" letterSpacing="-0.025em">
      Features & Benefits
    </Heading>,
  parameters: {
    docs: {
      description: {
        story: \`
**Semantic Props + Children**

Combine semantic styling props with children text for a clean, readable API:

\\\`\\\`\\\`tsx
<Heading
  level="h2"
  color="#2563eb"
  fontSize="32px"
  fontWeight="700"
  textAlign="center"
  lineHeight="1.2"
>
  Features & Benefits
</Heading>
\\\`\\\`\\\`

Available semantic props:
- \\\`level\\\`: Semantic level ("h1" | "h2" | "h3" | "h4" | "h5" | "h6")
- \\\`color\\\`: Text color (any CSS color)
- \\\`fontSize\\\`: Text size (e.g., "32px", "2rem")
- \\\`fontWeight\\\`: Text weight (e.g., "700", "800", "bold")
- \\\`fontFamily\\\`: Font family object
- \\\`textAlign\\\`: "left" | "center" | "right"
- \\\`lineHeight\\\`: Line spacing (e.g., "1.2", "1.4")
- \\\`letterSpacing\\\`: Letter spacing (e.g., "-0.025em")
- \\\`containerPadding\\\`: Padding around heading
        \`
      }
    }
  }
}`,...t.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxWidth: "800px"
  }}>
      <Heading level="h1" fontSize="36px" fontWeight="800" color="#111827">
        H1 - Main Page Title
      </Heading>
      <Heading level="h2" fontSize="28px" fontWeight="700" color="#1f2937">
        H2 - Section Heading
      </Heading>
      <Heading level="h3" fontSize="24px" fontWeight="600" color="#374151">
        H3 - Subsection Title
      </Heading>
      <Heading level="h4" fontSize="20px" fontWeight="600" color="#4b5563">
        H4 - Component Title
      </Heading>
    </div>,
  parameters: {
    docs: {
      description: {
        story: \`
**Complete Heading Hierarchy**

Shows all heading levels with semantic props:

\\\`\\\`\\\`tsx
<Heading level="h1" fontSize="36px" fontWeight="800">
  H1 - Main Page Title
</Heading>

<Heading level="h2" fontSize="28px" fontWeight="700">
  H2 - Section Heading
</Heading>

<Heading level="h3" fontSize="24px" fontWeight="600">
  H3 - Subsection Title
</Heading>
\\\`\\\`\\\`

Proper heading hierarchy improves SEO and accessibility!
        \`
      }
    }
  }
}`,...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <Heading level="h2" mode="web">
      Default Heading Text
    </Heading>,
  parameters: {
    docs: {
      description: {
        story: "**Default Heading** - Uses children text with a semantic level prop for a clean, React-idiomatic API."
      }
    }
  }
}`,...r.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "H1 Heading",
  render: () => <Heading level="h1" fontSize="36px" fontWeight="800" color="#111827" textAlign="center" lineHeight="1.1" letterSpacing="-0.025em" mode="web">
      Welcome to Our Platform
    </Heading>
}`,...l.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: "H2 Heading",
  render: () => <Heading level="h2" fontSize="28px" fontWeight="700" color="#1f2937" textAlign="left" lineHeight="1.2" containerPadding="0 0 16px 0" mode="web">
      Features & Benefits
    </Heading>
}`,...a.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "H3 Heading",
  render: () => <Heading level="h3" fontSize="24px" fontWeight="600" color="#374151" textAlign="left" lineHeight="1.3" mode="web">
      Getting Started Guide
    </Heading>
}`,...d.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "H4 Heading",
  render: () => <Heading level="h4" fontSize="20px" fontWeight="600" color="#4b5563" textAlign="left" lineHeight="1.4" mode="web">
      Advanced Configuration
    </Heading>
}`,...s.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <Heading level="h2" fontSize="32px" fontWeight="700" color="#7c3aed" textAlign="center" lineHeight="1.2" textTransform="uppercase" letterSpacing="0.05em" mode="web">
      Premium Features
    </Heading>
}`,...g.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <Heading level="h1" fontSize="40px" fontWeight="800" color="#8b5cf6" textAlign="center" lineHeight="1.1" letterSpacing="-0.02em" mode="web">
      The Future is Here
    </Heading>,
  parameters: {
    docs: {
      description: {
        story: "**Gradient-Inspired Heading** - Uses a vibrant purple color that evokes gradient aesthetics while being compatible with Unlayer's renderer system."
      }
    }
  }
}`,...c.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <Heading level="h1" fontSize="28px" fontWeight="bold" color="#333333" textAlign="center" lineHeight="1.2" fontFamily={{
    label: "Arial",
    value: "Arial, Helvetica, sans-serif"
  }} mode="email">
      Monthly Newsletter
    </Heading>
}`,...h.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <Heading level="h2" fontSize="26px" fontWeight="600" color="#2563eb" textAlign="left" lineHeight="1.3" linkStyle={{
    inherit: false,
    linkColor: "#2563eb",
    linkHoverColor: "#1d4ed8",
    linkUnderline: false,
    linkHoverUnderline: true
  }} mode="web">
      Read Our Blog
    </Heading>
}`,...p.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <Heading level="h2" fontSize="30px" fontWeight="600" color="#1f2937" textAlign="center" lineHeight="1.2" fontFamily={{
    label: "Source Sans Pro",
    value: "Source Sans Pro, Arial, sans-serif"
  }} letterSpacing="0.025em" mode="web">
      Enterprise Solutions
    </Heading>
}`,...f.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    padding: "40px",
    background: "#ffffff",
    maxWidth: "800px"
  }}>
      <div>
        <h3 style={{
        margin: "0 0 20px",
        color: "#1f2937",
        fontSize: "24px",
        fontWeight: "700"
      }}>
          Heading Hierarchy
        </h3>
        <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
          <Heading level="h1" fontSize="36px" fontWeight="800" color="#111827" textAlign="left" lineHeight="1.1" mode="web">
            H1 - Main Page Title
          </Heading>
          <Heading level="h2" fontSize="28px" fontWeight="700" color="#1f2937" textAlign="left" lineHeight="1.2" mode="web">
            H2 - Section Heading
          </Heading>
          <Heading level="h3" fontSize="24px" fontWeight="600" color="#374151" textAlign="left" lineHeight="1.3" mode="web">
            H3 - Subsection Title
          </Heading>
          <Heading level="h4" fontSize="20px" fontWeight="600" color="#4b5563" textAlign="left" lineHeight="1.4" mode="web">
            H4 - Component Title
          </Heading>
          <Heading level="h5" fontSize="18px" fontWeight="600" color="#6b7280" textAlign="left" lineHeight="1.4" mode="web">
            H5 - Small Section
          </Heading>
          <Heading level="h6" fontSize="16px" fontWeight="600" color="#9ca3af" textAlign="left" lineHeight="1.5" mode="web">
            H6 - Minor Heading
          </Heading>
        </div>
      </div>

      <div>
        <h3 style={{
        margin: "0 0 20px",
        color: "#1f2937",
        fontSize: "24px",
        fontWeight: "700"
      }}>
          Styled Headings
        </h3>
        <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>
          <Heading level="h2" fontSize="24px" fontWeight="700" color="#7c3aed" textAlign="center" textTransform="uppercase" letterSpacing="0.1em" mode="web">
            PREMIUM FEATURES
          </Heading>
          <Heading level="h2" fontSize="32px" fontWeight="800" color="#667eea" textAlign="center" lineHeight="1.2" mode="web">
            Gradient Magic Heading
          </Heading>
          <Heading level="h3" fontSize="26px" fontWeight="600" color="#1f2937" textAlign="left" letterSpacing="0.025em" fontFamily={{
          label: "Source Sans Pro",
          value: "Source Sans Pro, Arial, sans-serif"
        }} mode="web">
            Professional Business Title
          </Heading>
        </div>
      </div>

      <div>
        <h3 style={{
        margin: "0 0 20px",
        color: "#1f2937",
        fontSize: "24px",
        fontWeight: "700"
      }}>
          Color Variations
        </h3>
        <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "16px"
      }}>
          <Heading level="h3" fontSize="24px" fontWeight="600" color="#2563eb" textAlign="center" mode="web">
            Primary Blue
          </Heading>
          <Heading level="h3" fontSize="24px" fontWeight="600" color="#059669" textAlign="center" mode="web">
            Success Green
          </Heading>
          <Heading level="h3" fontSize="24px" fontWeight="600" color="#d97706" textAlign="center" mode="web">
            Warning Orange
          </Heading>
          <Heading level="h3" fontSize="24px" fontWeight="600" color="#dc2626" textAlign="center" mode="web">
            Danger Red
          </Heading>
        </div>
      </div>

      <div>
        <h3 style={{
        margin: "0 0 20px",
        color: "#1f2937",
        fontSize: "24px",
        fontWeight: "700"
      }}>
          Email-Safe Headings
        </h3>
        <div style={{
        backgroundColor: "#f9fafb",
        padding: "24px",
        borderRadius: "8px"
      }}>
          <Heading level="h1" fontSize="28px" fontWeight="bold" color="#333333" textAlign="center" lineHeight="1.2" fontFamily={{
          label: "Arial",
          value: "Arial, Helvetica, sans-serif"
        }} mode="email">
            Email Newsletter Title
          </Heading>
        </div>
      </div>
    </div>
}`,...m.parameters?.docs?.source}}};const y=["SimpleHeading","WithSemanticProps","MultipleHeadingLevels","Default","H1Heading","H2Heading","H3Heading","H4Heading","ColoredHeading","GradientHeading","EmailHeading","LinkedHeading","CorporateHeading","HeadingHierarchy"];export{g as ColoredHeading,f as CorporateHeading,r as Default,h as EmailHeading,c as GradientHeading,l as H1Heading,a as H2Heading,d as H3Heading,s as H4Heading,m as HeadingHierarchy,p as LinkedHeading,o as MultipleHeadingLevels,i as SimpleHeading,t as WithSemanticProps,y as __namedExportsOrder,b as default};
