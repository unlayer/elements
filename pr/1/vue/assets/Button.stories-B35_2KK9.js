import{B as o}from"./Button-Dpxp_fCE.js";import"./create-component-D1merdym.js";import"./iframe-BMyXcb8A.js";import"./preload-helper-PPVm8Dsz.js";import"./index-8x7ipbY-.js";const c={title:"Components/Button",component:o,parameters:{layout:"centered",docs:{description:{component:`
# Button Component

Interactive button with **schema-driven defaults** and **CDN-loaded rendering**.

## Key Features
- **Multiple Modes**: Web, Email, Document
- **Rich Styling**: Colors, borders, shadows, fonts
- **Responsive**: Auto-width, mobile-optimized sizes
- **Smart Links**: Web URLs, email addresses, phone numbers
- **Performance**: CDN-loaded with fallback rendering
- **Type-Safe**: Full TypeScript support with schema validation

## Common Use Cases
- Call-to-action buttons in emails and web pages
- Navigation links with custom styling
- Form submission buttons
- Social media and sharing buttons
- E-commerce "Add to Cart" / "Buy Now" buttons

## Usage

\`\`\`html
<Button
  text="Click Me"
  backgroundColor="#3b82f6"
  color="white"
  padding="12px 24px"
  borderRadius="8px"
/>
\`\`\`
        `}}},argTypes:{text:{description:"**Button Text** -- The text to display on the button",control:"text"},backgroundColor:{description:"**Background Color** -- Button background color",control:"color"},color:{description:"**Text Color** -- Button text color",control:"color"},fontSize:{description:'**Font Size** -- Text size (e.g., "16px")',control:"text"},borderRadius:{description:'**Border Radius** -- Corner rounding (e.g., "8px")',control:"text"},padding:{description:'**Padding** -- Internal spacing (e.g., "12px 24px")',control:"text"},mode:{control:{type:"select"},options:["web","email","document"],description:"**Rendering Mode** -- Controls output format and optimizations",table:{defaultValue:{summary:"web"}}}},tags:["autodocs"]},t={render:()=>({components:{Button:o},template:'<Button text="Click Me" />'}),parameters:{docs:{description:{story:`
**Simplest Usage -- Default Button**

Just pass your button text via the \`text\` prop:

\`\`\`html
<Button text="Click Me" />
\`\`\`

Perfect for:
- Quick prototyping
- Simple buttons with default styling
- When you just need a basic button
        `}}}},n={render:()=>({components:{Button:o},template:`
      <Button
        text="Get Started"
        backgroundColor="#3b82f6"
        color="#ffffff"
        padding="14px 28px"
        borderRadius="8px"
        fontSize="16px"
      />
    `}),parameters:{docs:{description:{story:`
**Semantic Props (Recommended!)**

Use semantic styling props for a clean, readable API:

\`\`\`html
<Button
  text="Get Started"
  backgroundColor="#3b82f6"
  color="#ffffff"
  padding="14px 28px"
  borderRadius="8px"
  fontSize="16px"
/>
\`\`\`

Available semantic props:
- \`backgroundColor\`, \`color\`: Button colors
- \`padding\`: Internal spacing (e.g., "12px 24px")
- \`borderRadius\`: Corner rounding (e.g., "8px")
- \`fontSize\`: Text size (e.g., "16px")
        `}}}},e={render:()=>({components:{Button:o},template:`
      <Button
        text="Visit Our Website"
        backgroundColor="#10b981"
        color="#ffffff"
        padding="16px 32px"
        borderRadius="12px"
        fontSize="18px"
      />
    `}),parameters:{docs:{description:{story:`
**Navigation Button**

Styled button for navigation and call-to-action use cases:

\`\`\`html
<Button
  text="Visit Our Website"
  backgroundColor="#10b981"
  color="#ffffff"
  padding="16px 32px"
  borderRadius="12px"
/>
\`\`\`
        `}}}},r={render:()=>({components:{Button:o},template:`
      <Button
        text="Tap to Continue"
        backgroundColor="#6366f1"
        color="#ffffff"
        padding="16px 40px"
        borderRadius="10px"
        fontSize="18px"
        fontWeight="700"
      />
    `}),parameters:{docs:{description:{story:`
**Mobile-Optimized Button**

A large, tappable button designed for mobile devices with generous padding and readable font size.
        `}}}},a={render:()=>({components:{Button:o},template:`
      <Button
        text="View in Browser"
        backgroundColor="#7c3aed"
        color="#ffffff"
        padding="14px 24px"
        borderRadius="6px"
        fontSize="16px"
        mode="email"
      />
    `}),parameters:{docs:{description:{story:`
**Email-Safe Button**

Optimized for email clients with \`mode="email"\`:

\`\`\`html
<Button
  text="View in Browser"
  backgroundColor="#7c3aed"
  color="#ffffff"
  mode="email"
/>
\`\`\`

Uses conservative styling that renders consistently across all email platforms.
        `}}}},i={render:()=>({components:{Button:o},template:`
      <div style="display: flex; flex-direction: column; gap: 32px; padding: 20px; background: #f8fafc;">
        <div>
          <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 20px; font-weight: 700;">
            Call-to-Action Buttons
          </h3>
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            <Button text="Get Started Free" backgroundColor="#2563eb" color="#ffffff" padding="14px 28px" borderRadius="8px" fontSize="16px" />
            <Button text="Start Free Trial" backgroundColor="#059669" color="#ffffff" padding="14px 28px" borderRadius="8px" fontSize="16px" />
            <Button text="Join Premium" backgroundColor="#7c3aed" color="#ffffff" padding="14px 28px" borderRadius="8px" fontSize="16px" />
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 20px; font-weight: 700;">
            Secondary Buttons
          </h3>
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            <Button text="Learn More" backgroundColor="#f1f5f9" color="#475569" padding="12px 24px" borderRadius="8px" fontSize="14px" />
            <Button text="View Docs" backgroundColor="#ffffff" color="#3b82f6" padding="12px 24px" borderRadius="8px" fontSize="14px" borderWidth="1px" borderStyle="solid" borderColor="#3b82f6" />
            <Button text="Cancel" backgroundColor="#ffffff" color="#6b7280" padding="12px 24px" borderRadius="8px" fontSize="14px" borderWidth="1px" borderStyle="solid" borderColor="#d1d5db" />
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 20px; font-weight: 700;">
            Creative Styles
          </h3>
          <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">
            <Button text="Gradient Magic" backgroundColor="#8b5cf6" color="#ffffff" padding="16px 32px" borderRadius="16px" fontSize="16px" />
            <Button text="Rounded Pill" backgroundColor="#f59e0b" color="#ffffff" padding="12px 28px" borderRadius="50px" fontSize="16px" />
            <Button text="Sharp Edge" backgroundColor="#ef4444" color="#ffffff" padding="12px 24px" borderRadius="0px" fontSize="16px" />
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 20px; font-weight: 700;">
            Email-Safe Buttons
          </h3>
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            <Button text="View Email" backgroundColor="#3b82f6" color="#ffffff" padding="14px 24px" borderRadius="6px" fontSize="16px" mode="email" />
            <Button text="Unsubscribe" backgroundColor="#ffffff" color="#6b7280" padding="10px 20px" borderRadius="4px" fontSize="14px" mode="email" />
          </div>
        </div>
      </div>
    `}),parameters:{docs:{description:{story:"**Complete Button Gallery** -- Showcase of various button styles and use cases using semantic props."}}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Button
    },
    template: \`<Button text="Click Me" />\`
  }),
  parameters: {
    docs: {
      description: {
        story: \`
**Simplest Usage -- Default Button**

Just pass your button text via the \\\`text\\\` prop:

\\\`\\\`\\\`html
<Button text="Click Me" />
\\\`\\\`\\\`

Perfect for:
- Quick prototyping
- Simple buttons with default styling
- When you just need a basic button
        \`
      }
    }
  }
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Button
    },
    template: \`
      <Button
        text="Get Started"
        backgroundColor="#3b82f6"
        color="#ffffff"
        padding="14px 28px"
        borderRadius="8px"
        fontSize="16px"
      />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: \`
**Semantic Props (Recommended!)**

Use semantic styling props for a clean, readable API:

\\\`\\\`\\\`html
<Button
  text="Get Started"
  backgroundColor="#3b82f6"
  color="#ffffff"
  padding="14px 28px"
  borderRadius="8px"
  fontSize="16px"
/>
\\\`\\\`\\\`

Available semantic props:
- \\\`backgroundColor\\\`, \\\`color\\\`: Button colors
- \\\`padding\\\`: Internal spacing (e.g., "12px 24px")
- \\\`borderRadius\\\`: Corner rounding (e.g., "8px")
- \\\`fontSize\\\`: Text size (e.g., "16px")
        \`
      }
    }
  }
}`,...n.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Button
    },
    template: \`
      <Button
        text="Visit Our Website"
        backgroundColor="#10b981"
        color="#ffffff"
        padding="16px 32px"
        borderRadius="12px"
        fontSize="18px"
      />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: \`
**Navigation Button**

Styled button for navigation and call-to-action use cases:

\\\`\\\`\\\`html
<Button
  text="Visit Our Website"
  backgroundColor="#10b981"
  color="#ffffff"
  padding="16px 32px"
  borderRadius="12px"
/>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...e.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Button
    },
    template: \`
      <Button
        text="Tap to Continue"
        backgroundColor="#6366f1"
        color="#ffffff"
        padding="16px 40px"
        borderRadius="10px"
        fontSize="18px"
        fontWeight="700"
      />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: \`
**Mobile-Optimized Button**

A large, tappable button designed for mobile devices with generous padding and readable font size.
        \`
      }
    }
  }
}`,...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Button
    },
    template: \`
      <Button
        text="View in Browser"
        backgroundColor="#7c3aed"
        color="#ffffff"
        padding="14px 24px"
        borderRadius="6px"
        fontSize="16px"
        mode="email"
      />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: \`
**Email-Safe Button**

Optimized for email clients with \\\`mode="email"\\\`:

\\\`\\\`\\\`html
<Button
  text="View in Browser"
  backgroundColor="#7c3aed"
  color="#ffffff"
  mode="email"
/>
\\\`\\\`\\\`

Uses conservative styling that renders consistently across all email platforms.
        \`
      }
    }
  }
}`,...a.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Button
    },
    template: \`
      <div style="display: flex; flex-direction: column; gap: 32px; padding: 20px; background: #f8fafc;">
        <div>
          <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 20px; font-weight: 700;">
            Call-to-Action Buttons
          </h3>
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            <Button text="Get Started Free" backgroundColor="#2563eb" color="#ffffff" padding="14px 28px" borderRadius="8px" fontSize="16px" />
            <Button text="Start Free Trial" backgroundColor="#059669" color="#ffffff" padding="14px 28px" borderRadius="8px" fontSize="16px" />
            <Button text="Join Premium" backgroundColor="#7c3aed" color="#ffffff" padding="14px 28px" borderRadius="8px" fontSize="16px" />
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 20px; font-weight: 700;">
            Secondary Buttons
          </h3>
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            <Button text="Learn More" backgroundColor="#f1f5f9" color="#475569" padding="12px 24px" borderRadius="8px" fontSize="14px" />
            <Button text="View Docs" backgroundColor="#ffffff" color="#3b82f6" padding="12px 24px" borderRadius="8px" fontSize="14px" borderWidth="1px" borderStyle="solid" borderColor="#3b82f6" />
            <Button text="Cancel" backgroundColor="#ffffff" color="#6b7280" padding="12px 24px" borderRadius="8px" fontSize="14px" borderWidth="1px" borderStyle="solid" borderColor="#d1d5db" />
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 20px; font-weight: 700;">
            Creative Styles
          </h3>
          <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">
            <Button text="Gradient Magic" backgroundColor="#8b5cf6" color="#ffffff" padding="16px 32px" borderRadius="16px" fontSize="16px" />
            <Button text="Rounded Pill" backgroundColor="#f59e0b" color="#ffffff" padding="12px 28px" borderRadius="50px" fontSize="16px" />
            <Button text="Sharp Edge" backgroundColor="#ef4444" color="#ffffff" padding="12px 24px" borderRadius="0px" fontSize="16px" />
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 20px; font-weight: 700;">
            Email-Safe Buttons
          </h3>
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            <Button text="View Email" backgroundColor="#3b82f6" color="#ffffff" padding="14px 24px" borderRadius="6px" fontSize="16px" mode="email" />
            <Button text="Unsubscribe" backgroundColor="#ffffff" color="#6b7280" padding="10px 20px" borderRadius="4px" fontSize="14px" mode="email" />
          </div>
        </div>
      </div>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Complete Button Gallery** -- Showcase of various button styles and use cases using semantic props.'
      }
    }
  }
}`,...i.parameters?.docs?.source}}};const x=["SimpleButton","WithSemanticProps","WithLinkAndHover","MobileButton","EmailSafeButton","ButtonShowcase"];export{i as ButtonShowcase,a as EmailSafeButton,r as MobileButton,t as SimpleButton,e as WithLinkAndHover,n as WithSemanticProps,x as __namedExportsOrder,c as default};
