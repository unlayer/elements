import{I as e}from"./Image-1zjiVWTH.js";import"./create-component-D1merdym.js";import"./iframe-BMyXcb8A.js";import"./preload-helper-PPVm8Dsz.js";import"./index-8x7ipbY-.js";const m={title:"Components/Image",component:e,parameters:{layout:"centered",docs:{description:{component:`
# Image Component

Responsive image rendering with **automatic optimization** and **flexible styling options**.

## Key Features
- **Responsive**: Automatic sizing and mobile optimization
- **Flexible Styling**: Borders, shadows, filters, and effects
- **Email-Safe**: Conservative styling for email clients
- **Alt Text**: Accessibility support with alt text

## Usage

\`\`\`html
<!-- Shorthand API -->
<Image
  src="https://example.com/photo.jpg"
  alt="A beautiful photo"
/>
\`\`\`
        `}}},argTypes:{src:{description:"**Image Source** -- URL string",control:"text"},alt:{description:"**Alt Text** -- Accessibility text",control:"text"},mode:{control:{type:"select"},options:["web","email","document"],description:"**Rendering Mode**"}},tags:["autodocs"]},t={render:()=>({components:{Image:e},template:`
      <Image
        src="https://cdn.tools.unlayer.com/image/placeholder.png"
        alt="Placeholder image"
      />
    `}),parameters:{docs:{description:{story:'\n**Shorthand API** -- pass `src` as a string and `alt` for accessibility.\n\n```html\n<Image src="https://example.com/photo.jpg" alt="A photo" />\n```\n        '}}}},a={render:()=>({components:{Image:e},template:`
      <Image
        src="https://placehold.co/800x300/3b82f6/ffffff?text=Hero+Banner"
        alt="Hero banner image"
      />
    `}),parameters:{docs:{description:{story:"**Hero Image** -- Large banner style image for hero sections."}}}},o={render:()=>({components:{Image:e},template:`
      <Image
        src="https://placehold.co/400x400/f9fafb/374151?text=Product"
        alt="Product image"
      />
    `}),parameters:{docs:{description:{story:"**Product Image** -- E-commerce style product photo."}}}},n={render:()=>({components:{Image:e},template:`
      <Image
        src="https://placehold.co/600x300/e5e7eb/374151?text=Email+Image"
        alt="Email newsletter image"
        mode="email"
      />
    `}),parameters:{docs:{description:{story:'**Email-Safe Image** -- Rendered with `mode="email"` for email client compatibility.'}}}},r={render:()=>({components:{Image:e},template:`
      <div style="display: flex; flex-direction: column; gap: 40px; padding: 20px; background: #f8fafc;">
        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 700;">Hero & Banner Images</h3>
          <Image src="https://placehold.co/800x300/6366f1/ffffff?text=Hero+Banner" alt="Hero banner" />
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 700;">Avatar Images</h3>
          <div style="display: flex; gap: 24px; justify-content: center; flex-wrap: wrap;">
            <Image src="https://placehold.co/100x100/3b82f6/ffffff?text=AC" alt="Avatar 1" />
            <Image src="https://placehold.co/100x100/10b981/ffffff?text=BK" alt="Avatar 2" />
            <Image src="https://placehold.co/100x100/f59e0b/ffffff?text=CL" alt="Avatar 3" />
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 700;">Product Images</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
            <Image src="https://placehold.co/200x200/f9fafb/374151?text=Headphones" alt="Headphones" />
            <Image src="https://placehold.co/200x200/f9fafb/374151?text=Sneakers" alt="Sneakers" />
            <Image src="https://placehold.co/200x200/f9fafb/374151?text=Watch" alt="Watch" />
          </div>
        </div>
      </div>
    `}),parameters:{docs:{description:{story:"**Image Gallery** -- Showcase of various image styles and use cases."}}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Image
    },
    template: \`
      <Image
        src="https://cdn.tools.unlayer.com/image/placeholder.png"
        alt="Placeholder image"
      />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: \`
**Shorthand API** -- pass \\\`src\\\` as a string and \\\`alt\\\` for accessibility.

\\\`\\\`\\\`html
<Image src="https://example.com/photo.jpg" alt="A photo" />
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...t.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Image
    },
    template: \`
      <Image
        src="https://placehold.co/800x300/3b82f6/ffffff?text=Hero+Banner"
        alt="Hero banner image"
      />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Hero Image** -- Large banner style image for hero sections.'
      }
    }
  }
}`,...a.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Image
    },
    template: \`
      <Image
        src="https://placehold.co/400x400/f9fafb/374151?text=Product"
        alt="Product image"
      />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Product Image** -- E-commerce style product photo.'
      }
    }
  }
}`,...o.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Image
    },
    template: \`
      <Image
        src="https://placehold.co/600x300/e5e7eb/374151?text=Email+Image"
        alt="Email newsletter image"
        mode="email"
      />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Email-Safe Image** -- Rendered with \`mode="email"\` for email client compatibility.'
      }
    }
  }
}`,...n.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Image
    },
    template: \`
      <div style="display: flex; flex-direction: column; gap: 40px; padding: 20px; background: #f8fafc;">
        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 700;">Hero & Banner Images</h3>
          <Image src="https://placehold.co/800x300/6366f1/ffffff?text=Hero+Banner" alt="Hero banner" />
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 700;">Avatar Images</h3>
          <div style="display: flex; gap: 24px; justify-content: center; flex-wrap: wrap;">
            <Image src="https://placehold.co/100x100/3b82f6/ffffff?text=AC" alt="Avatar 1" />
            <Image src="https://placehold.co/100x100/10b981/ffffff?text=BK" alt="Avatar 2" />
            <Image src="https://placehold.co/100x100/f59e0b/ffffff?text=CL" alt="Avatar 3" />
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 700;">Product Images</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
            <Image src="https://placehold.co/200x200/f9fafb/374151?text=Headphones" alt="Headphones" />
            <Image src="https://placehold.co/200x200/f9fafb/374151?text=Sneakers" alt="Sneakers" />
            <Image src="https://placehold.co/200x200/f9fafb/374151?text=Watch" alt="Watch" />
          </div>
        </div>
      </div>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Image Gallery** -- Showcase of various image styles and use cases.'
      }
    }
  }
}`,...r.parameters?.docs?.source}}};const d=["Default","HeroImage","ProductImage","EmailImage","ImageShowcase"];export{t as Default,n as EmailImage,a as HeroImage,r as ImageShowcase,o as ProductImage,d as __namedExportsOrder,m as default};
