import{c as h,o as S,m as p}from"./create-component-BWEBAc00.js";import"./compat.module-fI-V5Ght.js";import"./iframe-BgLncab-.js";import"./preload-helper-PPVm8Dsz.js";const b={iconType:"circle",icons:[]},o={align:"center",iconSize:32,spacing:10,icons:b},f=h({name:"Social",defaultValues:o,propMapper:u=>{const{icons:d,iconType:m,...y}=u;if(Array.isArray(d)){const n=d.map(g=>({name:g.name,url:g.url})),l=p(y,o,"Social");return l.icons={iconType:m??l.icons?.iconType??"circle",icons:n},l}if(m!==void 0){const n=p(y,o,"Social");return n.icons={...b,...n.icons,iconType:m},n}return p(u,o,"Social")},displayName:"Social",exporters:S}),F={title:"Components/Social",component:f,parameters:{layout:"centered",docs:{description:{component:`
# 📱 Social Component

Social media links and sharing buttons with **platform optimization**.

## Key Features
- 📱 **Social Platforms**: Facebook, Twitter, Instagram, LinkedIn, etc.
- 🎨 **Custom Icons**: Platform icons, custom styling, colors
- 📧 **Email-Safe**: Social links optimized for email clients
- 🔗 **Smart Links**: Profile links, sharing URLs, custom actions
- 📱 **Mobile-Optimized**: Touch-friendly sizing and spacing

## Social Options
- **Platforms**: All major social media platforms
- **Icons**: Platform icons, custom images, SVGs
- **Styling**: Colors, sizes, hover effects, borders
- **Links**: Profile URLs, sharing links, custom actions

## Common Use Cases
- Social media links in email footers
- Follow buttons and social proof
- Share buttons for content
- Social media profiles and contact info
- Newsletter social sections
        `}}},argTypes:{values:{description:"**Social Configuration Object**\n\nMain social options:\n- `platforms`: Social platform configuration\n- `iconStyles`: Icon styling and colors\n- `linkUrls`: Profile and sharing URLs\n- `layout`: Button layout and alignment\n\n*See individual stories below for complete examples*",control:!1,table:{type:{summary:"SocialValues",detail:`{
  // Social-specific properties
  // See component schema for full options
}`}}},mode:{control:{type:"select"},options:["web","email","document"],description:"**Rendering Mode** - Controls output format and social optimizations",table:{defaultValue:{summary:"web"},type:{summary:"RenderMode"}}}},tags:["autodocs"]},a={args:{icons:[{name:"Facebook",url:"https://facebook.com/unlayer"},{name:"X",url:"https://x.com/unlayer"},{name:"Instagram",url:"https://instagram.com/unlayer"}],iconType:"circle",align:"center",spacing:8,iconSize:32,mode:"web"},parameters:{docs:{description:{story:'**Shorthand API** — pass `icons` as a simple array of `{ name, url }` objects and `iconType` as a flat prop.\n\n```tsx\n<Social\n  icons={[\n    { name: "Facebook", url: "https://facebook.com/unlayer" },\n    { name: "X", url: "https://x.com/unlayer" },\n  ]}\n  iconType="circle"\n/>\n```'}}}},e={args:{values:{icons:{iconType:"circle",icons:[{name:"Facebook",url:"https://facebook.com/unlayer"},{name:"X",url:"https://x.com/unlayer"},{name:"Instagram",url:"https://instagram.com/unlayer"}]},align:"center",spacing:8,iconSize:32,containerPadding:"20px"},mode:"web"},parameters:{docs:{description:{story:"**Full Control** — use the `values` prop for complete exporter-format control."}}}},c={args:{values:{icons:{iconType:"circle",icons:[{name:"Facebook",url:"https://facebook.com/company"},{name:"X",url:"https://x.com/company"},{name:"Instagram",url:"https://instagram.com/company"},{name:"LinkedIn",url:"https://linkedin.com/company"},{name:"YouTube",url:"https://youtube.com/company"}]},align:"center",spacing:12,iconSize:40,containerPadding:"30px"},mode:"web"}},s={args:{values:{icons:{iconType:"circle",icons:[{name:"Facebook",url:"https://facebook.com/company"},{name:"X",url:"https://x.com/company"},{name:"YouTube",url:"https://youtube.com/company"},{name:"Instagram",url:"https://instagram.com/company"}]},align:"center",spacing:15,iconSize:40,containerPadding:"25px"},mode:"web"}},r={args:{values:{icons:{iconType:"rounded",icons:[{name:"Facebook",url:"https://facebook.com/company"},{name:"X",url:"https://x.com/company"},{name:"YouTube",url:"https://youtube.com/company"},{name:"Instagram",url:"https://instagram.com/company"}]},align:"center",spacing:15,iconSize:40,containerPadding:"25px"},mode:"web"}},t={args:{values:{icons:{iconType:"squared",icons:[{name:"Facebook",url:"https://facebook.com/company"},{name:"X",url:"https://x.com/company"},{name:"LinkedIn",url:"https://linkedin.com/company"},{name:"Instagram",url:"https://instagram.com/company"}]},align:"center",spacing:12,iconSize:36,containerPadding:"20px"},mode:"web"}},i={args:{values:{icons:{iconType:"circle",icons:[{name:"Facebook",url:"https://facebook.com/company"},{name:"X",url:"https://x.com/company"},{name:"Instagram",url:"https://instagram.com/company"},{name:"Email",url:"contact@company.com"}]},align:"center",spacing:8,iconSize:28,containerPadding:"16px"},mode:"email"}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
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
        story: \`**Shorthand API** — pass \\\`icons\\\` as a simple array of \\\`{ name, url }\\\` objects and \\\`iconType\\\` as a flat prop.

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
}`,...a.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      icons: {
        iconType: "circle",
        icons: [{
          name: "Facebook",
          url: "https://facebook.com/unlayer"
        }, {
          name: "X",
          url: "https://x.com/unlayer"
        }, {
          name: "Instagram",
          url: "https://instagram.com/unlayer"
        }]
      },
      align: "center",
      spacing: 8,
      iconSize: 32,
      containerPadding: "20px"
    },
    mode: "web"
  },
  parameters: {
    docs: {
      description: {
        story: "**Full Control** — use the \`values\` prop for complete exporter-format control."
      }
    }
  }
}`,...e.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      icons: {
        iconType: "circle",
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
        }]
      },
      align: "center",
      spacing: 12,
      iconSize: 40,
      containerPadding: "30px"
    },
    mode: "web"
  }
}`,...c.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      icons: {
        iconType: "circle",
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
        }]
      },
      align: "center",
      spacing: 15,
      iconSize: 40,
      containerPadding: "25px"
    },
    mode: "web"
  }
}`,...s.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      icons: {
        iconType: "rounded",
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
        }]
      },
      align: "center",
      spacing: 15,
      iconSize: 40,
      containerPadding: "25px"
    },
    mode: "web"
  }
}`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      icons: {
        iconType: "squared",
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
        }]
      },
      align: "center",
      spacing: 12,
      iconSize: 36,
      containerPadding: "20px"
    },
    mode: "web"
  }
}`,...t.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      icons: {
        iconType: "circle",
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
        }]
      },
      align: "center",
      spacing: 8,
      iconSize: 28,
      containerPadding: "16px"
    },
    mode: "email"
  }
}`,...i.parameters?.docs?.source}}};const P=["Default","FullValuesAPI","SocialMediaBar","ColorfulSocialIcons","RoundedSocialIcons","SquaredSocialIcons","EmailSocialIcons"];export{s as ColorfulSocialIcons,a as Default,i as EmailSocialIcons,e as FullValuesAPI,r as RoundedSocialIcons,c as SocialMediaBar,t as SquaredSocialIcons,P as __namedExportsOrder,F as default};
