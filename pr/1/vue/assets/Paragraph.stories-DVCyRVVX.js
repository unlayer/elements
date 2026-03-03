import{c,h as d,m as g}from"./create-component-D1merdym.js";import"./iframe-BMyXcb8A.js";import"./preload-helper-PPVm8Dsz.js";import"./index-8x7ipbY-.js";const p={fontSize:"14px",lineHeight:"140%",textAlign:"left",color:"#000000"},e=c({name:"Paragraph",defaultValues:p,propMapper:l=>g(l,p,"Paragraph"),exporters:d}),x={title:"Components/Paragraph",component:e,parameters:{layout:"centered",docs:{description:{component:`
# Paragraph Component

Block-level text element for structured content with **schema-driven typography defaults**.

## Key Features
- **Rich Typography**: Font families, sizes, weights, colors, spacing
- **Block-Level**: Renders as a proper paragraph element with spacing
- **Email-Safe**: Conservative styling for email clients
- **Slot Support**: Pass text as children or via the \`text\` prop

## Common Use Cases
- Article body text and paragraphs
- Content blocks in emails and newsletters
- Callout and highlight text
- Long-form content sections

## Usage

\`\`\`html
<Paragraph text="Your paragraph text here." />

<!-- Or with slot content -->
<Paragraph>Your paragraph text here.</Paragraph>
\`\`\`
        `}}},argTypes:{text:{description:"**Text Content** -- The paragraph text to display",control:"text"},color:{description:"**Text Color**",control:"color"},fontSize:{description:'**Font Size** (e.g., "16px")',control:"text"},lineHeight:{description:'**Line Height** (e.g., "1.6")',control:"text"},textAlign:{description:"**Text Alignment**",control:{type:"select"},options:["left","center","right","justify"]},mode:{control:{type:"select"},options:["web","email","document"],description:"**Rendering Mode**"}},tags:["autodocs"]},t={render:()=>({components:{Paragraph:e},template:'<Paragraph text="This is the simplest way to use Paragraph -- just pass text as a prop!" />'}),parameters:{docs:{description:{story:'\n**Simplest Usage**\n\n```html\n<Paragraph text="Hello world" />\n```\n        '}}}},n={render:()=>({components:{Paragraph:e},template:`
      <Paragraph
        text="This paragraph uses semantic props for styling. It has custom colors, sizing, line height, and center alignment for a polished look."
        color="#374151"
        fontSize="16px"
        lineHeight="1.6"
        textAlign="center"
      />
    `}),parameters:{docs:{description:{story:'\n**Semantic Props (Recommended!)**\n\n```html\n<Paragraph\n  text="Styled paragraph"\n  color="#374151"\n  fontSize="16px"\n  lineHeight="1.6"\n  textAlign="center"\n/>\n```\n\nAvailable semantic props: `color`, `fontSize`, `fontWeight`, `textAlign`, `lineHeight`\n        '}}}},a={render:()=>({components:{Paragraph:e},template:`
      <div style="max-width: 600px;">
        <Paragraph
          text="Beautifully styled paragraph text with a comfortable reading experience. The larger font size and generous line height make this ideal for hero sections, landing pages, and any content that needs to stand out."
          color="#1e293b"
          fontSize="18px"
          lineHeight="1.8"
          fontWeight="400"
        />
      </div>
    `}),parameters:{docs:{description:{story:"**Styled Paragraph** -- Large, comfortable reading typography ideal for hero sections and landing pages."}}}},o={render:()=>({components:{Paragraph:e},template:`
      <div style="max-width: 640px;">
        <Paragraph
          text="In the evolving landscape of web development, component-based architectures have become the standard for building scalable, maintainable applications. By encapsulating logic, styling, and markup into reusable units, teams can iterate faster, maintain consistency across products, and onboard new developers more quickly. This approach applies not only to web applications but also to email templates, documents, and any structured content."
          color="#374151"
          fontSize="16px"
          lineHeight="1.75"
          textAlign="justify"
        />
      </div>
    `}),parameters:{docs:{description:{story:"**Article Paragraph** -- Long-form article text with justified alignment and generous line height for readability."}}}},r={render:()=>({components:{Paragraph:e},template:`
      <Paragraph
        text="Thank you for subscribing to our newsletter. You will receive weekly updates about our latest features, tips, and special offers directly in your inbox."
        color="#333333"
        fontSize="16px"
        lineHeight="1.5"
        mode="email"
      />
    `}),parameters:{docs:{description:{story:'**Email-Safe Paragraph** -- Uses `mode="email"` for consistent rendering across Gmail, Outlook, and Apple Mail.'}}}},i={render:()=>({components:{Paragraph:e},template:`
      <div style="max-width: 600px; background-color: #eff6ff; padding: 24px; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <Paragraph
          text="Important: This is a callout paragraph that draws attention to key information. Use it for notices, warnings, tips, or any content that deserves extra emphasis in your layout."
          color="#1e40af"
          fontSize="15px"
          lineHeight="1.6"
          fontWeight="500"
        />
      </div>
    `}),parameters:{docs:{description:{story:"**Callout Paragraph** -- Emphasized text in a styled callout box, ideal for notices and important information."}}}},s={render:()=>({components:{Paragraph:e},template:`
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 640px; padding: 40px; background: #ffffff;">
        <Paragraph
          text="The Art of Component Design"
          color="#111827"
          fontSize="28px"
          lineHeight="1.3"
          fontWeight="700"
        />
        <Paragraph
          text="Component-based development has revolutionized how we think about building user interfaces. Rather than constructing monolithic pages from scratch, modern frameworks encourage developers to break down interfaces into small, reusable building blocks."
          color="#374151"
          fontSize="16px"
          lineHeight="1.75"
        />
        <Paragraph
          text="Each component encapsulates its own logic, styling, and markup, making it easy to test in isolation, share across projects, and compose into complex layouts. This approach scales naturally from small marketing pages to large enterprise applications."
          color="#374151"
          fontSize="16px"
          lineHeight="1.75"
        />
        <Paragraph
          text="When applied to email development, componentization brings the same benefits: consistent rendering across clients, faster iteration cycles, and a single source of truth for design tokens and brand guidelines. Teams no longer need to maintain separate HTML templates for each campaign."
          color="#374151"
          fontSize="16px"
          lineHeight="1.75"
        />
        <Paragraph
          text="The key to successful component design is finding the right level of abstraction. Components should be flexible enough to accommodate different use cases but opinionated enough to enforce consistency. Semantic props, sensible defaults, and clear documentation are the hallmarks of well-designed component libraries."
          color="#374151"
          fontSize="16px"
          lineHeight="1.75"
        />
      </div>
    `}),parameters:{docs:{description:{story:"**Long Content** -- Multiple paragraphs demonstrating how the component handles long-form article content with proper spacing."}}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Paragraph
    },
    template: \`<Paragraph text="This is the simplest way to use Paragraph -- just pass text as a prop!" />\`
  }),
  parameters: {
    docs: {
      description: {
        story: \`
**Simplest Usage**

\\\`\\\`\\\`html
<Paragraph text="Hello world" />
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Paragraph
    },
    template: \`
      <Paragraph
        text="This paragraph uses semantic props for styling. It has custom colors, sizing, line height, and center alignment for a polished look."
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
<Paragraph
  text="Styled paragraph"
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
}`,...n.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Paragraph
    },
    template: \`
      <div style="max-width: 600px;">
        <Paragraph
          text="Beautifully styled paragraph text with a comfortable reading experience. The larger font size and generous line height make this ideal for hero sections, landing pages, and any content that needs to stand out."
          color="#1e293b"
          fontSize="18px"
          lineHeight="1.8"
          fontWeight="400"
        />
      </div>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Styled Paragraph** -- Large, comfortable reading typography ideal for hero sections and landing pages.'
      }
    }
  }
}`,...a.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Paragraph
    },
    template: \`
      <div style="max-width: 640px;">
        <Paragraph
          text="In the evolving landscape of web development, component-based architectures have become the standard for building scalable, maintainable applications. By encapsulating logic, styling, and markup into reusable units, teams can iterate faster, maintain consistency across products, and onboard new developers more quickly. This approach applies not only to web applications but also to email templates, documents, and any structured content."
          color="#374151"
          fontSize="16px"
          lineHeight="1.75"
          textAlign="justify"
        />
      </div>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Article Paragraph** -- Long-form article text with justified alignment and generous line height for readability.'
      }
    }
  }
}`,...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Paragraph
    },
    template: \`
      <Paragraph
        text="Thank you for subscribing to our newsletter. You will receive weekly updates about our latest features, tips, and special offers directly in your inbox."
        color="#333333"
        fontSize="16px"
        lineHeight="1.5"
        mode="email"
      />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Email-Safe Paragraph** -- Uses \`mode="email"\` for consistent rendering across Gmail, Outlook, and Apple Mail.'
      }
    }
  }
}`,...r.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Paragraph
    },
    template: \`
      <div style="max-width: 600px; background-color: #eff6ff; padding: 24px; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <Paragraph
          text="Important: This is a callout paragraph that draws attention to key information. Use it for notices, warnings, tips, or any content that deserves extra emphasis in your layout."
          color="#1e40af"
          fontSize="15px"
          lineHeight="1.6"
          fontWeight="500"
        />
      </div>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Callout Paragraph** -- Emphasized text in a styled callout box, ideal for notices and important information.'
      }
    }
  }
}`,...i.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Paragraph
    },
    template: \`
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 640px; padding: 40px; background: #ffffff;">
        <Paragraph
          text="The Art of Component Design"
          color="#111827"
          fontSize="28px"
          lineHeight="1.3"
          fontWeight="700"
        />
        <Paragraph
          text="Component-based development has revolutionized how we think about building user interfaces. Rather than constructing monolithic pages from scratch, modern frameworks encourage developers to break down interfaces into small, reusable building blocks."
          color="#374151"
          fontSize="16px"
          lineHeight="1.75"
        />
        <Paragraph
          text="Each component encapsulates its own logic, styling, and markup, making it easy to test in isolation, share across projects, and compose into complex layouts. This approach scales naturally from small marketing pages to large enterprise applications."
          color="#374151"
          fontSize="16px"
          lineHeight="1.75"
        />
        <Paragraph
          text="When applied to email development, componentization brings the same benefits: consistent rendering across clients, faster iteration cycles, and a single source of truth for design tokens and brand guidelines. Teams no longer need to maintain separate HTML templates for each campaign."
          color="#374151"
          fontSize="16px"
          lineHeight="1.75"
        />
        <Paragraph
          text="The key to successful component design is finding the right level of abstraction. Components should be flexible enough to accommodate different use cases but opinionated enough to enforce consistency. Semantic props, sensible defaults, and clear documentation are the hallmarks of well-designed component libraries."
          color="#374151"
          fontSize="16px"
          lineHeight="1.75"
        />
      </div>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Long Content** -- Multiple paragraphs demonstrating how the component handles long-form article content with proper spacing.'
      }
    }
  }
}`,...s.parameters?.docs?.source}}};const y=["SimpleText","WithSemanticProps","StyledParagraph","ArticleParagraph","EmailParagraph","CalloutParagraph","LongContent"];export{o as ArticleParagraph,i as CalloutParagraph,r as EmailParagraph,s as LongContent,t as SimpleText,a as StyledParagraph,n as WithSemanticProps,y as __namedExportsOrder,x as default};
