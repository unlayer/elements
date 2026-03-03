import{H as e}from"./Heading-BlN1fPTG.js";import"./create-component-D1merdym.js";import"./iframe-BMyXcb8A.js";import"./preload-helper-PPVm8Dsz.js";import"./index-8x7ipbY-.js";const p={title:"Components/Heading",component:e,parameters:{layout:"centered",docs:{description:{component:`
# Heading Component

Semantic heading elements (H1-H6) with **schema-driven typography defaults** and **SEO optimization**.

## Key Features
- **Semantic HTML**: Proper H1-H6 elements
- **SEO Optimized**: Proper heading hierarchy for search engines
- **Rich Typography**: Custom fonts, sizes, colors, spacing
- **Email-Safe**: Conservative styling for email clients
- **Performance**: CDN-loaded with fallback rendering

## Heading Hierarchy
- **H1**: Main page title, primary heading (largest)
- **H2**: Section headings, major topics
- **H3**: Subsection headings, article titles
- **H4**: Minor headings, card titles
- **H5**: Small headings, sidebar titles
- **H6**: Smallest heading, fine-grained sections

## Usage

\`\`\`html
<Heading
  text="Welcome to Our Platform"
  level="h1"
  color="#111827"
  fontSize="36px"
/>
\`\`\`
        `}}},argTypes:{text:{description:"**Heading Text**",control:"text"},level:{description:"**Semantic Level** -- h1 through h6",control:{type:"select"},options:["h1","h2","h3","h4","h5","h6"]},color:{description:"**Text Color**",control:"color"},fontSize:{description:"**Font Size**",control:"text"},mode:{control:{type:"select"},options:["web","email","document"],description:"**Rendering Mode**"}},tags:["autodocs"]},n={render:()=>({components:{Heading:e},template:'<Heading text="Welcome to Our Platform" level="h1" />'}),parameters:{docs:{description:{story:`
**Simplest Usage**

\`\`\`html
<Heading text="Welcome" level="h1" />
\`\`\`

Perfect for SEO-friendly semantic HTML headings.
        `}}}},t={render:()=>({components:{Heading:e},template:`
      <Heading
        text="Features & Benefits"
        level="h2"
        color="#2563eb"
        fontSize="32px"
        fontWeight="700"
        textAlign="center"
        lineHeight="1.2"
      />
    `}),parameters:{docs:{description:{story:'\n**Semantic Props**\n\n```html\n<Heading\n  text="Features & Benefits"\n  level="h2"\n  color="#2563eb"\n  fontSize="32px"\n  fontWeight="700"\n/>\n```\n\nAvailable props: `level`, `color`, `fontSize`, `fontWeight`, `textAlign`, `lineHeight`\n        '}}}},i={render:()=>({components:{Heading:e},template:`
      <div style="display: flex; flex-direction: column; gap: 20px; max-width: 800px;">
        <Heading text="H1 - Main Page Title" level="h1" fontSize="36px" fontWeight="800" color="#111827" />
        <Heading text="H2 - Section Heading" level="h2" fontSize="28px" fontWeight="700" color="#1f2937" />
        <Heading text="H3 - Subsection Title" level="h3" fontSize="24px" fontWeight="600" color="#374151" />
        <Heading text="H4 - Component Title" level="h4" fontSize="20px" fontWeight="600" color="#4b5563" />
        <Heading text="H5 - Small Heading" level="h5" fontSize="18px" fontWeight="600" color="#6b7280" />
        <Heading text="H6 - Finest Heading" level="h6" fontSize="16px" fontWeight="600" color="#9ca3af" />
      </div>
    `}),parameters:{docs:{description:{story:`
**Complete Heading Hierarchy**

Shows all heading levels with semantic props. Proper heading hierarchy improves SEO and accessibility!
        `}}}},o={render:()=>({components:{Heading:e},template:`
      <Heading
        text="Premium Features"
        level="h2"
        color="#7c3aed"
        fontSize="32px"
        fontWeight="700"
        textAlign="center"
      />
    `})},a={render:()=>({components:{Heading:e},template:`
      <Heading
        text="Monthly Newsletter"
        level="h1"
        color="#333333"
        fontSize="28px"
        mode="email"
      />
    `}),parameters:{docs:{description:{story:"**Email-Safe Heading** -- Uses conservative styling for email clients."}}}},l={render:()=>({components:{Heading:e},template:`
      <div style="display: flex; flex-direction: column; gap: 24px; padding: 40px; background: #ffffff; max-width: 800px;">
        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 700;">Heading Hierarchy</h3>
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <Heading text="H1 - Main Page Title" level="h1" fontSize="36px" fontWeight="800" color="#111827" />
            <Heading text="H2 - Section Heading" level="h2" fontSize="28px" fontWeight="700" color="#1f2937" />
            <Heading text="H3 - Subsection Title" level="h3" fontSize="24px" fontWeight="600" color="#374151" />
            <Heading text="H4 - Component Title" level="h4" fontSize="20px" fontWeight="600" color="#4b5563" />
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 700;">Styled Headings</h3>
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <Heading text="PREMIUM FEATURES" level="h2" color="#7c3aed" fontSize="24px" fontWeight="700" textAlign="center" />
            <Heading text="Gradient Magic Heading" level="h2" color="#667eea" fontSize="32px" fontWeight="800" textAlign="center" />
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 700;">Color Variations</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <Heading text="Primary Blue" level="h3" color="#2563eb" fontSize="24px" fontWeight="600" textAlign="center" />
            <Heading text="Success Green" level="h3" color="#059669" fontSize="24px" fontWeight="600" textAlign="center" />
            <Heading text="Warning Orange" level="h3" color="#d97706" fontSize="24px" fontWeight="600" textAlign="center" />
            <Heading text="Danger Red" level="h3" color="#dc2626" fontSize="24px" fontWeight="600" textAlign="center" />
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 700;">Email-Safe Headings</h3>
          <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px;">
            <Heading text="Email Newsletter Title" level="h1" color="#333333" fontSize="28px" mode="email" />
          </div>
        </div>
      </div>
    `}),parameters:{docs:{description:{story:"**Heading Showcase** -- Complete gallery of heading styles including hierarchy, colors, and email-safe headings."}}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Heading
    },
    template: \`<Heading text="Welcome to Our Platform" level="h1" />\`
  }),
  parameters: {
    docs: {
      description: {
        story: \`
**Simplest Usage**

\\\`\\\`\\\`html
<Heading text="Welcome" level="h1" />
\\\`\\\`\\\`

Perfect for SEO-friendly semantic HTML headings.
        \`
      }
    }
  }
}`,...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Heading
    },
    template: \`
      <Heading
        text="Features & Benefits"
        level="h2"
        color="#2563eb"
        fontSize="32px"
        fontWeight="700"
        textAlign="center"
        lineHeight="1.2"
      />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: \`
**Semantic Props**

\\\`\\\`\\\`html
<Heading
  text="Features & Benefits"
  level="h2"
  color="#2563eb"
  fontSize="32px"
  fontWeight="700"
/>
\\\`\\\`\\\`

Available props: \\\`level\\\`, \\\`color\\\`, \\\`fontSize\\\`, \\\`fontWeight\\\`, \\\`textAlign\\\`, \\\`lineHeight\\\`
        \`
      }
    }
  }
}`,...t.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Heading
    },
    template: \`
      <div style="display: flex; flex-direction: column; gap: 20px; max-width: 800px;">
        <Heading text="H1 - Main Page Title" level="h1" fontSize="36px" fontWeight="800" color="#111827" />
        <Heading text="H2 - Section Heading" level="h2" fontSize="28px" fontWeight="700" color="#1f2937" />
        <Heading text="H3 - Subsection Title" level="h3" fontSize="24px" fontWeight="600" color="#374151" />
        <Heading text="H4 - Component Title" level="h4" fontSize="20px" fontWeight="600" color="#4b5563" />
        <Heading text="H5 - Small Heading" level="h5" fontSize="18px" fontWeight="600" color="#6b7280" />
        <Heading text="H6 - Finest Heading" level="h6" fontSize="16px" fontWeight="600" color="#9ca3af" />
      </div>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: \`
**Complete Heading Hierarchy**

Shows all heading levels with semantic props. Proper heading hierarchy improves SEO and accessibility!
        \`
      }
    }
  }
}`,...i.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Heading
    },
    template: \`
      <Heading
        text="Premium Features"
        level="h2"
        color="#7c3aed"
        fontSize="32px"
        fontWeight="700"
        textAlign="center"
      />
    \`
  })
}`,...o.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Heading
    },
    template: \`
      <Heading
        text="Monthly Newsletter"
        level="h1"
        color="#333333"
        fontSize="28px"
        mode="email"
      />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Email-Safe Heading** -- Uses conservative styling for email clients.'
      }
    }
  }
}`,...a.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Heading
    },
    template: \`
      <div style="display: flex; flex-direction: column; gap: 24px; padding: 40px; background: #ffffff; max-width: 800px;">
        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 700;">Heading Hierarchy</h3>
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <Heading text="H1 - Main Page Title" level="h1" fontSize="36px" fontWeight="800" color="#111827" />
            <Heading text="H2 - Section Heading" level="h2" fontSize="28px" fontWeight="700" color="#1f2937" />
            <Heading text="H3 - Subsection Title" level="h3" fontSize="24px" fontWeight="600" color="#374151" />
            <Heading text="H4 - Component Title" level="h4" fontSize="20px" fontWeight="600" color="#4b5563" />
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 700;">Styled Headings</h3>
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <Heading text="PREMIUM FEATURES" level="h2" color="#7c3aed" fontSize="24px" fontWeight="700" textAlign="center" />
            <Heading text="Gradient Magic Heading" level="h2" color="#667eea" fontSize="32px" fontWeight="800" textAlign="center" />
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 700;">Color Variations</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <Heading text="Primary Blue" level="h3" color="#2563eb" fontSize="24px" fontWeight="600" textAlign="center" />
            <Heading text="Success Green" level="h3" color="#059669" fontSize="24px" fontWeight="600" textAlign="center" />
            <Heading text="Warning Orange" level="h3" color="#d97706" fontSize="24px" fontWeight="600" textAlign="center" />
            <Heading text="Danger Red" level="h3" color="#dc2626" fontSize="24px" fontWeight="600" textAlign="center" />
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 700;">Email-Safe Headings</h3>
          <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px;">
            <Heading text="Email Newsletter Title" level="h1" color="#333333" fontSize="28px" mode="email" />
          </div>
        </div>
      </div>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Heading Showcase** -- Complete gallery of heading styles including hierarchy, colors, and email-safe headings.'
      }
    }
  }
}`,...l.parameters?.docs?.source}}};const f=["SimpleHeading","WithSemanticProps","MultipleHeadingLevels","ColoredHeading","EmailHeading","HeadingShowcase"];export{o as ColoredHeading,a as EmailHeading,l as HeadingShowcase,i as MultipleHeadingLevels,n as SimpleHeading,t as WithSemanticProps,f as __namedExportsOrder,p as default};
