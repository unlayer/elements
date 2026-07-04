import{S as r}from"./Social-BmkXgvIy.js";import"./create-component-C6knhKnS.js";import"./iframe-VMmuojDn.js";import"./preload-helper-PPVm8Dsz.js";import"./jsx-runtime-DVcQg-IR.js";const u={title:"Components/Social",component:r,parameters:{layout:"centered",docs:{description:{component:`
Social media links and sharing buttons with **platform optimization**.

## Key Features
- 📱 **Social Platforms**: Facebook, Twitter, Instagram, LinkedIn, etc.
- 🎨 **Custom Icons**: Platform icons, custom styling, colors
- 📧 **Email-Safe**: Social links optimized for email clients
- 🔗 **Smart Links**: Profile links, sharing URLs, custom actions
- 📱 **Mobile-Optimized**: Touch-friendly sizing and spacing

## Usage

\`\`\`tsx
<Social
  icons={[
    { name: "Facebook", url: "https://facebook.com/unlayer" },
    { name: "X", url: "https://x.com/unlayer" },
  ]}
  iconType="circle"
  align="center"
  spacing={8}
  iconSize={32}
/>
\`\`\`

Available props: \`icons\`, \`iconType\`, \`align\`, \`spacing\`, \`iconSize\`, \`containerPadding\`

## Common Use Cases
- Social media links in email footers
- Follow buttons and social proof
- Share buttons for content
- Social media profiles and contact info
- Newsletter social sections
        `}}},argTypes:{mode:{control:{type:"select"},options:["web","email","document"],description:"**Rendering Mode** - Controls output format and social optimizations",table:{defaultValue:{summary:"web"},type:{summary:"RenderMode"}}}},tags:["autodocs"]},n={args:{icons:[{name:"Facebook",url:"https://facebook.com/unlayer"},{name:"X",url:"https://x.com/unlayer"},{name:"Instagram",url:"https://instagram.com/unlayer"}],iconType:"circle",align:"center",spacing:8,iconSize:32,mode:"web"},parameters:{docs:{description:{story:'**Default Social Icons** — pass `icons` as a simple array of `{ name, url }` objects.\n\n```tsx\n<Social\n  icons={[\n    { name: "Facebook", url: "https://facebook.com/unlayer" },\n    { name: "X", url: "https://x.com/unlayer" },\n  ]}\n  iconType="circle"\n/>\n```'}}}},o={args:{icons:[{name:"Facebook",url:"https://facebook.com/company"},{name:"X",url:"https://x.com/company"},{name:"Instagram",url:"https://instagram.com/company"},{name:"LinkedIn",url:"https://linkedin.com/company"},{name:"YouTube",url:"https://youtube.com/company"}],iconType:"circle",align:"center",spacing:12,iconSize:40,containerPadding:"30px",mode:"web"}},a={args:{icons:[{name:"Facebook",url:"https://facebook.com/company"},{name:"X",url:"https://x.com/company"},{name:"YouTube",url:"https://youtube.com/company"},{name:"Instagram",url:"https://instagram.com/company"}],iconType:"circle",align:"center",spacing:15,iconSize:40,containerPadding:"25px",mode:"web"}},e={args:{icons:[{name:"Facebook",url:"https://facebook.com/company"},{name:"X",url:"https://x.com/company"},{name:"YouTube",url:"https://youtube.com/company"},{name:"Instagram",url:"https://instagram.com/company"}],iconType:"rounded",align:"center",spacing:15,iconSize:40,containerPadding:"25px",mode:"web"}},c={args:{icons:[{name:"Facebook",url:"https://facebook.com/company"},{name:"X",url:"https://x.com/company"},{name:"LinkedIn",url:"https://linkedin.com/company"},{name:"Instagram",url:"https://instagram.com/company"}],iconType:"squared",align:"center",spacing:12,iconSize:36,containerPadding:"20px",mode:"web"}},t={args:{icons:[{name:"Facebook",url:"https://facebook.com/company"},{name:"X",url:"https://x.com/company"},{name:"Instagram",url:"https://instagram.com/company"},{name:"Email",url:"contact@company.com"}],iconType:"circle",align:"center",spacing:8,iconSize:28,containerPadding:"16px",mode:"email"}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    icons: [{
      name: "Facebook",
      url: "https://facebook.com/unlayer"
    }, {
      name: "X",
      url: "https://x.com/unlayer"
    }, {
      name: "Instagram",
      url: "https://instagram.com/unlayer"
    }],
    iconType: "circle",
    align: "center",
    spacing: 8,
    iconSize: 32,
    mode: "web"
  },
  parameters: {
    docs: {
      description: {
        story: \`**Default Social Icons** — pass \\\`icons\\\` as a simple array of \\\`{ name, url }\\\` objects.

\\\`\\\`\\\`tsx
<Social
  icons={[
    { name: "Facebook", url: "https://facebook.com/unlayer" },
    { name: "X", url: "https://x.com/unlayer" },
  ]}
  iconType="circle"
/>
\\\`\\\`\\\`\`
      }
    }
  }
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    icons: [{
      name: "Facebook",
      url: "https://facebook.com/company"
    }, {
      name: "X",
      url: "https://x.com/company"
    }, {
      name: "Instagram",
      url: "https://instagram.com/company"
    }, {
      name: "LinkedIn",
      url: "https://linkedin.com/company"
    }, {
      name: "YouTube",
      url: "https://youtube.com/company"
    }],
    iconType: "circle",
    align: "center",
    spacing: 12,
    iconSize: 40,
    containerPadding: "30px",
    mode: "web"
  }
}`,...o.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    icons: [{
      name: "Facebook",
      url: "https://facebook.com/company"
    }, {
      name: "X",
      url: "https://x.com/company"
    }, {
      name: "YouTube",
      url: "https://youtube.com/company"
    }, {
      name: "Instagram",
      url: "https://instagram.com/company"
    }],
    iconType: "circle",
    align: "center",
    spacing: 15,
    iconSize: 40,
    containerPadding: "25px",
    mode: "web"
  }
}`,...a.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    icons: [{
      name: "Facebook",
      url: "https://facebook.com/company"
    }, {
      name: "X",
      url: "https://x.com/company"
    }, {
      name: "YouTube",
      url: "https://youtube.com/company"
    }, {
      name: "Instagram",
      url: "https://instagram.com/company"
    }],
    iconType: "rounded",
    align: "center",
    spacing: 15,
    iconSize: 40,
    containerPadding: "25px",
    mode: "web"
  }
}`,...e.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    icons: [{
      name: "Facebook",
      url: "https://facebook.com/company"
    }, {
      name: "X",
      url: "https://x.com/company"
    }, {
      name: "LinkedIn",
      url: "https://linkedin.com/company"
    }, {
      name: "Instagram",
      url: "https://instagram.com/company"
    }],
    iconType: "squared",
    align: "center",
    spacing: 12,
    iconSize: 36,
    containerPadding: "20px",
    mode: "web"
  }
}`,...c.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    icons: [{
      name: "Facebook",
      url: "https://facebook.com/company"
    }, {
      name: "X",
      url: "https://x.com/company"
    }, {
      name: "Instagram",
      url: "https://instagram.com/company"
    }, {
      name: "Email",
      url: "contact@company.com"
    }],
    iconType: "circle",
    align: "center",
    spacing: 8,
    iconSize: 28,
    containerPadding: "16px",
    mode: "email"
  }
}`,...t.parameters?.docs?.source}}};const d=["Default","SocialMediaBar","ColorfulSocialIcons","RoundedSocialIcons","SquaredSocialIcons","EmailSocialIcons"];export{a as ColorfulSocialIcons,n as Default,t as EmailSocialIcons,e as RoundedSocialIcons,o as SocialMediaBar,c as SquaredSocialIcons,d as __namedExportsOrder,u as default};
