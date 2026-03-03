import{D as e}from"./Divider-CBLHcOXg.js";import"./create-component-D1merdym.js";import"./iframe-BMyXcb8A.js";import"./preload-helper-PPVm8Dsz.js";import"./index-8x7ipbY-.js";const v={title:"Components/Divider",component:e,parameters:{layout:"centered",docs:{description:{component:`
# Divider Component

A horizontal rule element for visually separating content sections with **schema-driven defaults**.

## Key Features
- **Customizable Borders**: Width, color, and style (solid, dashed, dotted)
- **Width Control**: Percentage-based width for flexible sizing
- **Multi-Mode**: Renders correctly in web, email, and document modes

## Usage

\`\`\`html
<Divider />

<Divider
  borderTopColor="#3b82f6"
  borderTopWidth="2px"
/>
\`\`\`
        `}}},argTypes:{borderTopColor:{description:"**Border Color**",control:"color"},borderTopWidth:{description:'**Border Width** (e.g., "2px")',control:"text"},borderTopStyle:{description:"**Border Style**",control:{type:"select"},options:["solid","dashed","dotted"]},mode:{control:{type:"select"},options:["web","email","document"],description:"**Rendering Mode**"}},tags:["autodocs"]},o={render:()=>({components:{Divider:e},template:'<div style="min-width: 500px;"><Divider /></div>'}),parameters:{docs:{description:{story:"**Default Divider** -- Renders with schema-driven defaults."}}}},r={render:()=>({components:{Divider:e},template:'<div style="min-width: 500px;"><Divider borderTopColor="#3b82f6" borderTopWidth="2px" /></div>'}),parameters:{docs:{description:{story:'\n**Custom Border Divider** -- A 2px solid blue divider.\n\n```html\n<Divider borderTopColor="#3b82f6" borderTopWidth="2px" />\n```\n        '}}}},d={render:()=>({components:{Divider:e},template:'<div style="min-width: 500px;"><Divider borderTopColor="#6b7280" borderTopWidth="2px" borderTopStyle="dashed" /></div>'}),parameters:{docs:{description:{story:'\n**Dashed Divider** -- A dashed border style for a lighter visual separation.\n\n```html\n<Divider borderTopColor="#6b7280" borderTopWidth="2px" borderTopStyle="dashed" />\n```\n        '}}}},i={render:()=>({components:{Divider:e},template:'<div style="min-width: 500px;"><Divider borderTopColor="#ec4899" borderTopWidth="4px" /></div>'}),parameters:{docs:{description:{story:"**Thick Accent Divider** -- A bold 4px pink divider for visual emphasis."}}}},n={render:()=>({components:{Divider:e},template:'<div style="min-width: 500px;"><Divider borderTopColor="#d1d5db" borderTopWidth="1px" mode="email" /></div>'}),parameters:{docs:{description:{story:'**Email Mode Divider** -- Rendered with `mode="email"` for email client compatibility.'}}}},t={render:()=>({components:{Divider:e},template:`
      <div style="display: flex; flex-direction: column; gap: 32px; padding: 40px; background: #ffffff; min-width: 500px;">
        <div>
          <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 700;">Solid Dividers</h3>
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <div>
              <span style="font-size: 12px; color: #6b7280;">1px default</span>
              <Divider />
            </div>
            <div>
              <span style="font-size: 12px; color: #6b7280;">2px blue</span>
              <Divider borderTopColor="#3b82f6" borderTopWidth="2px" />
            </div>
            <div>
              <span style="font-size: 12px; color: #6b7280;">4px pink accent</span>
              <Divider borderTopColor="#ec4899" borderTopWidth="4px" />
            </div>
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 700;">Dashed & Dotted Styles</h3>
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <div>
              <span style="font-size: 12px; color: #6b7280;">2px dashed gray</span>
              <Divider borderTopColor="#6b7280" borderTopWidth="2px" borderTopStyle="dashed" />
            </div>
            <div>
              <span style="font-size: 12px; color: #6b7280;">2px dotted indigo</span>
              <Divider borderTopColor="#6366f1" borderTopWidth="2px" borderTopStyle="dotted" />
            </div>
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 700;">Bold Accents</h3>
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <div>
              <span style="font-size: 12px; color: #6b7280;">3px orange</span>
              <Divider borderTopColor="#f59e0b" borderTopWidth="3px" />
            </div>
            <div>
              <span style="font-size: 12px; color: #6b7280;">4px red</span>
              <Divider borderTopColor="#ef4444" borderTopWidth="4px" />
            </div>
            <div>
              <span style="font-size: 12px; color: #6b7280;">3px purple</span>
              <Divider borderTopColor="#7c3aed" borderTopWidth="3px" />
            </div>
          </div>
        </div>
      </div>
    `}),parameters:{docs:{description:{story:"**Divider Gallery** -- A showcase of various divider styles including solid, dashed, dotted, and bold accents."}}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Divider
    },
    template: \`<div style="min-width: 500px;"><Divider /></div>\`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Default Divider** -- Renders with schema-driven defaults.'
      }
    }
  }
}`,...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Divider
    },
    template: \`<div style="min-width: 500px;"><Divider borderTopColor="#3b82f6" borderTopWidth="2px" /></div>\`
  }),
  parameters: {
    docs: {
      description: {
        story: \`
**Custom Border Divider** -- A 2px solid blue divider.

\\\`\\\`\\\`html
<Divider borderTopColor="#3b82f6" borderTopWidth="2px" />
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...r.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Divider
    },
    template: \`<div style="min-width: 500px;"><Divider borderTopColor="#6b7280" borderTopWidth="2px" borderTopStyle="dashed" /></div>\`
  }),
  parameters: {
    docs: {
      description: {
        story: \`
**Dashed Divider** -- A dashed border style for a lighter visual separation.

\\\`\\\`\\\`html
<Divider borderTopColor="#6b7280" borderTopWidth="2px" borderTopStyle="dashed" />
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...d.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Divider
    },
    template: \`<div style="min-width: 500px;"><Divider borderTopColor="#ec4899" borderTopWidth="4px" /></div>\`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Thick Accent Divider** -- A bold 4px pink divider for visual emphasis.'
      }
    }
  }
}`,...i.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Divider
    },
    template: \`<div style="min-width: 500px;"><Divider borderTopColor="#d1d5db" borderTopWidth="1px" mode="email" /></div>\`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Email Mode Divider** -- Rendered with \`mode="email"\` for email client compatibility.'
      }
    }
  }
}`,...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Divider
    },
    template: \`
      <div style="display: flex; flex-direction: column; gap: 32px; padding: 40px; background: #ffffff; min-width: 500px;">
        <div>
          <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 700;">Solid Dividers</h3>
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <div>
              <span style="font-size: 12px; color: #6b7280;">1px default</span>
              <Divider />
            </div>
            <div>
              <span style="font-size: 12px; color: #6b7280;">2px blue</span>
              <Divider borderTopColor="#3b82f6" borderTopWidth="2px" />
            </div>
            <div>
              <span style="font-size: 12px; color: #6b7280;">4px pink accent</span>
              <Divider borderTopColor="#ec4899" borderTopWidth="4px" />
            </div>
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 700;">Dashed & Dotted Styles</h3>
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <div>
              <span style="font-size: 12px; color: #6b7280;">2px dashed gray</span>
              <Divider borderTopColor="#6b7280" borderTopWidth="2px" borderTopStyle="dashed" />
            </div>
            <div>
              <span style="font-size: 12px; color: #6b7280;">2px dotted indigo</span>
              <Divider borderTopColor="#6366f1" borderTopWidth="2px" borderTopStyle="dotted" />
            </div>
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 700;">Bold Accents</h3>
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <div>
              <span style="font-size: 12px; color: #6b7280;">3px orange</span>
              <Divider borderTopColor="#f59e0b" borderTopWidth="3px" />
            </div>
            <div>
              <span style="font-size: 12px; color: #6b7280;">4px red</span>
              <Divider borderTopColor="#ef4444" borderTopWidth="4px" />
            </div>
            <div>
              <span style="font-size: 12px; color: #6b7280;">3px purple</span>
              <Divider borderTopColor="#7c3aed" borderTopWidth="3px" />
            </div>
          </div>
        </div>
      </div>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Divider Gallery** -- A showcase of various divider styles including solid, dashed, dotted, and bold accents.'
      }
    }
  }
}`,...t.parameters?.docs?.source}}};const m=["Default","CustomBorder","Dashed","ThickAccent","EmailMode","DividerShowcase"];export{r as CustomBorder,d as Dashed,o as Default,t as DividerShowcase,n as EmailMode,i as ThickAccent,m as __namedExportsOrder,v as default};
