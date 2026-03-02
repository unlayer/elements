import{j as e}from"./jsx-runtime-CSQpYQ-p.js";import{T as t}from"./Text-qsx1h78Y.js";import"./iframe-BeiplXWw.js";import"./preload-helper-PPVm8Dsz.js";import"./create-component-wX7Ip7wH.js";const S={title:"Components/Text",component:t,parameters:{layout:"centered",docs:{description:{component:`
# 📝 Text Component

Versatile text rendering with **schema-driven typography defaults** and **CDN-loaded styling**.

## Key Features
- 🎨 **Rich Typography**: Font families, sizes, weights, colors, spacing
- 📱 **Responsive**: Mobile-optimized sizing and line heights
- 🔗 **Smart Links**: Automatic link styling and hover states
- 📧 **Email-Safe**: Conservative styling for email clients
- 🎯 **Flexible Alignment**: Left, center, right, justify options
- ⚡ **Performance**: CDN-loaded with fallback rendering

## Typography Options
- **Font Families**: System fonts, Google Fonts, custom fonts
- **Text Styling**: Bold, italic, underline, strikethrough
- **Spacing**: Line height, letter spacing, word spacing
- **Colors**: Text, background, border, shadow colors
- **Effects**: Text transform, decoration, shadows

## Common Use Cases
- Body text and paragraphs in emails and web pages
- Captions, labels, and metadata text
- Highlighted callouts and important notices
- Professional corporate communications
- Mobile-optimized content blocks

## 2 Ways to Use Text

### Option 1: Semantic Props (Recommended!)
\`\`\`tsx
<Text color="#374151" fontSize="16px" lineHeight="1.6">
  Your text here
</Text>
\`\`\`

### Option 2: Values Object (Full Control)
\`\`\`tsx
<Text values={{
  text: "Your text here",
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.6"
}} />
\`\`\`
        `}}},argTypes:{values:{description:'**Text Configuration Object**\n\nMain typography and styling options:\n- `text`: The content to display\n- `fontSize`: Text size (e.g. "16px", "1.2em")\n- `fontFamily`: Font selection with fallbacks\n- `fontWeight`: Text weight (e.g. "400", "600", "bold")\n- `color`: Text color (hex, rgb, named colors)\n- `textAlign`: Alignment ("left", "center", "right", "justify")\n- `lineHeight`: Line spacing (e.g. "1.6", "24px")\n- `letterSpacing`: Character spacing (e.g. "0.025em")\n- `backgroundColor`: Background color for highlighting\n- `padding`: Internal spacing around text\n- `linkStyle`: Link appearance and hover states\n\n*See individual stories below for complete examples*',control:!1,table:{type:{summary:"TextValues",detail:`{
  text?: string
  fontSize?: string
  fontFamily?: FontConfig
  fontWeight?: string
  color?: string
  backgroundColor?: string
  textAlign?: "left" | "center" | "right" | "justify"
  lineHeight?: string
  letterSpacing?: string
  padding?: string
  linkStyle?: LinkStyleConfig
  // ... and more typography options
}`}}},mode:{control:{type:"select"},options:["web","email","document"],description:"**Rendering Mode** - Controls output format and typography optimizations",table:{defaultValue:{summary:"web"},type:{summary:"RenderMode"}}}},tags:["autodocs"]},n={render:()=>e.jsx(t,{children:"This is the simplest way to use Text - just pass text as children!"}),parameters:{docs:{description:{story:`
**✨ Simplest Usage - Text as Children**

Just pass your text as children - super clean and React-friendly:

\`\`\`tsx
<Text>
  This is the simplest way to use Text!
</Text>
\`\`\`

Perfect for:
- Quick prototyping
- Simple text that doesn't need special styling
- When you want default styling
        `}}}},i={render:()=>e.jsx(t,{color:"#374151",fontSize:"16px",lineHeight:"1.6",fontWeight:"500",textAlign:"center",containerPadding:"20px",children:"This text uses semantic props for styling! It's centered with custom colors, sizing, and spacing."}),parameters:{docs:{description:{story:`
**🎨 Semantic Props + Children**

Combine semantic styling props with children text for a clean, readable API:

\`\`\`tsx
<Text
  color="#374151"
  fontSize="16px"
  lineHeight="1.6"
  fontWeight="500"
  textAlign="center"
  containerPadding="20px"
>
  Your styled text here
</Text>
\`\`\`

Available semantic props:
- \`color\`: Text color (any CSS color)
- \`fontSize\`: Text size (e.g., "16px", "1.2rem")
- \`fontWeight\`: Text weight (e.g., "400", "600", "bold")
- \`fontFamily\`: Font family object
- \`textAlign\`: "left" | "center" | "right" | "justify"
- \`lineHeight\`: Line spacing (e.g., "1.6", "24px")
- \`letterSpacing\`: Letter spacing (e.g., "0.025em")
- \`containerPadding\`: Padding around text
        `}}}},o={args:{values:{text:"This is default text using schema-driven defaults"},mode:"web"},parameters:{docs:{description:{story:"**Default Text (Values API)** - Uses the values object for full control. This approach gives you access to all Unlayer configuration options."}}}},a={args:{values:{text:"This is body text that demonstrates how the Text component renders standard content with beautiful typography. It's perfect for paragraphs, descriptions, and general content.",fontSize:"16px",lineHeight:"1.6",color:"#374151",fontFamily:{label:"Inter",value:"Inter, -apple-system, BlinkMacSystemFont, sans-serif"},textAlign:"left"},mode:"web"}},s={args:{values:{text:"Image caption or small descriptive text that provides additional context.",fontSize:"14px",lineHeight:"1.4",color:"#6b7280",fontFamily:{label:"Inter",value:"Inter, -apple-system, BlinkMacSystemFont, sans-serif"},textAlign:"center",fontStyle:"italic"},mode:"web"}},r={args:{values:{text:"This text stands out with beautiful highlighting and emphasis to draw attention to important information.",fontSize:"18px",lineHeight:"1.5",color:"#1f2937",backgroundColor:"#fef3c7",padding:"16px 20px",borderRadius:"8px",fontWeight:"500",textAlign:"center"},mode:"web"}},l={args:{values:{text:"Visit our website to learn more about our services and solutions.",fontSize:"16px",lineHeight:"1.6",color:"#374151",linkStyle:{inherit:!1,linkColor:"#2563eb",linkHoverColor:"#1d4ed8",linkUnderline:!0,linkHoverUnderline:!0},textAlign:"left"},mode:"web"}},c={args:{values:{text:"Our enterprise solution provides comprehensive tools for modern businesses to scale efficiently and securely.",fontSize:"16px",lineHeight:"1.7",color:"#1f2937",fontFamily:{label:"Source Sans Pro",value:"Source Sans Pro, Arial, sans-serif"},textAlign:"justify",letterSpacing:"0.025em"},mode:"web"}},d={args:{values:{text:"Mobile-optimized text that's easy to read on smaller screens with appropriate sizing and spacing.",fontSize:"18px",lineHeight:"1.6",color:"#111827",fontFamily:{label:"System UI",value:"-apple-system, BlinkMacSystemFont, sans-serif"},textAlign:"left",padding:"12px 0"},mode:"web"}},p={args:{values:{text:"This email-safe text uses web-safe fonts and styling that renders consistently across all email clients.",fontSize:"16px",lineHeight:"1.5",color:"#333333",fontFamily:{label:"Arial",value:"Arial, Helvetica, sans-serif"},textAlign:"left"},mode:"email"}},x={args:{values:{text:"Colorful text that demonstrates the vibrant possibilities with custom color schemes.",fontSize:"20px",lineHeight:"1.4",color:"#7c3aed",fontWeight:"600",textAlign:"center",textTransform:"uppercase",letterSpacing:"0.05em"},mode:"web"}},g={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"32px",padding:"40px",background:"#ffffff",maxWidth:"800px"},children:[e.jsxs("div",{children:[e.jsx("h3",{style:{margin:"0 0 20px",color:"#1f2937",fontSize:"24px",fontWeight:"700"},children:"📝 Content Typography"}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"24px"},children:[e.jsx(t,{values:{text:"Large heading text that captures attention and establishes hierarchy.",fontSize:"24px",lineHeight:"1.3",color:"#111827",fontWeight:"700",textAlign:"left"},mode:"web"}),e.jsx(t,{values:{text:"This is body text that provides detailed information with comfortable reading typography. It demonstrates how the Text component handles longer content with proper line height and spacing.",fontSize:"16px",lineHeight:"1.6",color:"#374151",textAlign:"left"},mode:"web"}),e.jsx(t,{values:{text:"Small caption text for additional details and metadata.",fontSize:"14px",lineHeight:"1.4",color:"#6b7280",textAlign:"left",fontStyle:"italic"},mode:"web"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{style:{margin:"0 0 20px",color:"#1f2937",fontSize:"24px",fontWeight:"700"},children:"🎨 Styled Text"}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"20px"},children:[e.jsx(t,{values:{text:"Highlighted important information with background color",fontSize:"16px",color:"#92400e",backgroundColor:"#fef3c7",padding:"12px 16px",borderRadius:"6px",textAlign:"center",fontWeight:"500"},mode:"web"}),e.jsx(t,{values:{text:"UPPERCASE ACCENT TEXT WITH LETTER SPACING",fontSize:"14px",color:"#7c3aed",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.1em",textAlign:"center"},mode:"web"}),e.jsx(t,{values:{text:"Professional text with custom font family and precise spacing",fontSize:"16px",color:"#1f2937",lineHeight:"1.7",fontFamily:{label:"Source Sans Pro",value:"Source Sans Pro, Arial, sans-serif"},letterSpacing:"0.025em",textAlign:"left"},mode:"web"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{style:{margin:"0 0 20px",color:"#1f2937",fontSize:"24px",fontWeight:"700"},children:"🌈 Color Variations"}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:"16px"},children:[e.jsx(t,{values:{text:"Primary Blue Text",fontSize:"16px",color:"#2563eb",fontWeight:"600",textAlign:"center"},mode:"web"}),e.jsx(t,{values:{text:"Success Green Text",fontSize:"16px",color:"#059669",fontWeight:"600",textAlign:"center"},mode:"web"}),e.jsx(t,{values:{text:"Warning Orange Text",fontSize:"16px",color:"#d97706",fontWeight:"600",textAlign:"center"},mode:"web"}),e.jsx(t,{values:{text:"Danger Red Text",fontSize:"16px",color:"#dc2626",fontWeight:"600",textAlign:"center"},mode:"web"})]})]}),e.jsxs("div",{children:[e.jsx("h3",{style:{margin:"0 0 20px",color:"#1f2937",fontSize:"24px",fontWeight:"700"},children:"📧 Email-Safe Typography"}),e.jsx("div",{style:{backgroundColor:"#f9fafb",padding:"24px",borderRadius:"8px"},children:e.jsx(t,{values:{text:"This text uses email-safe fonts and styling that renders consistently across Gmail, Outlook, Apple Mail, and other email clients.",fontSize:"16px",lineHeight:"1.5",color:"#333333",fontFamily:{label:"Arial",value:"Arial, Helvetica, sans-serif"},textAlign:"left"},mode:"email"})})]})]})};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <Text>
      This is the simplest way to use Text - just pass text as children!
    </Text>,
  parameters: {
    docs: {
      description: {
        story: \`
**✨ Simplest Usage - Text as Children**

Just pass your text as children - super clean and React-friendly:

\\\`\\\`\\\`tsx
<Text>
  This is the simplest way to use Text!
</Text>
\\\`\\\`\\\`

Perfect for:
- Quick prototyping
- Simple text that doesn't need special styling
- When you want default styling
        \`
      }
    }
  }
}`,...n.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <Text color="#374151" fontSize="16px" lineHeight="1.6" fontWeight="500" textAlign="center" containerPadding="20px">
      This text uses semantic props for styling! It's centered with custom colors, sizing, and spacing.
    </Text>,
  parameters: {
    docs: {
      description: {
        story: \`
**🎨 Semantic Props + Children**

Combine semantic styling props with children text for a clean, readable API:

\\\`\\\`\\\`tsx
<Text
  color="#374151"
  fontSize="16px"
  lineHeight="1.6"
  fontWeight="500"
  textAlign="center"
  containerPadding="20px"
>
  Your styled text here
</Text>
\\\`\\\`\\\`

Available semantic props:
- \\\`color\\\`: Text color (any CSS color)
- \\\`fontSize\\\`: Text size (e.g., "16px", "1.2rem")
- \\\`fontWeight\\\`: Text weight (e.g., "400", "600", "bold")
- \\\`fontFamily\\\`: Font family object
- \\\`textAlign\\\`: "left" | "center" | "right" | "justify"
- \\\`lineHeight\\\`: Line spacing (e.g., "1.6", "24px")
- \\\`letterSpacing\\\`: Letter spacing (e.g., "0.025em")
- \\\`containerPadding\\\`: Padding around text
        \`
      }
    }
  }
}`,...i.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "This is default text using schema-driven defaults"
    },
    mode: "web"
  },
  parameters: {
    docs: {
      description: {
        story: "**Default Text (Values API)** - Uses the values object for full control. This approach gives you access to all Unlayer configuration options."
      }
    }
  }
}`,...o.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "This is body text that demonstrates how the Text component renders standard content with beautiful typography. It's perfect for paragraphs, descriptions, and general content.",
      fontSize: "16px",
      lineHeight: "1.6",
      color: "#374151",
      fontFamily: {
        label: "Inter",
        value: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
      },
      textAlign: "left"
    },
    mode: "web"
  }
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "Image caption or small descriptive text that provides additional context.",
      fontSize: "14px",
      lineHeight: "1.4",
      color: "#6b7280",
      fontFamily: {
        label: "Inter",
        value: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
      },
      textAlign: "center",
      fontStyle: "italic"
    },
    mode: "web"
  }
}`,...s.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "This text stands out with beautiful highlighting and emphasis to draw attention to important information.",
      fontSize: "18px",
      lineHeight: "1.5",
      color: "#1f2937",
      backgroundColor: "#fef3c7",
      padding: "16px 20px",
      borderRadius: "8px",
      fontWeight: "500",
      textAlign: "center"
    },
    mode: "web"
  }
}`,...r.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "Visit our website to learn more about our services and solutions.",
      fontSize: "16px",
      lineHeight: "1.6",
      color: "#374151",
      linkStyle: {
        inherit: false,
        linkColor: "#2563eb",
        linkHoverColor: "#1d4ed8",
        linkUnderline: true,
        linkHoverUnderline: true
      },
      textAlign: "left"
    },
    mode: "web"
  }
}`,...l.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "Our enterprise solution provides comprehensive tools for modern businesses to scale efficiently and securely.",
      fontSize: "16px",
      lineHeight: "1.7",
      color: "#1f2937",
      fontFamily: {
        label: "Source Sans Pro",
        value: "Source Sans Pro, Arial, sans-serif"
      },
      textAlign: "justify",
      letterSpacing: "0.025em"
    },
    mode: "web"
  }
}`,...c.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "Mobile-optimized text that's easy to read on smaller screens with appropriate sizing and spacing.",
      fontSize: "18px",
      lineHeight: "1.6",
      color: "#111827",
      fontFamily: {
        label: "System UI",
        value: "-apple-system, BlinkMacSystemFont, sans-serif"
      },
      textAlign: "left",
      padding: "12px 0"
    },
    mode: "web"
  }
}`,...d.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "This email-safe text uses web-safe fonts and styling that renders consistently across all email clients.",
      fontSize: "16px",
      lineHeight: "1.5",
      color: "#333333",
      fontFamily: {
        label: "Arial",
        value: "Arial, Helvetica, sans-serif"
      },
      textAlign: "left"
    },
    mode: "email"
  }
}`,...p.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      text: "Colorful text that demonstrates the vibrant possibilities with custom color schemes.",
      fontSize: "20px",
      lineHeight: "1.4",
      color: "#7c3aed",
      fontWeight: "600",
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    },
    mode: "web"
  }
}`,...x.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    flexDirection: "column",
    gap: "32px",
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
          📝 Content Typography
        </h3>
        <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>
          <Text values={{
          text: "Large heading text that captures attention and establishes hierarchy.",
          fontSize: "24px",
          lineHeight: "1.3",
          color: "#111827",
          fontWeight: "700",
          textAlign: "left"
        }} mode="web" />
          <Text values={{
          text: "This is body text that provides detailed information with comfortable reading typography. It demonstrates how the Text component handles longer content with proper line height and spacing.",
          fontSize: "16px",
          lineHeight: "1.6",
          color: "#374151",
          textAlign: "left"
        }} mode="web" />
          <Text values={{
          text: "Small caption text for additional details and metadata.",
          fontSize: "14px",
          lineHeight: "1.4",
          color: "#6b7280",
          textAlign: "left",
          fontStyle: "italic"
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
          🎨 Styled Text
        </h3>
        <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>
          <Text values={{
          text: "Highlighted important information with background color",
          fontSize: "16px",
          color: "#92400e",
          backgroundColor: "#fef3c7",
          padding: "12px 16px",
          borderRadius: "6px",
          textAlign: "center",
          fontWeight: "500"
        }} mode="web" />
          <Text values={{
          text: "UPPERCASE ACCENT TEXT WITH LETTER SPACING",
          fontSize: "14px",
          color: "#7c3aed",
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          textAlign: "center"
        }} mode="web" />
          <Text values={{
          text: "Professional text with custom font family and precise spacing",
          fontSize: "16px",
          color: "#1f2937",
          lineHeight: "1.7",
          fontFamily: {
            label: "Source Sans Pro",
            value: "Source Sans Pro, Arial, sans-serif"
          },
          letterSpacing: "0.025em",
          textAlign: "left"
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
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px"
      }}>
          <Text values={{
          text: "Primary Blue Text",
          fontSize: "16px",
          color: "#2563eb",
          fontWeight: "600",
          textAlign: "center"
        }} mode="web" />
          <Text values={{
          text: "Success Green Text",
          fontSize: "16px",
          color: "#059669",
          fontWeight: "600",
          textAlign: "center"
        }} mode="web" />
          <Text values={{
          text: "Warning Orange Text",
          fontSize: "16px",
          color: "#d97706",
          fontWeight: "600",
          textAlign: "center"
        }} mode="web" />
          <Text values={{
          text: "Danger Red Text",
          fontSize: "16px",
          color: "#dc2626",
          fontWeight: "600",
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
          📧 Email-Safe Typography
        </h3>
        <div style={{
        backgroundColor: "#f9fafb",
        padding: "24px",
        borderRadius: "8px"
      }}>
          <Text values={{
          text: "This text uses email-safe fonts and styling that renders consistently across Gmail, Outlook, Apple Mail, and other email clients.",
          fontSize: "16px",
          lineHeight: "1.5",
          color: "#333333",
          fontFamily: {
            label: "Arial",
            value: "Arial, Helvetica, sans-serif"
          },
          textAlign: "left"
        }} mode="email" />
        </div>
      </div>
    </div>
}`,...g.parameters?.docs?.source}}};const b=["SimpleText","WithSemanticProps","Default","BodyText","CaptionText","HighlightedText","LinkedText","ProfessionalText","MobileText","EmailText","ColorfulText","TextShowcase"];export{a as BodyText,s as CaptionText,x as ColorfulText,o as Default,p as EmailText,r as HighlightedText,l as LinkedText,d as MobileText,c as ProfessionalText,n as SimpleText,g as TextShowcase,i as WithSemanticProps,b as __namedExportsOrder,S as default};
