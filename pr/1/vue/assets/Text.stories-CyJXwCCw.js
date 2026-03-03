import{T as e}from"./Text-Bju3ph6h.js";import"./create-component-D1merdym.js";import"./iframe-BMyXcb8A.js";import"./preload-helper-PPVm8Dsz.js";import"./index-8x7ipbY-.js";const x={title:"Components/Text",component:e,parameters:{layout:"centered",docs:{description:{component:`
# Text Component

Versatile text rendering with **schema-driven typography defaults** and **CDN-loaded styling**.

## Key Features
- **Rich Typography**: Font families, sizes, weights, colors, spacing
- **Responsive**: Mobile-optimized sizing and line heights
- **Email-Safe**: Conservative styling for email clients
- **Flexible Alignment**: Left, center, right, justify options
- **Performance**: CDN-loaded with fallback rendering

## Common Use Cases
- Body text and paragraphs in emails and web pages
- Captions, labels, and metadata text
- Highlighted callouts and important notices
- Professional corporate communications

## Usage

\`\`\`html
<Text
  text="Your text here"
  color="#374151"
  fontSize="16px"
  lineHeight="1.6"
/>
\`\`\`
        `}}},argTypes:{text:{description:"**Text Content** -- The text to display",control:"text"},color:{description:"**Text Color**",control:"color"},fontSize:{description:'**Font Size** (e.g., "16px")',control:"text"},lineHeight:{description:'**Line Height** (e.g., "1.6")',control:"text"},textAlign:{description:"**Text Alignment**",control:{type:"select"},options:["left","center","right","justify"]},mode:{control:{type:"select"},options:["web","email","document"],description:"**Rendering Mode**"}},tags:["autodocs"]},t={render:()=>({components:{Text:e},template:'<Text text="This is the simplest way to use Text -- just pass text as a prop!" />'}),parameters:{docs:{description:{story:'\n**Simplest Usage**\n\n```html\n<Text text="Hello world" />\n```\n        '}}}},n={render:()=>({components:{Text:e},template:`
      <Text
        text="This text uses semantic props for styling! It's centered with custom colors, sizing, and spacing."
        color="#374151"
        fontSize="16px"
        lineHeight="1.6"
        textAlign="center"
      />
    `}),parameters:{docs:{description:{story:'\n**Semantic Props (Recommended!)**\n\n```html\n<Text\n  text="Styled text"\n  color="#374151"\n  fontSize="16px"\n  lineHeight="1.6"\n  textAlign="center"\n/>\n```\n\nAvailable semantic props: `color`, `fontSize`, `fontWeight`, `textAlign`, `lineHeight`\n        '}}}},o={render:()=>({components:{Text:e},template:`
      <Text
        text="This is body text that demonstrates how the Text component renders standard content with beautiful typography. Perfect for paragraphs, descriptions, and general content."
        fontSize="16px"
        lineHeight="1.6"
        color="#374151"
        textAlign="left"
      />
    `})},i={render:()=>({components:{Text:e},template:`
      <Text
        text="Image caption or small descriptive text that provides additional context."
        fontSize="14px"
        lineHeight="1.4"
        color="#6b7280"
        textAlign="center"
      />
    `})},r={render:()=>({components:{Text:e},template:`
      <Text
        text="This email-safe text uses web-safe fonts and styling that renders consistently across all email clients."
        fontSize="16px"
        lineHeight="1.5"
        color="#333333"
        mode="email"
      />
    `}),parameters:{docs:{description:{story:'**Email-Safe Typography** -- Uses `mode="email"` for consistent rendering across Gmail, Outlook, Apple Mail.'}}}},a={render:()=>({components:{Text:e},template:`
      <div style="display: flex; flex-direction: column; gap: 32px; padding: 40px; background: #ffffff; max-width: 800px;">
        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 700;">
            Content Typography
          </h3>
          <div style="display: flex; flex-direction: column; gap: 24px;">
            <Text text="Large heading text that captures attention and establishes hierarchy." fontSize="24px" lineHeight="1.3" color="#111827" fontWeight="700" />
            <Text text="This is body text that provides detailed information with comfortable reading typography. It demonstrates how the Text component handles longer content with proper line height and spacing." fontSize="16px" lineHeight="1.6" color="#374151" />
            <Text text="Small caption text for additional details and metadata." fontSize="14px" lineHeight="1.4" color="#6b7280" />
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 700;">
            Color Variations
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <Text text="Primary Blue Text" fontSize="16px" color="#2563eb" fontWeight="600" textAlign="center" />
            <Text text="Success Green Text" fontSize="16px" color="#059669" fontWeight="600" textAlign="center" />
            <Text text="Warning Orange Text" fontSize="16px" color="#d97706" fontWeight="600" textAlign="center" />
            <Text text="Danger Red Text" fontSize="16px" color="#dc2626" fontWeight="600" textAlign="center" />
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 700;">
            Email-Safe Typography
          </h3>
          <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px;">
            <Text text="This text uses email-safe fonts and styling that renders consistently across Gmail, Outlook, Apple Mail, and other email clients." fontSize="16px" lineHeight="1.5" color="#333333" mode="email" />
          </div>
        </div>
      </div>
    `}),parameters:{docs:{description:{story:"**Typography Showcase** -- Various text styles including content hierarchy, colors, and email-safe typography."}}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Text
    },
    template: \`<Text text="This is the simplest way to use Text -- just pass text as a prop!" />\`
  }),
  parameters: {
    docs: {
      description: {
        story: \`
**Simplest Usage**

\\\`\\\`\\\`html
<Text text="Hello world" />
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Text
    },
    template: \`
      <Text
        text="This text uses semantic props for styling! It's centered with custom colors, sizing, and spacing."
        color="#374151"
        fontSize="16px"
        lineHeight="1.6"
        textAlign="center"
      />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: \`
**Semantic Props (Recommended!)**

\\\`\\\`\\\`html
<Text
  text="Styled text"
  color="#374151"
  fontSize="16px"
  lineHeight="1.6"
  textAlign="center"
/>
\\\`\\\`\\\`

Available semantic props: \\\`color\\\`, \\\`fontSize\\\`, \\\`fontWeight\\\`, \\\`textAlign\\\`, \\\`lineHeight\\\`
        \`
      }
    }
  }
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Text
    },
    template: \`
      <Text
        text="This is body text that demonstrates how the Text component renders standard content with beautiful typography. Perfect for paragraphs, descriptions, and general content."
        fontSize="16px"
        lineHeight="1.6"
        color="#374151"
        textAlign="left"
      />
    \`
  })
}`,...o.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Text
    },
    template: \`
      <Text
        text="Image caption or small descriptive text that provides additional context."
        fontSize="14px"
        lineHeight="1.4"
        color="#6b7280"
        textAlign="center"
      />
    \`
  })
}`,...i.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Text
    },
    template: \`
      <Text
        text="This email-safe text uses web-safe fonts and styling that renders consistently across all email clients."
        fontSize="16px"
        lineHeight="1.5"
        color="#333333"
        mode="email"
      />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Email-Safe Typography** -- Uses \`mode="email"\` for consistent rendering across Gmail, Outlook, Apple Mail.'
      }
    }
  }
}`,...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Text
    },
    template: \`
      <div style="display: flex; flex-direction: column; gap: 32px; padding: 40px; background: #ffffff; max-width: 800px;">
        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 700;">
            Content Typography
          </h3>
          <div style="display: flex; flex-direction: column; gap: 24px;">
            <Text text="Large heading text that captures attention and establishes hierarchy." fontSize="24px" lineHeight="1.3" color="#111827" fontWeight="700" />
            <Text text="This is body text that provides detailed information with comfortable reading typography. It demonstrates how the Text component handles longer content with proper line height and spacing." fontSize="16px" lineHeight="1.6" color="#374151" />
            <Text text="Small caption text for additional details and metadata." fontSize="14px" lineHeight="1.4" color="#6b7280" />
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 700;">
            Color Variations
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <Text text="Primary Blue Text" fontSize="16px" color="#2563eb" fontWeight="600" textAlign="center" />
            <Text text="Success Green Text" fontSize="16px" color="#059669" fontWeight="600" textAlign="center" />
            <Text text="Warning Orange Text" fontSize="16px" color="#d97706" fontWeight="600" textAlign="center" />
            <Text text="Danger Red Text" fontSize="16px" color="#dc2626" fontWeight="600" textAlign="center" />
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 700;">
            Email-Safe Typography
          </h3>
          <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px;">
            <Text text="This text uses email-safe fonts and styling that renders consistently across Gmail, Outlook, Apple Mail, and other email clients." fontSize="16px" lineHeight="1.5" color="#333333" mode="email" />
          </div>
        </div>
      </div>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Typography Showcase** -- Various text styles including content hierarchy, colors, and email-safe typography.'
      }
    }
  }
}`,...a.parameters?.docs?.source}}};const m=["SimpleText","WithSemanticProps","BodyText","CaptionText","EmailText","TextShowcase"];export{o as BodyText,i as CaptionText,r as EmailText,t as SimpleText,a as TextShowcase,n as WithSemanticProps,m as __namedExportsOrder,x as default};
