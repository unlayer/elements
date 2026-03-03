import{c as l,J as p,m}from"./create-component-D1merdym.js";import"./iframe-BMyXcb8A.js";import"./preload-helper-PPVm8Dsz.js";import"./index-8x7ipbY-.js";const d={html:"<p>Custom HTML content</p>"},t=l({name:"Html",defaultValues:d,propMapper:e=>m(e,d,"Html"),exporters:p}),u={title:"Components/Html",component:t,parameters:{layout:"centered",docs:{description:{component:`
# Html Component

Custom HTML content with **safe rendering** and **mode-specific output**.

## Key Features
- **Custom HTML**: Raw HTML content insertion
- **Safe Rendering**: Sanitized HTML output
- **Email-Safe**: Conservative HTML for email clients
- **Flexible**: Any HTML markup and styling

## Common Use Cases
- Custom HTML blocks in emails
- Embedded forms and widgets
- Third-party integrations
- Advanced content blocks

## Usage

\`\`\`html
<Html html="<p>Your custom HTML here</p>" />
\`\`\`
        `}}},argTypes:{html:{description:"**HTML Content** -- Raw HTML to render",control:"text"},mode:{control:{type:"select"},options:["web","email","document"],description:"**Rendering Mode**"}},tags:["autodocs"]},i={render:()=>({components:{Html:t},template:"<Html />"}),parameters:{docs:{description:{story:"**Default HTML** -- Renders with schema-driven defaults."}}}},o={render:()=>({components:{Html:t},setup(){return{cardHtml:'<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; border-radius: 16px; color: white; text-align: center; box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3); max-width: 400px; margin: 0 auto;"><h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700;">Custom HTML Card</h2><p style="margin: 0; opacity: 0.9; line-height: 1.6;">This beautiful card is created using custom HTML and CSS with gradient backgrounds and modern styling.</p></div>'}},template:'<Html :html="cardHtml" />'}),parameters:{docs:{description:{story:"**Styled Card** -- A gradient card built with custom HTML and CSS."}}}},r={render:()=>({components:{Html:t},setup(){return{progressHtml:'<div style="max-width: 500px; margin: 0 auto; padding: 20px;"><h3 style="margin: 0 0 24px 0; color: #1f2937; font-size: 20px; font-weight: 600;">Skill Levels</h3><div style="margin-bottom: 20px;"><div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #374151; font-weight: 500;">JavaScript</span><span style="color: #6b7280; font-size: 14px;">90%</span></div><div style="background: #e5e7eb; border-radius: 10px; height: 8px; overflow: hidden;"><div style="background: linear-gradient(90deg, #3b82f6, #1d4ed8); width: 90%; height: 100%; border-radius: 10px;"></div></div></div><div style="margin-bottom: 20px;"><div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #374151; font-weight: 500;">TypeScript</span><span style="color: #6b7280; font-size: 14px;">75%</span></div><div style="background: #e5e7eb; border-radius: 10px; height: 8px; overflow: hidden;"><div style="background: linear-gradient(90deg, #7c3aed, #5b21b6); width: 75%; height: 100%; border-radius: 10px;"></div></div></div><div style="margin-bottom: 20px;"><div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #374151; font-weight: 500;">CSS</span><span style="color: #6b7280; font-size: 14px;">95%</span></div><div style="background: #e5e7eb; border-radius: 10px; height: 8px; overflow: hidden;"><div style="background: linear-gradient(90deg, #f59e0b, #d97706); width: 95%; height: 100%; border-radius: 10px;"></div></div></div></div>'}},template:'<Html :html="progressHtml" />'}),parameters:{docs:{description:{story:"**Progress Bars** -- Animated-style skill level indicators built with custom HTML."}}}},a={render:()=>({components:{Html:t},setup(){return{statsHtml:'<div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 40px 32px; border-radius: 16px; max-width: 800px; margin: 0 auto;"><h3 style="text-align: center; margin: 0 0 32px 0; color: #0f172a; font-size: 24px; font-weight: 700;">Platform Statistics</h3><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 24px;"><div style="text-align: center; padding: 24px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><div style="font-size: 36px; font-weight: 800; color: #3b82f6; margin-bottom: 8px;">1M+</div><div style="color: #6b7280; font-weight: 500; font-size: 14px;">Active Users</div></div><div style="text-align: center; padding: 24px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><div style="font-size: 36px; font-weight: 800; color: #10b981; margin-bottom: 8px;">99.9%</div><div style="color: #6b7280; font-weight: 500; font-size: 14px;">Uptime</div></div><div style="text-align: center; padding: 24px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><div style="font-size: 36px; font-weight: 800; color: #f59e0b; margin-bottom: 8px;">24/7</div><div style="color: #6b7280; font-weight: 500; font-size: 14px;">Support</div></div><div style="text-align: center; padding: 24px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><div style="font-size: 36px; font-weight: 800; color: #7c3aed; margin-bottom: 8px;">50+</div><div style="color: #6b7280; font-weight: 500; font-size: 14px;">Countries</div></div></div></div>'}},template:'<Html :html="statsHtml" />'}),parameters:{docs:{description:{story:"**Statistics Dashboard** -- A stats grid built entirely with custom HTML."}}}},s={render:()=>({components:{Html:t},setup(){return{testimonialHtml:'<div style="background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); max-width: 500px; margin: 0 auto;"><div style="color: #f59e0b; margin-bottom: 12px; font-size: 20px;">&#11088;&#11088;&#11088;&#11088;&#11088;</div><blockquote style="margin: 0 0 24px 0; font-size: 18px; line-height: 1.6; color: #374151; font-style: italic;">&ldquo;This platform has completely transformed how we build and deploy our applications. The ease of use and powerful features make it indispensable for our team.&rdquo;</blockquote><div style="display: flex; align-items: center; gap: 16px;"><div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px;">JS</div><div><div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">Jane Smith</div><div style="color: #6b7280; font-size: 14px;">CTO, TechCorp Inc.</div></div></div></div>'}},template:'<Html :html="testimonialHtml" />'}),parameters:{docs:{description:{story:"**Testimonial Card** -- A customer testimonial with avatar, quote, and star rating."}}}},n={render:()=>({components:{Html:t},setup(){return{emailHtml:'<div style="background-color: #ffffff; border: 1px solid #cccccc; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;"><h2 style="color: #333333; font-size: 20px; margin: 0 0 16px 0; text-align: center;">Special Offer Inside!</h2><p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">Get 50% off your first month when you sign up today. This limited-time offer expires soon!</p><table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;"><tr><td style="background-color: #007cba; border-radius: 4px; padding: 12px 24px; text-align: center;"><a href="#" style="color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">Claim Offer Now</a></td></tr></table><p style="color: #999999; font-size: 12px; text-align: center; margin: 20px 0 0 0;">*Offer valid for new customers only.</p></div>'}},template:'<Html :html="emailHtml" mode="email" />'}),parameters:{docs:{description:{story:"**Email-Safe HTML** -- Custom HTML optimized for email clients with table-based button layout."}}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Html
    },
    template: \`<Html />\`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Default HTML** -- Renders with schema-driven defaults.'
      }
    }
  }
}`,...i.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Html
    },
    setup() {
      const cardHtml = '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; border-radius: 16px; color: white; text-align: center; box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3); max-width: 400px; margin: 0 auto;"><h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700;">Custom HTML Card</h2><p style="margin: 0; opacity: 0.9; line-height: 1.6;">This beautiful card is created using custom HTML and CSS with gradient backgrounds and modern styling.</p></div>';
      return {
        cardHtml
      };
    },
    template: \`<Html :html="cardHtml" />\`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Styled Card** -- A gradient card built with custom HTML and CSS.'
      }
    }
  }
}`,...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Html
    },
    setup() {
      const progressHtml = '<div style="max-width: 500px; margin: 0 auto; padding: 20px;"><h3 style="margin: 0 0 24px 0; color: #1f2937; font-size: 20px; font-weight: 600;">Skill Levels</h3><div style="margin-bottom: 20px;"><div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #374151; font-weight: 500;">JavaScript</span><span style="color: #6b7280; font-size: 14px;">90%</span></div><div style="background: #e5e7eb; border-radius: 10px; height: 8px; overflow: hidden;"><div style="background: linear-gradient(90deg, #3b82f6, #1d4ed8); width: 90%; height: 100%; border-radius: 10px;"></div></div></div><div style="margin-bottom: 20px;"><div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #374151; font-weight: 500;">TypeScript</span><span style="color: #6b7280; font-size: 14px;">75%</span></div><div style="background: #e5e7eb; border-radius: 10px; height: 8px; overflow: hidden;"><div style="background: linear-gradient(90deg, #7c3aed, #5b21b6); width: 75%; height: 100%; border-radius: 10px;"></div></div></div><div style="margin-bottom: 20px;"><div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #374151; font-weight: 500;">CSS</span><span style="color: #6b7280; font-size: 14px;">95%</span></div><div style="background: #e5e7eb; border-radius: 10px; height: 8px; overflow: hidden;"><div style="background: linear-gradient(90deg, #f59e0b, #d97706); width: 95%; height: 100%; border-radius: 10px;"></div></div></div></div>';
      return {
        progressHtml
      };
    },
    template: \`<Html :html="progressHtml" />\`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Progress Bars** -- Animated-style skill level indicators built with custom HTML.'
      }
    }
  }
}`,...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Html
    },
    setup() {
      const statsHtml = '<div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 40px 32px; border-radius: 16px; max-width: 800px; margin: 0 auto;"><h3 style="text-align: center; margin: 0 0 32px 0; color: #0f172a; font-size: 24px; font-weight: 700;">Platform Statistics</h3><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 24px;"><div style="text-align: center; padding: 24px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><div style="font-size: 36px; font-weight: 800; color: #3b82f6; margin-bottom: 8px;">1M+</div><div style="color: #6b7280; font-weight: 500; font-size: 14px;">Active Users</div></div><div style="text-align: center; padding: 24px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><div style="font-size: 36px; font-weight: 800; color: #10b981; margin-bottom: 8px;">99.9%</div><div style="color: #6b7280; font-weight: 500; font-size: 14px;">Uptime</div></div><div style="text-align: center; padding: 24px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><div style="font-size: 36px; font-weight: 800; color: #f59e0b; margin-bottom: 8px;">24/7</div><div style="color: #6b7280; font-weight: 500; font-size: 14px;">Support</div></div><div style="text-align: center; padding: 24px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><div style="font-size: 36px; font-weight: 800; color: #7c3aed; margin-bottom: 8px;">50+</div><div style="color: #6b7280; font-weight: 500; font-size: 14px;">Countries</div></div></div></div>';
      return {
        statsHtml
      };
    },
    template: \`<Html :html="statsHtml" />\`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Statistics Dashboard** -- A stats grid built entirely with custom HTML.'
      }
    }
  }
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Html
    },
    setup() {
      const testimonialHtml = '<div style="background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); max-width: 500px; margin: 0 auto;"><div style="color: #f59e0b; margin-bottom: 12px; font-size: 20px;">&#11088;&#11088;&#11088;&#11088;&#11088;</div><blockquote style="margin: 0 0 24px 0; font-size: 18px; line-height: 1.6; color: #374151; font-style: italic;">&ldquo;This platform has completely transformed how we build and deploy our applications. The ease of use and powerful features make it indispensable for our team.&rdquo;</blockquote><div style="display: flex; align-items: center; gap: 16px;"><div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px;">JS</div><div><div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">Jane Smith</div><div style="color: #6b7280; font-size: 14px;">CTO, TechCorp Inc.</div></div></div></div>';
      return {
        testimonialHtml
      };
    },
    template: \`<Html :html="testimonialHtml" />\`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Testimonial Card** -- A customer testimonial with avatar, quote, and star rating.'
      }
    }
  }
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Html
    },
    setup() {
      const emailHtml = '<div style="background-color: #ffffff; border: 1px solid #cccccc; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;"><h2 style="color: #333333; font-size: 20px; margin: 0 0 16px 0; text-align: center;">Special Offer Inside!</h2><p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">Get 50% off your first month when you sign up today. This limited-time offer expires soon!</p><table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;"><tr><td style="background-color: #007cba; border-radius: 4px; padding: 12px 24px; text-align: center;"><a href="#" style="color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">Claim Offer Now</a></td></tr></table><p style="color: #999999; font-size: 12px; text-align: center; margin: 20px 0 0 0;">*Offer valid for new customers only.</p></div>';
      return {
        emailHtml
      };
    },
    template: \`<Html :html="emailHtml" mode="email" />\`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Email-Safe HTML** -- Custom HTML optimized for email clients with table-based button layout.'
      }
    }
  }
}`,...n.parameters?.docs?.source}}};const b=["Default","StyledCard","ProgressBars","Statistics","TestimonialCard","EmailHtml"];export{i as Default,n as EmailHtml,r as ProgressBars,a as Statistics,o as StyledCard,s as TestimonialCard,b as __namedExportsOrder,u as default};
