import{j as e}from"./jsx-runtime-aAGwtYT1.js";import{H as n}from"./Heading-jhDfz08L.js";import"./iframe-BuDeX7mP.js";import"./preload-helper-PPVm8Dsz.js";import"./create-component-BLckUOSM.js";const v={title:"Components/Heading",component:n,parameters:{layout:"centered",docs:{description:{component:`
# 📰 Heading Component

Semantic heading elements (H1-H6) with **schema-driven typography defaults** and **SEO optimization**.

## Key Features
- 📋 **Semantic HTML**: Proper H1, H2, H3, H4, H5, H6 elements
- 🔍 **SEO Optimized**: Proper heading hierarchy for search engines
- 🎨 **Rich Typography**: Custom fonts, sizes, colors, spacing
- 📱 **Responsive**: Mobile-optimized sizing and line heights
- 📧 **Email-Safe**: Conservative styling for email clients  
- ⚡ **Performance**: CDN-loaded with fallback rendering

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

## 2 Ways to Use Heading

### Option 1: Semantic Props (Recommended!)
\`\`\`tsx
<Heading level="h1" color="#111827" fontSize="36px" fontWeight="800">
  Welcome to Our Platform
</Heading>
\`\`\`

### Option 2: Values Object (Full Control)
\`\`\`tsx
<Heading values={{
  text: "Welcome to Our Platform",
  headingType: "h1",
  color: "#111827",
  fontSize: "36px",
  fontWeight: "800"
}} />
\`\`\`
        `}}},argTypes:{values:{description:'**Heading Configuration Object**\n\nMain heading and styling options:\n- `text`: Heading content to display\n- `headingType`: Semantic level ("h1", "h2", "h3", "h4", "h5", "h6")\n- `fontSize`: Text size (e.g. "32px", "2rem")\n- `fontFamily`: Font selection with fallbacks\n- `fontWeight`: Text weight (e.g. "700", "900", "bold")\n- `color`: Text color (hex, rgb, named colors)\n- `textAlign`: Alignment ("left", "center", "right")\n- `lineHeight`: Line spacing (e.g. "1.2", "1.4")\n- `letterSpacing`: Character spacing (e.g. "-0.025em")\n- `textTransform`: Case transformation ("uppercase", "lowercase")\n\n*See individual stories below for complete examples*',control:!1,table:{type:{summary:"HeadingValues",detail:`{
  text?: string
  headingType?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  fontSize?: string
  fontFamily?: FontConfig
  fontWeight?: string
  color?: string
  textAlign?: "left" | "center" | "right"
  lineHeight?: string
  letterSpacing?: string
  textTransform?: "uppercase" | "lowercase" | "capitalize"
  // ... and more typography options
}`}}},mode:{control:{type:"select"},options:["web","email","document"],description:"**Rendering Mode** - Controls output format and heading optimizations",table:{defaultValue:{summary:"web"},type:{summary:"RenderMode"}}}},tags:["autodocs"]},t={render:()=>e.jsx(n,{level:"h1",children:"Welcome to Our Platform"}),parameters:{docs:{description:{story:`
**✨ Simplest Usage - Text as Children**

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
        `}}}},i={render:()=>e.jsx(n,{level:"h2",color:"#2563eb",fontSize:"32px",fontWeight:"700",textAlign:"center",lineHeight:"1.2",letterSpacing:"-0.025em",children:"Features & Benefits"}),parameters:{docs:{description:{story:`
**🎨 Semantic Props + Children**

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
**📰 Complete Heading Hierarchy**

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
        `}}}},a={args:{values:{text:"Default Heading Text",headingType:"h2"},mode:"web"},parameters:{docs:{description:{story:"**Default Heading (Values API)** - Uses the values object for full control. This approach gives you access to all Unlayer configuration options."}}}},r={args:{values:{text:"Welcome to Our Platform",headingType:"h1",fontSize:"36px",fontWeight:"800",color:"#111827",textAlign:"center",lineHeight:"1.1",letterSpacing:"-0.025em"},mode:"web"}},l={args:{values:{text:"Features & Benefits",headingType:"h2",fontSize:"28px",fontWeight:"700",color:"#1f2937",textAlign:"left",lineHeight:"1.2",containerPadding:"0 0 16px 0"},mode:"web"}},s={args:{values:{text:"Getting Started Guide",headingType:"h3",fontSize:"24px",fontWeight:"600",color:"#374151",textAlign:"left",lineHeight:"1.3"},mode:"web"}},g={args:{values:{text:"Advanced Configuration",headingType:"h4",fontSize:"20px",fontWeight:"600",color:"#4b5563",textAlign:"left",lineHeight:"1.4"},mode:"web"}},d={args:{values:{text:"Premium Features",headingType:"h2",fontSize:"32px",fontWeight:"700",color:"#7c3aed",textAlign:"center",lineHeight:"1.2",textTransform:"uppercase",letterSpacing:"0.05em"},mode:"web"}},c={args:{values:{text:"🌟 The Future is Here",headingType:"h1",fontSize:"40px",fontWeight:"800",color:"#8b5cf6",textAlign:"center",lineHeight:"1.1",letterSpacing:"-0.02em"},mode:"web"},parameters:{docs:{description:{story:"**Gradient-Inspired Heading** - Uses a vibrant purple color that evokes gradient aesthetics while being compatible with Unlayer's renderer system."}}}},p={args:{values:{text:"Monthly Newsletter",headingType:"h1",fontSize:"28px",fontWeight:"bold",color:"#333333",textAlign:"center",lineHeight:"1.2",fontFamily:{label:"Arial",value:"Arial, Helvetica, sans-serif"}},mode:"email"}},h={args:{values:{text:"Read Our Blog",headingType:"h2",fontSize:"26px",fontWeight:"600",color:"#2563eb",textAlign:"left",lineHeight:"1.3",linkStyle:{inherit:!1,linkColor:"#2563eb",linkHoverColor:"#1d4ed8",linkUnderline:!1,linkHoverUnderline:!0}},mode:"web"}},f={args:{values:{text:"Enterprise Solutions",headingType:"h2",fontSize:"30px",fontWeight:"600",color:"#1f2937",textAlign:"center",lineHeight:"1.2",fontFamily:{label:"Source Sans Pro",value:"Source Sans Pro, Arial, sans-serif"},letterSpacing:"0.025em"},mode:"web"}},m={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"24px",padding:"40px",background:"#ffffff",maxWidth:"800px"},children:[e.jsxs("div",{children:[e.jsx("h3",{style:{margin:"0 0 20px",color:"#1f2937",fontSize:"24px",fontWeight:"700"},children:"📰 Heading Hierarchy"}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"16px"},children:[e.jsx(n,{values:{text:"H1 - Main Page Title",headingType:"h1",fontSize:"36px",fontWeight:"800",color:"#111827",textAlign:"left",lineHeight:"1.1"},mode:"web"}),e.jsx(n,{values:{text:"H2 - Section Heading",headingType:"h2",fontSize:"28px",fontWeight:"700",color:"#1f2937",textAlign:"left",lineHeight:"1.2"},mode:"web"}),e.jsx(n,{values:{text:"H3 - Subsection Title",headingType:"h3",fontSize:"24px",fontWeight:"600",color:"#374151",textAlign:"left",lineHeight:"1.3"},mode:"web"}),e.jsx(n,{values:{text:"H4 - Component Title",headingType:"h4",fontSize:"20px",fontWeight:"600",color:"#4b5563",textAlign:"left",lineHeight:"1.4"},mode:"web"}),e.jsx(n,{values:{text:"H5 - Small Section",headingType:"h5",fontSize:"18px",fontWeight:"600",color:"#6b7280",textAlign:"left",lineHeight:"1.4"},mode:"web"}),e.jsx(n,{values:{text:"H6 - Minor Heading",headingType:"h6",fontSize:"16px",fontWeight:"600",color:"#9ca3af",textAlign:"left",lineHeight:"1.5"},mode:"web"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{style:{margin:"0 0 20px",color:"#1f2937",fontSize:"24px",fontWeight:"700"},children:"🎨 Styled Headings"}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"20px"},children:[e.jsx(n,{values:{text:"PREMIUM FEATURES",headingType:"h2",fontSize:"24px",fontWeight:"700",color:"#7c3aed",textAlign:"center",textTransform:"uppercase",letterSpacing:"0.1em"},mode:"web"}),e.jsx(n,{values:{text:"Gradient Magic Heading",headingType:"h2",fontSize:"32px",fontWeight:"800",color:"#667eea",textAlign:"center",lineHeight:"1.2"},mode:"web"}),e.jsx(n,{values:{text:"Professional Business Title",headingType:"h3",fontSize:"26px",fontWeight:"600",color:"#1f2937",textAlign:"left",letterSpacing:"0.025em",fontFamily:{label:"Source Sans Pro",value:"Source Sans Pro, Arial, sans-serif"}},mode:"web"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{style:{margin:"0 0 20px",color:"#1f2937",fontSize:"24px",fontWeight:"700"},children:"🌈 Color Variations"}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:"16px"},children:[e.jsx(n,{values:{text:"Primary Blue",headingType:"h3",fontSize:"24px",fontWeight:"600",color:"#2563eb",textAlign:"center"},mode:"web"}),e.jsx(n,{values:{text:"Success Green",headingType:"h3",fontSize:"24px",fontWeight:"600",color:"#059669",textAlign:"center"},mode:"web"}),e.jsx(n,{values:{text:"Warning Orange",headingType:"h3",fontSize:"24px",fontWeight:"600",color:"#d97706",textAlign:"center"},mode:"web"}),e.jsx(n,{values:{text:"Danger Red",headingType:"h3",fontSize:"24px",fontWeight:"600",color:"#dc2626",textAlign:"center"},mode:"web"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{style:{margin:"0 0 20px",color:"#1f2937",fontSize:"24px",fontWeight:"700"},children:"📧 Email-Safe Headings"}),e.jsx("div",{style:{backgroundColor:"#f9fafb",padding:"24px",borderRadius:"8px"},children:e.jsx(n,{values:{text:"Email Newsletter Title",headingType:"h1",fontSize:"28px",fontWeight:"bold",color:"#333333",textAlign:"center",lineHeight:"1.2",fontFamily:{label:"Arial",value:"Arial, Helvetica, sans-serif"}},mode:"email"})})]})]})};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <Heading level="h1">
      Welcome to Our Platform
    </Heading>,
  parameters: {
    docs: {
      description: {
        story: \`
**✨ Simplest Usage - Text as Children**

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
}`,...t.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <Heading level="h2" color="#2563eb" fontSize="32px" fontWeight="700" textAlign="center" lineHeight="1.2" letterSpacing="-0.025em">
      Features & Benefits
    </Heading>,
  parameters: {
    docs: {
      description: {
        story: \`
**🎨 Semantic Props + Children**

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
}`,...i.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
**📰 Complete Heading Hierarchy**

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
}`,...o.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "Default Heading Text",
      headingType: "h2"
    },
    mode: "web"
  },
  parameters: {
    docs: {
      description: {
        story: "**Default Heading (Values API)** - Uses the values object for full control. This approach gives you access to all Unlayer configuration options."
      }
    }
  }
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "Welcome to Our Platform",
      headingType: "h1",
      fontSize: "36px",
      fontWeight: "800",
      color: "#111827",
      textAlign: "center",
      lineHeight: "1.1",
      letterSpacing: "-0.025em"
    },
    mode: "web"
  }
}`,...r.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "Features & Benefits",
      headingType: "h2",
      fontSize: "28px",
      fontWeight: "700",
      color: "#1f2937",
      textAlign: "left",
      lineHeight: "1.2",
      containerPadding: "0 0 16px 0"
    },
    mode: "web"
  }
}`,...l.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "Getting Started Guide",
      headingType: "h3",
      fontSize: "24px",
      fontWeight: "600",
      color: "#374151",
      textAlign: "left",
      lineHeight: "1.3"
    },
    mode: "web"
  }
}`,...s.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "Advanced Configuration",
      headingType: "h4",
      fontSize: "20px",
      fontWeight: "600",
      color: "#4b5563",
      textAlign: "left",
      lineHeight: "1.4"
    },
    mode: "web"
  }
}`,...g.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "Premium Features",
      headingType: "h2",
      fontSize: "32px",
      fontWeight: "700",
      color: "#7c3aed",
      textAlign: "center",
      lineHeight: "1.2",
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    },
    mode: "web"
  }
}`,...d.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "🌟 The Future is Here",
      headingType: "h1",
      fontSize: "40px",
      fontWeight: "800",
      color: "#8b5cf6",
      textAlign: "center",
      lineHeight: "1.1",
      letterSpacing: "-0.02em"
    },
    mode: "web"
  },
  parameters: {
    docs: {
      description: {
        story: "**Gradient-Inspired Heading** - Uses a vibrant purple color that evokes gradient aesthetics while being compatible with Unlayer's renderer system."
      }
    }
  }
}`,...c.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "Monthly Newsletter",
      headingType: "h1",
      fontSize: "28px",
      fontWeight: "bold",
      color: "#333333",
      textAlign: "center",
      lineHeight: "1.2",
      fontFamily: {
        label: "Arial",
        value: "Arial, Helvetica, sans-serif"
      }
    },
    mode: "email"
  }
}`,...p.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "Read Our Blog",
      headingType: "h2",
      fontSize: "26px",
      fontWeight: "600",
      color: "#2563eb",
      textAlign: "left",
      lineHeight: "1.3",
      linkStyle: {
        inherit: false,
        linkColor: "#2563eb",
        linkHoverColor: "#1d4ed8",
        linkUnderline: false,
        linkHoverUnderline: true
      }
    },
    mode: "web"
  }
}`,...h.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "Enterprise Solutions",
      headingType: "h2",
      fontSize: "30px",
      fontWeight: "600",
      color: "#1f2937",
      textAlign: "center",
      lineHeight: "1.2",
      fontFamily: {
        label: "Source Sans Pro",
        value: "Source Sans Pro, Arial, sans-serif"
      },
      letterSpacing: "0.025em"
    },
    mode: "web"
  }
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
          📰 Heading Hierarchy
        </h3>
        <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
          <Heading values={{
          text: "H1 - Main Page Title",
          headingType: "h1",
          fontSize: "36px",
          fontWeight: "800",
          color: "#111827",
          textAlign: "left",
          lineHeight: "1.1"
        }} mode="web" />
          <Heading values={{
          text: "H2 - Section Heading",
          headingType: "h2",
          fontSize: "28px",
          fontWeight: "700",
          color: "#1f2937",
          textAlign: "left",
          lineHeight: "1.2"
        }} mode="web" />
          <Heading values={{
          text: "H3 - Subsection Title",
          headingType: "h3",
          fontSize: "24px",
          fontWeight: "600",
          color: "#374151",
          textAlign: "left",
          lineHeight: "1.3"
        }} mode="web" />
          <Heading values={{
          text: "H4 - Component Title",
          headingType: "h4",
          fontSize: "20px",
          fontWeight: "600",
          color: "#4b5563",
          textAlign: "left",
          lineHeight: "1.4"
        }} mode="web" />
          <Heading values={{
          text: "H5 - Small Section",
          headingType: "h5",
          fontSize: "18px",
          fontWeight: "600",
          color: "#6b7280",
          textAlign: "left",
          lineHeight: "1.4"
        }} mode="web" />
          <Heading values={{
          text: "H6 - Minor Heading",
          headingType: "h6",
          fontSize: "16px",
          fontWeight: "600",
          color: "#9ca3af",
          textAlign: "left",
          lineHeight: "1.5"
        }} mode="web" />
        </div>
      </div>

      <div>
        <h3 style={{
        margin: "0 0 20px",
        color: "#1f2937",
        fontSize: "24px",
        fontWeight: "700"
      }}>
          🎨 Styled Headings
        </h3>
        <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>
          <Heading values={{
          text: "PREMIUM FEATURES",
          headingType: "h2",
          fontSize: "24px",
          fontWeight: "700",
          color: "#7c3aed",
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "0.1em"
        }} mode="web" />
          <Heading values={{
          text: "Gradient Magic Heading",
          headingType: "h2",
          fontSize: "32px",
          fontWeight: "800",
          color: "#667eea",
          textAlign: "center",
          lineHeight: "1.2"
        }} mode="web" />
          <Heading values={{
          text: "Professional Business Title",
          headingType: "h3",
          fontSize: "26px",
          fontWeight: "600",
          color: "#1f2937",
          textAlign: "left",
          letterSpacing: "0.025em",
          fontFamily: {
            label: "Source Sans Pro",
            value: "Source Sans Pro, Arial, sans-serif"
          }
        }} mode="web" />
        </div>
      </div>

      <div>
        <h3 style={{
        margin: "0 0 20px",
        color: "#1f2937",
        fontSize: "24px",
        fontWeight: "700"
      }}>
          🌈 Color Variations
        </h3>
        <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "16px"
      }}>
          <Heading values={{
          text: "Primary Blue",
          headingType: "h3",
          fontSize: "24px",
          fontWeight: "600",
          color: "#2563eb",
          textAlign: "center"
        }} mode="web" />
          <Heading values={{
          text: "Success Green",
          headingType: "h3",
          fontSize: "24px",
          fontWeight: "600",
          color: "#059669",
          textAlign: "center"
        }} mode="web" />
          <Heading values={{
          text: "Warning Orange",
          headingType: "h3",
          fontSize: "24px",
          fontWeight: "600",
          color: "#d97706",
          textAlign: "center"
        }} mode="web" />
          <Heading values={{
          text: "Danger Red",
          headingType: "h3",
          fontSize: "24px",
          fontWeight: "600",
          color: "#dc2626",
          textAlign: "center"
        }} mode="web" />
        </div>
      </div>

      <div>
        <h3 style={{
        margin: "0 0 20px",
        color: "#1f2937",
        fontSize: "24px",
        fontWeight: "700"
      }}>
          📧 Email-Safe Headings
        </h3>
        <div style={{
        backgroundColor: "#f9fafb",
        padding: "24px",
        borderRadius: "8px"
      }}>
          <Heading values={{
          text: "Email Newsletter Title",
          headingType: "h1",
          fontSize: "28px",
          fontWeight: "bold",
          color: "#333333",
          textAlign: "center",
          lineHeight: "1.2",
          fontFamily: {
            label: "Arial",
            value: "Arial, Helvetica, sans-serif"
          }
        }} mode="email" />
        </div>
      </div>
    </div>
}`,...m.parameters?.docs?.source}}};const b=["SimpleHeading","WithSemanticProps","MultipleHeadingLevels","Default","H1Heading","H2Heading","H3Heading","H4Heading","ColoredHeading","GradientHeading","EmailHeading","LinkedHeading","CorporateHeading","HeadingHierarchy"];export{d as ColoredHeading,f as CorporateHeading,a as Default,p as EmailHeading,c as GradientHeading,r as H1Heading,l as H2Heading,s as H3Heading,g as H4Heading,m as HeadingHierarchy,h as LinkedHeading,o as MultipleHeadingLevels,t as SimpleHeading,i as WithSemanticProps,b as __namedExportsOrder,v as default};
