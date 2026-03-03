import{c as h,o as b,m as d}from"./create-component-D1merdym.js";import"./iframe-BMyXcb8A.js";import"./preload-helper-PPVm8Dsz.js";import"./index-8x7ipbY-.js";const f={iconType:"circle",icons:[]},a={align:"center",iconSize:32,spacing:10,icons:f},o=h({name:"Social",defaultValues:a,propMapper:e=>{const{icons:y,iconType:p,...g}=e;if(Array.isArray(y)){const n=y.map(S=>({name:S.name,url:S.url})),u=d(g,a,"Social");return u.icons={iconType:p??u.icons?.iconType??"circle",icons:n},u}if(p!==void 0){const n=d(g,a,"Social");return n.icons={...f,...n.icons,iconType:p},n}return d(e,a,"Social")},exporters:b}),T={title:"Components/Social",component:o,parameters:{layout:"centered",docs:{description:{component:`
# Social Component

Social media links and sharing buttons with **platform optimization**.

## Key Features
- **Social Platforms**: Facebook, Twitter, Instagram, LinkedIn, etc.
- **Custom Icons**: Platform icons, custom styling, colors
- **Email-Safe**: Social links optimized for email clients
- **Smart Links**: Profile links, sharing URLs, custom actions
- **Mobile-Optimized**: Touch-friendly sizing and spacing

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
}`}}},mode:{control:{type:"select"},options:["web","email","document"],description:"**Rendering Mode** - Controls output format and social optimizations",table:{defaultValue:{summary:"web"},type:{summary:"RenderMode"}}}},tags:["autodocs"]},c={render:()=>({components:{Social:o},setup(){return{icons:[{name:"Facebook",url:"https://facebook.com/unlayer"},{name:"X",url:"https://x.com/unlayer"},{name:"Instagram",url:"https://instagram.com/unlayer"}]}},template:`
      <Social
        :icons="icons"
        iconType="circle"
        align="center"
        :spacing="8"
        :iconSize="32"
        mode="web"
      />
    `}),parameters:{docs:{description:{story:`**Shorthand API** — pass \`icons\` as a simple array of \`{ name, url }\` objects and \`iconType\` as a flat prop.

\`\`\`html
<Social
  :icons="[
    { name: 'Facebook', url: 'https://facebook.com/unlayer' },
    { name: 'X', url: 'https://x.com/unlayer' },
  ]"
  iconType="circle"
/>
\`\`\``}}}},s={render:()=>({components:{Social:o},setup(){return{values:{icons:{iconType:"circle",icons:[{name:"Facebook",url:"https://facebook.com/unlayer"},{name:"X",url:"https://x.com/unlayer"},{name:"Instagram",url:"https://instagram.com/unlayer"}]},align:"center",spacing:8,iconSize:32,containerPadding:"20px"}}},template:`
      <Social :values="values" mode="web" />
    `}),parameters:{docs:{description:{story:"**Full Control** -- use the `values` prop for complete exporter-format control."}}}},t={render:()=>({components:{Social:o},setup(){return{values:{icons:{iconType:"circle",icons:[{name:"Facebook",url:"https://facebook.com/company"},{name:"X",url:"https://x.com/company"},{name:"Instagram",url:"https://instagram.com/company"},{name:"LinkedIn",url:"https://linkedin.com/company"},{name:"YouTube",url:"https://youtube.com/company"}]},align:"center",spacing:12,iconSize:40,containerPadding:"30px"}}},template:`
      <Social :values="values" mode="web" />
    `}),parameters:{docs:{description:{story:"A full social media bar with all major platforms displayed as circle icons with generous spacing."}}}},r={render:()=>({components:{Social:o},setup(){return{values:{icons:{iconType:"circle",icons:[{name:"Facebook",url:"https://facebook.com/company"},{name:"X",url:"https://x.com/company"},{name:"YouTube",url:"https://youtube.com/company"},{name:"Instagram",url:"https://instagram.com/company"}]},align:"center",spacing:15,iconSize:40,containerPadding:"25px"}}},template:`
      <Social :values="values" mode="web" />
    `}),parameters:{docs:{description:{story:"Colorful circle social icons with wide spacing, ideal for vibrant email footers and social sections."}}}},i={render:()=>({components:{Social:o},setup(){return{values:{icons:{iconType:"rounded",icons:[{name:"Facebook",url:"https://facebook.com/company"},{name:"X",url:"https://x.com/company"},{name:"YouTube",url:"https://youtube.com/company"},{name:"Instagram",url:"https://instagram.com/company"}]},align:"center",spacing:15,iconSize:40,containerPadding:"25px"}}},template:`
      <Social :values="values" mode="web" />
    `}),parameters:{docs:{description:{story:"Rounded square icon style -- a softer alternative to fully circular or squared icons."}}}},l={render:()=>({components:{Social:o},setup(){return{values:{icons:{iconType:"squared",icons:[{name:"Facebook",url:"https://facebook.com/company"},{name:"X",url:"https://x.com/company"},{name:"LinkedIn",url:"https://linkedin.com/company"},{name:"Instagram",url:"https://instagram.com/company"}]},align:"center",spacing:12,iconSize:36,containerPadding:"20px"}}},template:`
      <Social :values="values" mode="web" />
    `}),parameters:{docs:{description:{story:"Squared icon style -- sharp corners for a modern, geometric look."}}}},m={render:()=>({components:{Social:o},setup(){return{values:{icons:{iconType:"circle",icons:[{name:"Facebook",url:"https://facebook.com/company"},{name:"X",url:"https://x.com/company"},{name:"Instagram",url:"https://instagram.com/company"},{name:"Email",url:"contact@company.com"}]},align:"center",spacing:8,iconSize:28,containerPadding:"16px"}}},template:`
      <Social :values="values" mode="email" />
    `}),parameters:{docs:{description:{story:"Email-safe social icons with compact sizing optimized for email footers. Includes an email contact icon."}}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Social
    },
    setup() {
      const icons = [{
        name: 'Facebook',
        url: 'https://facebook.com/unlayer'
      }, {
        name: 'X',
        url: 'https://x.com/unlayer'
      }, {
        name: 'Instagram',
        url: 'https://instagram.com/unlayer'
      }];
      return {
        icons
      };
    },
    template: \`
      <Social
        :icons="icons"
        iconType="circle"
        align="center"
        :spacing="8"
        :iconSize="32"
        mode="web"
      />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: \`**Shorthand API** — pass \\\`icons\\\` as a simple array of \\\`{ name, url }\\\` objects and \\\`iconType\\\` as a flat prop.

\\\`\\\`\\\`html
<Social
  :icons="[
    { name: 'Facebook', url: 'https://facebook.com/unlayer' },
    { name: 'X', url: 'https://x.com/unlayer' },
  ]"
  iconType="circle"
/>
\\\`\\\`\\\`\`
      }
    }
  }
}`,...c.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Social
    },
    setup() {
      const values = {
        icons: {
          iconType: 'circle',
          icons: [{
            name: 'Facebook',
            url: 'https://facebook.com/unlayer'
          }, {
            name: 'X',
            url: 'https://x.com/unlayer'
          }, {
            name: 'Instagram',
            url: 'https://instagram.com/unlayer'
          }]
        },
        align: 'center',
        spacing: 8,
        iconSize: 32,
        containerPadding: '20px'
      };
      return {
        values
      };
    },
    template: \`
      <Social :values="values" mode="web" />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Full Control** -- use the \`values\` prop for complete exporter-format control.'
      }
    }
  }
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Social
    },
    setup() {
      const values = {
        icons: {
          iconType: 'circle',
          icons: [{
            name: 'Facebook',
            url: 'https://facebook.com/company'
          }, {
            name: 'X',
            url: 'https://x.com/company'
          }, {
            name: 'Instagram',
            url: 'https://instagram.com/company'
          }, {
            name: 'LinkedIn',
            url: 'https://linkedin.com/company'
          }, {
            name: 'YouTube',
            url: 'https://youtube.com/company'
          }]
        },
        align: 'center',
        spacing: 12,
        iconSize: 40,
        containerPadding: '30px'
      };
      return {
        values
      };
    },
    template: \`
      <Social :values="values" mode="web" />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: 'A full social media bar with all major platforms displayed as circle icons with generous spacing.'
      }
    }
  }
}`,...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Social
    },
    setup() {
      const values = {
        icons: {
          iconType: 'circle',
          icons: [{
            name: 'Facebook',
            url: 'https://facebook.com/company'
          }, {
            name: 'X',
            url: 'https://x.com/company'
          }, {
            name: 'YouTube',
            url: 'https://youtube.com/company'
          }, {
            name: 'Instagram',
            url: 'https://instagram.com/company'
          }]
        },
        align: 'center',
        spacing: 15,
        iconSize: 40,
        containerPadding: '25px'
      };
      return {
        values
      };
    },
    template: \`
      <Social :values="values" mode="web" />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: 'Colorful circle social icons with wide spacing, ideal for vibrant email footers and social sections.'
      }
    }
  }
}`,...r.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Social
    },
    setup() {
      const values = {
        icons: {
          iconType: 'rounded',
          icons: [{
            name: 'Facebook',
            url: 'https://facebook.com/company'
          }, {
            name: 'X',
            url: 'https://x.com/company'
          }, {
            name: 'YouTube',
            url: 'https://youtube.com/company'
          }, {
            name: 'Instagram',
            url: 'https://instagram.com/company'
          }]
        },
        align: 'center',
        spacing: 15,
        iconSize: 40,
        containerPadding: '25px'
      };
      return {
        values
      };
    },
    template: \`
      <Social :values="values" mode="web" />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: 'Rounded square icon style -- a softer alternative to fully circular or squared icons.'
      }
    }
  }
}`,...i.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Social
    },
    setup() {
      const values = {
        icons: {
          iconType: 'squared',
          icons: [{
            name: 'Facebook',
            url: 'https://facebook.com/company'
          }, {
            name: 'X',
            url: 'https://x.com/company'
          }, {
            name: 'LinkedIn',
            url: 'https://linkedin.com/company'
          }, {
            name: 'Instagram',
            url: 'https://instagram.com/company'
          }]
        },
        align: 'center',
        spacing: 12,
        iconSize: 36,
        containerPadding: '20px'
      };
      return {
        values
      };
    },
    template: \`
      <Social :values="values" mode="web" />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: 'Squared icon style -- sharp corners for a modern, geometric look.'
      }
    }
  }
}`,...l.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Social
    },
    setup() {
      const values = {
        icons: {
          iconType: 'circle',
          icons: [{
            name: 'Facebook',
            url: 'https://facebook.com/company'
          }, {
            name: 'X',
            url: 'https://x.com/company'
          }, {
            name: 'Instagram',
            url: 'https://instagram.com/company'
          }, {
            name: 'Email',
            url: 'contact@company.com'
          }]
        },
        align: 'center',
        spacing: 8,
        iconSize: 28,
        containerPadding: '16px'
      };
      return {
        values
      };
    },
    template: \`
      <Social :values="values" mode="email" />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: 'Email-safe social icons with compact sizing optimized for email footers. Includes an email contact icon.'
      }
    }
  }
}`,...m.parameters?.docs?.source}}};const w=["Default","FullValuesAPI","SocialMediaBar","ColorfulSocialIcons","RoundedSocialIcons","SquaredSocialIcons","EmailSocialIcons"];export{r as ColorfulSocialIcons,c as Default,m as EmailSocialIcons,s as FullValuesAPI,i as RoundedSocialIcons,t as SocialMediaBar,l as SquaredSocialIcons,w as __namedExportsOrder,T as default};
