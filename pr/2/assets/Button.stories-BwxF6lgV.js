import{j as o}from"./jsx-runtime-CQbKZvFY.js";import{B as e}from"./Button-CDLpUbY8.js";import"./iframe-OeZ8g3bd.js";import"./preload-helper-PPVm8Dsz.js";import"./create-component-BfIsZgQA.js";const b={title:"Components/Button",component:e,parameters:{layout:"centered",docs:{description:{component:`
Interactive button with **schema-driven defaults** and **CDN-loaded rendering**.

## Key Features
- 🚀 **Multiple Modes**: Web, Email, Document, AMP Web, Classic
- 🎨 **Rich Styling**: Colors, gradients, borders, shadows, fonts
- 📱 **Responsive**: Auto-width, mobile-optimized sizes  
- 🔗 **Smart Links**: Web URLs, email addresses, phone numbers
- ⚡ **Performance**: CDN-loaded with fallback rendering
- 🛡️ **Type-Safe**: Full TypeScript support with schema validation

## Common Use Cases
- Call-to-action buttons in emails and web pages
- Navigation links with custom styling
- Form submission buttons
- Social media and sharing buttons
- E-commerce "Add to Cart" / "Buy Now" buttons

## Usage

\`\`\`tsx
<Button backgroundColor="#3b82f6" color="white" padding="12px 24px">
  Click me
</Button>
\`\`\`

Pass your button text as children and use semantic props for styling!
        `}}},argTypes:{children:{description:"**Button Text** - The text to display on the button",control:"text",table:{type:{summary:"string | ReactNode"}}},backgroundColor:{description:"**Background Color** - Button background color",control:"color"},color:{description:"**Text Color** - Button text color",control:"color"},hoverBackgroundColor:{description:"**Hover Background** - Background color on hover",control:"color"},hoverColor:{description:"**Hover Text Color** - Text color on hover",control:"color"},padding:{description:"**Padding** - Internal spacing (e.g., '12px 24px')",control:"text"},borderRadius:{description:"**Border Radius** - Corner rounding (e.g., '8px')",control:"text"},fontSize:{description:"**Font Size** - Text size (e.g., '16px')",control:"text"},fontWeight:{description:"**Font Weight** - Text weight (e.g., '600')",control:"text"},href:{description:"**Link** - URL or link configuration",control:"text"},mode:{control:{type:"select"},options:["web","email","document"],description:"**Rendering Mode** - Controls output format and optimizations",table:{defaultValue:{summary:"web"},type:{summary:"RenderMode"}}}},tags:["autodocs"]},n={render:()=>o.jsx(e,{children:"Click Me"}),parameters:{docs:{description:{story:`
**✨ Simplest Usage - Text as Children**

Just pass your button text as children - super clean and React-friendly:

\`\`\`tsx
<Button>Click Me</Button>
\`\`\`

Perfect for:
- Quick prototyping
- Simple buttons with default styling
- When you just need a basic button
        `}}}},r={render:()=>o.jsx(e,{backgroundColor:"#3b82f6",color:"white",padding:"14px 28px",borderRadius:"8px",fontSize:"16px",fontWeight:"600",children:"Get Started"}),parameters:{docs:{description:{story:'\n**🎨 Semantic Props + Children (Recommended!)**\n\nCombine semantic styling props with children text for a clean, readable API:\n\n```tsx\n<Button\n  backgroundColor="#3b82f6"\n  color="white"\n  padding="14px 28px"\n  borderRadius="8px"\n  fontSize="16px"\n  fontWeight="600"\n>\n  Get Started\n</Button>\n```\n\n**✨ Automatic prop grouping:** Props are automatically grouped into nested structures (e.g., `backgroundColor` and `color` → `buttonColors`).\n\nAvailable semantic props:\n- `backgroundColor`, `color`, `hoverBackgroundColor`, `hoverColor`: Button colors\n- `padding`: Internal spacing (e.g., "12px 24px")\n- `borderRadius`: Corner rounding (e.g., "8px")\n- `fontSize`, `fontWeight`, `textAlign`: Typography\n- `href`: Link URL (string or link config)\n- `borderWidth`, `borderStyle`, `borderColor`: Border styling\n- `width`, `height`, `autoWidth`: Size configuration\n\n**💡 TypeScript autocomplete:** Full IntelliSense support for all properties!\n        '}}}},t={render:()=>o.jsx(e,{backgroundColor:"#10b981",color:"white",hoverBackgroundColor:"#059669",padding:"16px 32px",borderRadius:"12px",fontSize:"18px",fontWeight:"600",href:"https://unlayer.com",children:"Visit Our Website →"}),parameters:{docs:{description:{story:`
**🔗 With Link and Hover Effects**

Add navigation and hover states with semantic props:

\`\`\`tsx
<Button
  href="https://unlayer.com"
  backgroundColor="#10b981"
  color="white"
  hoverBackgroundColor="#059669"
  padding="16px 32px"
  borderRadius="12px"
>
  Visit Our Website →
</Button>
\`\`\`

The \`href\` prop accepts:
- **String**: \`"https://example.com"\` (auto-converted to link config)
- **Link config object**: \`{ name: "web", values: { href: "...", target: "_blank" } }\`

**✨ Automatic mapping:** \`backgroundColor\`, \`color\`, \`hoverBackgroundColor\`, and \`hoverColor\` are automatically grouped into the \`buttonColors\` object!
        `}}}},i={render:()=>o.jsx(e,{backgroundColor:"#10b981",color:"white",hoverBackgroundColor:"#059669",padding:"16px 32px",borderRadius:"12px",fontSize:"18px",fontWeight:"600",width:"100%",autoWidth:!1,children:"Tap to Continue"}),parameters:{docs:{description:{story:`
**📱 Mobile-Optimized Button**

Full-width button optimized for mobile devices:

\`\`\`tsx
<Button
  backgroundColor="#10b981"
  padding="16px 32px"
  width="100%"
  autoWidth={false}
>
  Tap to Continue
</Button>
\`\`\`
        `}}}},a={render:()=>o.jsx(e,{backgroundColor:"#7c3aed",color:"white",hoverBackgroundColor:"#6d28d9",padding:"14px 24px",borderRadius:"6px",fontSize:"16px",fontWeight:"500",mode:"email",children:"View in Browser"}),parameters:{docs:{description:{story:`
**📧 Email-Safe Button**

Optimized for email clients with \`mode="email"\`:

\`\`\`tsx
<Button
  backgroundColor="#7c3aed"
  color="white"
  padding="14px 24px"
  borderRadius="6px"
  mode="email"
>
  View in Browser
</Button>
\`\`\`

Uses conservative styling that renders consistently across all email platforms.
        `}}}},d={render:()=>o.jsx(e,{backgroundColor:"#2563eb",color:"white",padding:"14px 28px",borderRadius:"8px",fontSize:"16px",fontWeight:"600",href:"https://example.com",children:"Open Website"}),parameters:{docs:{description:{story:`
**🔗 String URL (Auto-Converted)**

Pass a plain URL string — it's automatically wrapped into a link config with \`target="_blank"\`:

\`\`\`tsx
<Button href="https://example.com">Open Website</Button>
\`\`\`

Internally becomes: \`{ name: "web", values: { href: "https://example.com", target: "_blank" } }\`
        `}}}},s={render:()=>o.jsx(e,{backgroundColor:"#059669",color:"white",padding:"14px 28px",borderRadius:"8px",fontSize:"16px",fontWeight:"600",href:{name:"web",values:{href:"https://example.com",target:"_self"}},children:"Open in Same Tab"}),parameters:{docs:{description:{story:`
**🔧 Full Config Object**

Use the config object form for full control over target, link type, etc.:

\`\`\`tsx
<Button href={{ name: "web", values: { href: "https://example.com", target: "_self" } }}>
  Open in Same Tab
</Button>
\`\`\`
        `}}}},l={render:()=>o.jsx(e,{backgroundColor:"#7c3aed",color:"white",padding:"14px 28px",borderRadius:"8px",fontSize:"16px",fontWeight:"600",href:{name:"email",values:{href:"mailto:hello@example.com"}},children:"Send Email"}),parameters:{docs:{description:{story:`
**📧 Email Link**

\`\`\`tsx
<Button href={{ name: "email", values: { href: "mailto:hello@example.com" } }}>
  Send Email
</Button>
\`\`\`
        `}}}},p={render:()=>o.jsx(e,{backgroundColor:"#dc2626",color:"white",padding:"14px 28px",borderRadius:"8px",fontSize:"16px",fontWeight:"600",href:{name:"phone",values:{href:"tel:+1234567890"}},children:"Call Us"}),parameters:{docs:{description:{story:`
**📞 Phone Link**

\`\`\`tsx
<Button href={{ name: "phone", values: { href: "tel:+1234567890" } }}>
  Call Us
</Button>
\`\`\`
        `}}}},c={render:()=>o.jsx(e,{backgroundColor:"#6366f1",color:"white",padding:"14px 28px",borderRadius:"8px",fontSize:"16px",fontWeight:"600",href:"https://example.com/dashboard",mode:"email",children:"Go to Dashboard"}),parameters:{docs:{description:{story:`
**📧 Link in Email Mode**

Verify that \`href\` renders correctly in email-safe HTML output:

\`\`\`tsx
<Button href="https://example.com/dashboard" mode="email">
  Go to Dashboard
</Button>
\`\`\`
        `}}}},u={parameters:{docs:{description:{story:"**Complete Button Gallery** - Showcase of various button styles and use cases using semantic props. All examples use the clean, React-friendly API."}}},render:()=>o.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"32px",padding:"20px",background:"#f8fafc"},children:[o.jsxs("div",{children:[o.jsx("h3",{style:{margin:"0 0 16px",color:"#1f2937",fontSize:"20px",fontWeight:"700"},children:"🎯 Call-to-Action Buttons"}),o.jsxs("div",{style:{display:"flex",gap:"16px",flexWrap:"wrap"},children:[o.jsx(e,{backgroundColor:"#2563eb",color:"white",hoverBackgroundColor:"#1d4ed8",padding:"14px 28px",borderRadius:"8px",fontSize:"16px",fontWeight:"600",children:"Get Started Free"}),o.jsx(e,{backgroundColor:"#059669",color:"white",hoverBackgroundColor:"#047857",padding:"14px 28px",borderRadius:"8px",fontSize:"16px",fontWeight:"600",children:"Start Free Trial"}),o.jsx(e,{backgroundColor:"#7c3aed",color:"white",hoverBackgroundColor:"#6d28d9",padding:"14px 28px",borderRadius:"8px",fontSize:"16px",fontWeight:"600",children:"Join Premium"})]})]}),o.jsxs("div",{children:[o.jsx("h3",{style:{margin:"0 0 16px",color:"#1f2937",fontSize:"20px",fontWeight:"700"},children:"🌟 Secondary Actions"}),o.jsxs("div",{style:{display:"flex",gap:"16px",flexWrap:"wrap"},children:[o.jsx(e,{backgroundColor:"transparent",color:"#2563eb",hoverBackgroundColor:"#2563eb",hoverColor:"white",borderWidth:"2px",borderStyle:"solid",borderColor:"#2563eb",padding:"12px 24px",borderRadius:"8px",fontSize:"16px",children:"Learn More"}),o.jsx(e,{backgroundColor:"#f9fafb",color:"#6b7280",hoverBackgroundColor:"#f3f4f6",hoverColor:"#374151",borderWidth:"1px",borderStyle:"solid",borderColor:"#d1d5db",padding:"12px 24px",borderRadius:"8px",fontSize:"16px",children:"Watch Demo"})]})]}),o.jsxs("div",{children:[o.jsx("h3",{style:{margin:"0 0 16px",color:"#1f2937",fontSize:"20px",fontWeight:"700"},children:"🎨 Creative Styles"}),o.jsxs("div",{style:{display:"flex",gap:"16px",flexWrap:"wrap",alignItems:"center"},children:[o.jsx(e,{backgroundColor:"#8b5cf6",color:"white",hoverBackgroundColor:"#7c3aed",padding:"16px 32px",borderRadius:"16px",fontSize:"16px",fontWeight:"700",children:"Gradient Magic"}),o.jsx(e,{backgroundColor:"#f59e0b",color:"white",hoverBackgroundColor:"#d97706",padding:"12px 28px",borderRadius:"50px",fontSize:"16px",fontWeight:"600",children:"Rounded Pill"}),o.jsx(e,{backgroundColor:"#ef4444",color:"white",hoverBackgroundColor:"#dc2626",padding:"12px 24px",borderRadius:"0px",fontSize:"16px",fontWeight:"600",children:"Sharp Edge"})]})]}),o.jsxs("div",{children:[o.jsx("h3",{style:{margin:"0 0 16px",color:"#1f2937",fontSize:"20px",fontWeight:"700"},children:"📧 Email-Safe Buttons"}),o.jsxs("div",{style:{display:"flex",gap:"16px",flexWrap:"wrap"},children:[o.jsx(e,{backgroundColor:"#3b82f6",color:"white",padding:"14px 24px",borderRadius:"6px",fontSize:"16px",mode:"email",children:"View Email"}),o.jsx(e,{backgroundColor:"white",color:"#6b7280",hoverBackgroundColor:"#f9fafb",borderWidth:"1px",borderStyle:"solid",borderColor:"#d1d5db",padding:"10px 20px",borderRadius:"4px",fontSize:"14px",mode:"email",children:"Unsubscribe"})]})]})]})};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <Button>Click Me</Button>,
  parameters: {
    docs: {
      description: {
        story: \`
**✨ Simplest Usage - Text as Children**

Just pass your button text as children - super clean and React-friendly:

\\\`\\\`\\\`tsx
<Button>Click Me</Button>
\\\`\\\`\\\`

Perfect for:
- Quick prototyping
- Simple buttons with default styling
- When you just need a basic button
        \`
      }
    }
  }
}`,...n.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:'{\n  render: () => <Button backgroundColor="#3b82f6" color="white" padding="14px 28px" borderRadius="8px" fontSize="16px" fontWeight="600">\n      Get Started\n    </Button>,\n  parameters: {\n    docs: {\n      description: {\n        story: `\n**🎨 Semantic Props + Children (Recommended!)**\n\nCombine semantic styling props with children text for a clean, readable API:\n\n\\`\\`\\`tsx\n<Button\n  backgroundColor="#3b82f6"\n  color="white"\n  padding="14px 28px"\n  borderRadius="8px"\n  fontSize="16px"\n  fontWeight="600"\n>\n  Get Started\n</Button>\n\\`\\`\\`\n\n**✨ Automatic prop grouping:** Props are automatically grouped into nested structures (e.g., \\`backgroundColor\\` and \\`color\\` → \\`buttonColors\\`).\n\nAvailable semantic props:\n- \\`backgroundColor\\`, \\`color\\`, \\`hoverBackgroundColor\\`, \\`hoverColor\\`: Button colors\n- \\`padding\\`: Internal spacing (e.g., "12px 24px")\n- \\`borderRadius\\`: Corner rounding (e.g., "8px")\n- \\`fontSize\\`, \\`fontWeight\\`, \\`textAlign\\`: Typography\n- \\`href\\`: Link URL (string or link config)\n- \\`borderWidth\\`, \\`borderStyle\\`, \\`borderColor\\`: Border styling\n- \\`width\\`, \\`height\\`, \\`autoWidth\\`: Size configuration\n\n**💡 TypeScript autocomplete:** Full IntelliSense support for all properties!\n        `\n      }\n    }\n  }\n}',...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <Button backgroundColor="#10b981" color="white" hoverBackgroundColor="#059669" padding="16px 32px" borderRadius="12px" fontSize="18px" fontWeight="600" href="https://unlayer.com">
      Visit Our Website →
    </Button>,
  parameters: {
    docs: {
      description: {
        story: \`
**🔗 With Link and Hover Effects**

Add navigation and hover states with semantic props:

\\\`\\\`\\\`tsx
<Button
  href="https://unlayer.com"
  backgroundColor="#10b981"
  color="white"
  hoverBackgroundColor="#059669"
  padding="16px 32px"
  borderRadius="12px"
>
  Visit Our Website →
</Button>
\\\`\\\`\\\`

The \\\`href\\\` prop accepts:
- **String**: \\\`"https://example.com"\\\` (auto-converted to link config)
- **Link config object**: \\\`{ name: "web", values: { href: "...", target: "_blank" } }\\\`

**✨ Automatic mapping:** \\\`backgroundColor\\\`, \\\`color\\\`, \\\`hoverBackgroundColor\\\`, and \\\`hoverColor\\\` are automatically grouped into the \\\`buttonColors\\\` object!
        \`
      }
    }
  }
}`,...t.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <Button backgroundColor="#10b981" color="white" hoverBackgroundColor="#059669" padding="16px 32px" borderRadius="12px" fontSize="18px" fontWeight="600" width="100%" autoWidth={false}>
      Tap to Continue
    </Button>,
  parameters: {
    docs: {
      description: {
        story: \`
**📱 Mobile-Optimized Button**

Full-width button optimized for mobile devices:

\\\`\\\`\\\`tsx
<Button
  backgroundColor="#10b981"
  padding="16px 32px"
  width="100%"
  autoWidth={false}
>
  Tap to Continue
</Button>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...i.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => <Button backgroundColor="#7c3aed" color="white" hoverBackgroundColor="#6d28d9" padding="14px 24px" borderRadius="6px" fontSize="16px" fontWeight="500" mode="email">
      View in Browser
    </Button>,
  parameters: {
    docs: {
      description: {
        story: \`
**📧 Email-Safe Button**

Optimized for email clients with \\\`mode="email"\\\`:

\\\`\\\`\\\`tsx
<Button
  backgroundColor="#7c3aed"
  color="white"
  padding="14px 24px"
  borderRadius="6px"
  mode="email"
>
  View in Browser
</Button>
\\\`\\\`\\\`

Uses conservative styling that renders consistently across all email platforms.
        \`
      }
    }
  }
}`,...a.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <Button backgroundColor="#2563eb" color="white" padding="14px 28px" borderRadius="8px" fontSize="16px" fontWeight="600" href="https://example.com">
      Open Website
    </Button>,
  parameters: {
    docs: {
      description: {
        story: \`
**🔗 String URL (Auto-Converted)**

Pass a plain URL string — it's automatically wrapped into a link config with \\\`target="_blank"\\\`:

\\\`\\\`\\\`tsx
<Button href="https://example.com">Open Website</Button>
\\\`\\\`\\\`

Internally becomes: \\\`{ name: "web", values: { href: "https://example.com", target: "_blank" } }\\\`
        \`
      }
    }
  }
}`,...d.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <Button backgroundColor="#059669" color="white" padding="14px 28px" borderRadius="8px" fontSize="16px" fontWeight="600" href={{
    name: "web",
    values: {
      href: "https://example.com",
      target: "_self"
    }
  }}>
      Open in Same Tab
    </Button>,
  parameters: {
    docs: {
      description: {
        story: \`
**🔧 Full Config Object**

Use the config object form for full control over target, link type, etc.:

\\\`\\\`\\\`tsx
<Button href={{ name: "web", values: { href: "https://example.com", target: "_self" } }}>
  Open in Same Tab
</Button>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...s.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <Button backgroundColor="#7c3aed" color="white" padding="14px 28px" borderRadius="8px" fontSize="16px" fontWeight="600" href={{
    name: "email",
    values: {
      href: "mailto:hello@example.com"
    }
  }}>
      Send Email
    </Button>,
  parameters: {
    docs: {
      description: {
        story: \`
**📧 Email Link**

\\\`\\\`\\\`tsx
<Button href={{ name: "email", values: { href: "mailto:hello@example.com" } }}>
  Send Email
</Button>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...l.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <Button backgroundColor="#dc2626" color="white" padding="14px 28px" borderRadius="8px" fontSize="16px" fontWeight="600" href={{
    name: "phone",
    values: {
      href: "tel:+1234567890"
    }
  }}>
      Call Us
    </Button>,
  parameters: {
    docs: {
      description: {
        story: \`
**📞 Phone Link**

\\\`\\\`\\\`tsx
<Button href={{ name: "phone", values: { href: "tel:+1234567890" } }}>
  Call Us
</Button>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...p.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <Button backgroundColor="#6366f1" color="white" padding="14px 28px" borderRadius="8px" fontSize="16px" fontWeight="600" href="https://example.com/dashboard" mode="email">
      Go to Dashboard
    </Button>,
  parameters: {
    docs: {
      description: {
        story: \`
**📧 Link in Email Mode**

Verify that \\\`href\\\` renders correctly in email-safe HTML output:

\\\`\\\`\\\`tsx
<Button href="https://example.com/dashboard" mode="email">
  Go to Dashboard
</Button>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...c.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: "**Complete Button Gallery** - Showcase of various button styles and use cases using semantic props. All examples use the clean, React-friendly API."
      }
    }
  },
  render: () => <div style={{
    display: "flex",
    flexDirection: "column",
    gap: "32px",
    padding: "20px",
    background: "#f8fafc"
  }}>
      <div>
        <h3 style={{
        margin: "0 0 16px",
        color: "#1f2937",
        fontSize: "20px",
        fontWeight: "700"
      }}>
          🎯 Call-to-Action Buttons
        </h3>
        <div style={{
        display: "flex",
        gap: "16px",
        flexWrap: "wrap"
      }}>
          <Button backgroundColor="#2563eb" color="white" hoverBackgroundColor="#1d4ed8" padding="14px 28px" borderRadius="8px" fontSize="16px" fontWeight="600">
            Get Started Free
          </Button>
          <Button backgroundColor="#059669" color="white" hoverBackgroundColor="#047857" padding="14px 28px" borderRadius="8px" fontSize="16px" fontWeight="600">
            Start Free Trial
          </Button>
          <Button backgroundColor="#7c3aed" color="white" hoverBackgroundColor="#6d28d9" padding="14px 28px" borderRadius="8px" fontSize="16px" fontWeight="600">
            Join Premium
          </Button>
        </div>
      </div>

      <div>
        <h3 style={{
        margin: "0 0 16px",
        color: "#1f2937",
        fontSize: "20px",
        fontWeight: "700"
      }}>
          🌟 Secondary Actions
        </h3>
        <div style={{
        display: "flex",
        gap: "16px",
        flexWrap: "wrap"
      }}>
          <Button backgroundColor="transparent" color="#2563eb" hoverBackgroundColor="#2563eb" hoverColor="white" borderWidth="2px" borderStyle="solid" borderColor="#2563eb" padding="12px 24px" borderRadius="8px" fontSize="16px">
            Learn More
          </Button>
          <Button backgroundColor="#f9fafb" color="#6b7280" hoverBackgroundColor="#f3f4f6" hoverColor="#374151" borderWidth="1px" borderStyle="solid" borderColor="#d1d5db" padding="12px 24px" borderRadius="8px" fontSize="16px">
            Watch Demo
          </Button>
        </div>
      </div>

      <div>
        <h3 style={{
        margin: "0 0 16px",
        color: "#1f2937",
        fontSize: "20px",
        fontWeight: "700"
      }}>
          🎨 Creative Styles
        </h3>
        <div style={{
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
        alignItems: "center"
      }}>
          <Button backgroundColor="#8b5cf6" color="white" hoverBackgroundColor="#7c3aed" padding="16px 32px" borderRadius="16px" fontSize="16px" fontWeight="700">
            Gradient Magic
          </Button>
          <Button backgroundColor="#f59e0b" color="white" hoverBackgroundColor="#d97706" padding="12px 28px" borderRadius="50px" fontSize="16px" fontWeight="600">
            Rounded Pill
          </Button>
          <Button backgroundColor="#ef4444" color="white" hoverBackgroundColor="#dc2626" padding="12px 24px" borderRadius="0px" fontSize="16px" fontWeight="600">
            Sharp Edge
          </Button>
        </div>
      </div>

      <div>
        <h3 style={{
        margin: "0 0 16px",
        color: "#1f2937",
        fontSize: "20px",
        fontWeight: "700"
      }}>
          📧 Email-Safe Buttons
        </h3>
        <div style={{
        display: "flex",
        gap: "16px",
        flexWrap: "wrap"
      }}>
          <Button backgroundColor="#3b82f6" color="white" padding="14px 24px" borderRadius="6px" fontSize="16px" mode="email">
            View Email
          </Button>
          <Button backgroundColor="white" color="#6b7280" hoverBackgroundColor="#f9fafb" borderWidth="1px" borderStyle="solid" borderColor="#d1d5db" padding="10px 20px" borderRadius="4px" fontSize="14px" mode="email">
            Unsubscribe
          </Button>
        </div>
      </div>
    </div>
}`,...u.parameters?.docs?.source}}};const C=["SimpleButton","WithSemanticProps","WithLinkAndHover","MobileButton","EmailSafeButton","LinkStringUrl","LinkConfigObject","LinkEmail","LinkPhone","LinkEmailMode","ButtonShowcase"];export{u as ButtonShowcase,a as EmailSafeButton,s as LinkConfigObject,l as LinkEmail,c as LinkEmailMode,p as LinkPhone,d as LinkStringUrl,i as MobileButton,n as SimpleButton,t as WithLinkAndHover,r as WithSemanticProps,C as __namedExportsOrder,b as default};
