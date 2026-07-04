import{j as e}from"./jsx-runtime-CBpcD2jv.js";import{D as r}from"./Divider-Df6jXbHZ.js";import"./iframe-C0tXKcvQ.js";import"./preload-helper-PPVm8Dsz.js";import"./create-component-T95yoBiY.js";const x={title:"Components/Divider",component:r,parameters:{layout:"padded",docs:{description:{component:`
A horizontal rule element for visually separating content sections with **schema-driven defaults** and **CDN-loaded rendering**.

## Key Features
- **Customizable Borders**: Width, color, and style (solid, dashed, dotted)
- **Width Control**: Percentage-based width for flexible sizing
- **Alignment**: Left, center, or right alignment
- **Multi-Mode**: Renders correctly in web, email, and document modes
- **Type-Safe**: Full TypeScript support via \`DividerValues\`

## Usage

\`\`\`tsx
// Basic usage with defaults
<Divider />

// Custom border
<Divider
  borderTopWidth="2px"
  borderTopColor="#3b82f6"
  borderTopStyle="solid"
  width="80%"
/>
\`\`\`
        `}}},argTypes:{mode:{control:{type:"select"},options:["web","email","document"],description:"**Rendering Mode** - Controls output format and optimizations",table:{defaultValue:{summary:"web"},type:{summary:"RenderMode"}}}},tags:["autodocs"]},o={render:()=>e.jsx(r,{}),parameters:{docs:{description:{story:"**Default Divider** - Renders with schema-driven defaults. A simple horizontal rule with center alignment."}}}},d={render:()=>e.jsx(r,{borderTopWidth:"2px",borderTopColor:"#3b82f6",borderTopStyle:"solid",width:"80%"}),parameters:{docs:{description:{story:`
**Custom Border Divider** - A 2px solid blue divider at 80% width.

\`\`\`tsx
<Divider
  borderTopWidth="2px"
  borderTopColor="#3b82f6"
  borderTopStyle="solid"
  width="80%"
/>
\`\`\`
        `}}}},n={render:()=>e.jsx(r,{borderTopWidth:"1px",borderTopColor:"#9ca3af",borderTopStyle:"dashed",width:"100%"}),parameters:{docs:{description:{story:"**Dashed Divider** - A subtle dashed line, useful for separating secondary content sections."}}}},i={render:()=>e.jsx(r,{borderTopWidth:"4px",borderTopColor:"#ec4899",borderTopStyle:"solid",width:"60%",textAlign:"center"}),parameters:{docs:{description:{story:"**Thick Accent Divider** - A bold 4px pink divider at 60% width, ideal for visual emphasis between major sections."}}}},t={render:()=>e.jsx(r,{borderTopWidth:"1px",borderTopColor:"#d1d5db",borderTopStyle:"solid",width:"100%",mode:"email"}),parameters:{docs:{description:{story:`
**Email Mode Divider** - Rendered with \`mode="email"\` for email client compatibility.

\`\`\`tsx
<Divider
  borderTopWidth="1px"
  borderTopColor="#d1d5db"
  borderTopStyle="solid"
  width="100%"
  mode="email"
/>
\`\`\`
        `}}}},s={parameters:{docs:{description:{story:"**Divider Gallery** - A showcase of various divider styles including solid, dashed, dotted, and different widths and colors."}}},render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"32px",padding:"40px",background:"#ffffff",minWidth:"500px"},children:[e.jsxs("div",{children:[e.jsx("h3",{style:{margin:"0 0 16px",color:"#1f2937",fontSize:"18px",fontWeight:"700"},children:"Solid Dividers"}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"20px"},children:[e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"12px",color:"#6b7280"},children:"1px default"}),e.jsx(r,{})]}),e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"12px",color:"#6b7280"},children:"2px blue, 80% width"}),e.jsx(r,{borderTopWidth:"2px",borderTopColor:"#3b82f6",borderTopStyle:"solid",width:"80%"})]}),e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"12px",color:"#6b7280"},children:"4px pink accent, 60% width"}),e.jsx(r,{borderTopWidth:"4px",borderTopColor:"#ec4899",borderTopStyle:"solid",width:"60%",textAlign:"center"})]})]})]}),e.jsxs("div",{children:[e.jsx("h3",{style:{margin:"0 0 16px",color:"#1f2937",fontSize:"18px",fontWeight:"700"},children:"Dashed and Dotted"}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"20px"},children:[e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"12px",color:"#6b7280"},children:"Dashed gray"}),e.jsx(r,{borderTopWidth:"1px",borderTopColor:"#9ca3af",borderTopStyle:"dashed",width:"100%"})]}),e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"12px",color:"#6b7280"},children:"Dotted green, 90% width"}),e.jsx(r,{borderTopWidth:"2px",borderTopColor:"#10b981",borderTopStyle:"dotted",width:"90%"})]}),e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"12px",color:"#6b7280"},children:"Dashed purple, 70% width"}),e.jsx(r,{borderTopWidth:"2px",borderTopColor:"#7c3aed",borderTopStyle:"dashed",width:"70%",textAlign:"center"})]})]})]}),e.jsxs("div",{children:[e.jsx("h3",{style:{margin:"0 0 16px",color:"#1f2937",fontSize:"18px",fontWeight:"700"},children:"Bold Accents"}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"20px"},children:[e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"12px",color:"#6b7280"},children:"3px orange, full width"}),e.jsx(r,{borderTopWidth:"3px",borderTopColor:"#f59e0b",borderTopStyle:"solid",width:"100%"})]}),e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"12px",color:"#6b7280"},children:"4px red, 50% centered"}),e.jsx(r,{borderTopWidth:"4px",borderTopColor:"#ef4444",borderTopStyle:"solid",width:"50%",textAlign:"center"})]})]})]})]})};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <Divider />,
  parameters: {
    docs: {
      description: {
        story: "**Default Divider** - Renders with schema-driven defaults. A simple horizontal rule with center alignment."
      }
    }
  }
}`,...o.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <Divider borderTopWidth="2px" borderTopColor="#3b82f6" borderTopStyle="solid" width="80%" />,
  parameters: {
    docs: {
      description: {
        story: \`
**Custom Border Divider** - A 2px solid blue divider at 80% width.

\\\`\\\`\\\`tsx
<Divider
  borderTopWidth="2px"
  borderTopColor="#3b82f6"
  borderTopStyle="solid"
  width="80%"
/>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...d.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <Divider borderTopWidth="1px" borderTopColor="#9ca3af" borderTopStyle="dashed" width="100%" />,
  parameters: {
    docs: {
      description: {
        story: "**Dashed Divider** - A subtle dashed line, useful for separating secondary content sections."
      }
    }
  }
}`,...n.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <Divider borderTopWidth="4px" borderTopColor="#ec4899" borderTopStyle="solid" width="60%" textAlign="center" />,
  parameters: {
    docs: {
      description: {
        story: "**Thick Accent Divider** - A bold 4px pink divider at 60% width, ideal for visual emphasis between major sections."
      }
    }
  }
}`,...i.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <Divider borderTopWidth="1px" borderTopColor="#d1d5db" borderTopStyle="solid" width="100%" mode="email" />,
  parameters: {
    docs: {
      description: {
        story: \`
**Email Mode Divider** - Rendered with \\\`mode="email"\\\` for email client compatibility.

\\\`\\\`\\\`tsx
<Divider
  borderTopWidth="1px"
  borderTopColor="#d1d5db"
  borderTopStyle="solid"
  width="100%"
  mode="email"
/>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...t.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: "**Divider Gallery** - A showcase of various divider styles including solid, dashed, dotted, and different widths and colors."
      }
    }
  },
  render: () => <div style={{
    display: "flex",
    flexDirection: "column",
    gap: "32px",
    padding: "40px",
    background: "#ffffff",
    minWidth: "500px"
  }}>
      <div>
        <h3 style={{
        margin: "0 0 16px",
        color: "#1f2937",
        fontSize: "18px",
        fontWeight: "700"
      }}>
          Solid Dividers
        </h3>
        <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>
          <div>
            <span style={{
            fontSize: "12px",
            color: "#6b7280"
          }}>
              1px default
            </span>
            <Divider />
          </div>
          <div>
            <span style={{
            fontSize: "12px",
            color: "#6b7280"
          }}>
              2px blue, 80% width
            </span>
            <Divider borderTopWidth="2px" borderTopColor="#3b82f6" borderTopStyle="solid" width="80%" />
          </div>
          <div>
            <span style={{
            fontSize: "12px",
            color: "#6b7280"
          }}>
              4px pink accent, 60% width
            </span>
            <Divider borderTopWidth="4px" borderTopColor="#ec4899" borderTopStyle="solid" width="60%" textAlign="center" />
          </div>
        </div>
      </div>

      <div>
        <h3 style={{
        margin: "0 0 16px",
        color: "#1f2937",
        fontSize: "18px",
        fontWeight: "700"
      }}>
          Dashed and Dotted
        </h3>
        <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>
          <div>
            <span style={{
            fontSize: "12px",
            color: "#6b7280"
          }}>
              Dashed gray
            </span>
            <Divider borderTopWidth="1px" borderTopColor="#9ca3af" borderTopStyle="dashed" width="100%" />
          </div>
          <div>
            <span style={{
            fontSize: "12px",
            color: "#6b7280"
          }}>
              Dotted green, 90% width
            </span>
            <Divider borderTopWidth="2px" borderTopColor="#10b981" borderTopStyle="dotted" width="90%" />
          </div>
          <div>
            <span style={{
            fontSize: "12px",
            color: "#6b7280"
          }}>
              Dashed purple, 70% width
            </span>
            <Divider borderTopWidth="2px" borderTopColor="#7c3aed" borderTopStyle="dashed" width="70%" textAlign="center" />
          </div>
        </div>
      </div>

      <div>
        <h3 style={{
        margin: "0 0 16px",
        color: "#1f2937",
        fontSize: "18px",
        fontWeight: "700"
      }}>
          Bold Accents
        </h3>
        <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>
          <div>
            <span style={{
            fontSize: "12px",
            color: "#6b7280"
          }}>
              3px orange, full width
            </span>
            <Divider borderTopWidth="3px" borderTopColor="#f59e0b" borderTopStyle="solid" width="100%" />
          </div>
          <div>
            <span style={{
            fontSize: "12px",
            color: "#6b7280"
          }}>
              4px red, 50% centered
            </span>
            <Divider borderTopWidth="4px" borderTopColor="#ef4444" borderTopStyle="solid" width="50%" textAlign="center" />
          </div>
        </div>
      </div>
    </div>
}`,...s.parameters?.docs?.source}}};const b=["Default","CustomBorder","Dashed","ThickAccent","EmailMode","DividerShowcase"];export{d as CustomBorder,n as Dashed,o as Default,s as DividerShowcase,t as EmailMode,i as ThickAccent,b as __namedExportsOrder,x as default};
