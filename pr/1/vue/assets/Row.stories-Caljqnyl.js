import{R as e,C as o,B as n}from"./Column-BthB5a2A.js";import{B as p}from"./Button-Dpxp_fCE.js";import{T as t}from"./Text-Bju3ph6h.js";import{H as r}from"./Heading-BlN1fPTG.js";import{D as x}from"./Divider-CBLHcOXg.js";import{I as u}from"./Image-1zjiVWTH.js";import"./iframe-BMyXcb8A.js";import"./preload-helper-PPVm8Dsz.js";import"./create-component-D1merdym.js";import"./index-8x7ipbY-.js";const T={title:"Layout/Row",component:e,tags:["autodocs"],parameters:{layout:"fullscreen"},argTypes:{backgroundColor:{control:"color"},padding:{control:"text"},columnsBackgroundColor:{control:"color"},mode:{control:"select",options:["web","email"]}}},a={args:{backgroundColor:"#ffffff",padding:"10px",columnsBackgroundColor:"#f8fafc",mode:"web"},render:s=>({components:{Body:n,Row:e,Column:o,Heading:r,Text:t,Button:p},setup(){return{args:s}},template:`
      <Body background-color="#e2e8f0" content-width="600px" :mode="args.mode">
        <Row
          :cells="[1,1]"
          :background-color="args.backgroundColor"
          :padding="args.padding"
          :columns-background-color="args.columnsBackgroundColor"
        >
          <Column padding="20px">
            <Heading text="Left Column" level="h2" color="#1e293b" />
            <Text
              text="This is the first column in a two-column layout. Adjust the Row props using the controls panel below."
              color="#64748b"
              font-size="14px"
            />
            <Button
              text="Primary Action"
              href="#"
              background-color="#3b82f6"
              text-color="#ffffff"
              border-radius="6px"
            />
          </Column>
          <Column padding="20px">
            <Heading text="Right Column" level="h2" color="#1e293b" />
            <Text
              text="This is the second column. Try changing the background color, padding, and columns background color."
              color="#64748b"
              font-size="14px"
            />
            <Button
              text="Secondary Action"
              href="#"
              background-color="#8b5cf6"
              text-color="#ffffff"
              border-radius="6px"
            />
          </Column>
        </Row>
      </Body>
    `})},l={render:()=>({components:{Body:n,Row:e,Column:o,Heading:r,Text:t,Button:p},template:`
      <Body background-color="#0f172a" content-width="640px">
        <!-- Spacer -->
        <Row :cells="[1]" padding="0px">
          <Column padding="60px 40px 20px">
            <Heading
              text="Build, Ship, Iterate"
              level="h1"
              text-align="center"
              color="#f8fafc"
              font-size="42px"
            />
            <Text
              text="The modern platform for creating production-ready email templates and landing pages. Designed for developers, loved by designers."
              text-align="center"
              color="#94a3b8"
              font-size="17px"
            />
          </Column>
        </Row>

        <!-- Dual CTA -->
        <Row :cells="[1,1]" padding="0px">
          <Column padding="10px 16px 60px">
            <Button
              text="Start Free Trial"
              href="#"
              background-color="#6366f1"
              text-color="#ffffff"
              border-radius="8px"
              padding="14px 0px"
              full-width="true"
            />
          </Column>
          <Column padding="10px 16px 60px">
            <Button
              text="View Live Demo"
              href="#"
              background-color="transparent"
              text-color="#a5b4fc"
              border-radius="8px"
              padding="14px 0px"
              full-width="true"
            />
          </Column>
        </Row>
      </Body>
    `})},i={render:()=>({components:{Body:n,Row:e,Column:o,Heading:r,Text:t,Divider:x},template:`
      <Body background-color="#f1f5f9" content-width="660px">
        <Row :cells="[1]" padding="0px">
          <Column padding="40px 20px 24px">
            <Heading
              text="Our Services"
              level="h2"
              text-align="center"
              color="#0f172a"
              font-size="28px"
            />
            <Text
              text="Everything you need to create exceptional digital experiences."
              text-align="center"
              color="#64748b"
              font-size="15px"
            />
          </Column>
        </Row>

        <Row :cells="[1,1,1]" padding="0px 10px 40px 10px">
          <Column padding="24px" background-color="#ffffff" border-radius="8px">
            <Divider border-color="#ef4444" width="40px" />
            <Heading text="Design" level="h3" color="#1e293b" font-size="18px" />
            <Text
              text="Custom templates crafted by our team of designers. Fully responsive and tested across 90+ email clients."
              color="#64748b"
              font-size="13px"
            />
          </Column>
          <Column padding="24px" background-color="#ffffff" border-radius="8px">
            <Divider border-color="#3b82f6" width="40px" />
            <Heading text="Development" level="h3" color="#1e293b" font-size="18px" />
            <Text
              text="Component-based architecture with React, Vue, and Angular support. TypeScript-first with full type safety."
              color="#64748b"
              font-size="13px"
            />
          </Column>
          <Column padding="24px" background-color="#ffffff" border-radius="8px">
            <Divider border-color="#10b981" width="40px" />
            <Heading text="Delivery" level="h3" color="#1e293b" font-size="18px" />
            <Text
              text="Integrate with any ESP via our API. Automatic inlining, minification, and compatibility transforms."
              color="#64748b"
              font-size="13px"
            />
          </Column>
        </Row>
      </Body>
    `})},d={render:()=>({components:{Body:n,Row:e,Column:o,Heading:r,Text:t,Button:p,Image:u,Divider:x},template:`
      <Body background-color="#ffffff" content-width="640px">
        <Row :cells="[1]" padding="0px">
          <Column padding="32px 24px 16px">
            <Heading
              text="Featured Product"
              level="h2"
              text-align="center"
              color="#111827"
              font-size="24px"
            />
          </Column>
        </Row>

        <Row :cells="[1,1]" padding="0px 20px">
          <Column padding="16px">
            <Image
              src="https://placehold.co/280x320/e2e8f0/475569?text=Product+Image"
              alt="Product showcase"
              width="100%"
            />
          </Column>
          <Column padding="16px 16px 16px 24px">
            <Heading text="Unlayer Elements Pro" level="h3" color="#111827" font-size="22px" />
            <Text
              text="The complete toolkit for building production-ready email templates. Includes 50+ pre-built components, dark mode support, and responsive layouts."
              color="#4b5563"
              font-size="14px"
            />
            <Divider border-color="#e5e7eb" />
            <Text text="Starting at $29/month" color="#059669" font-size="20px" />
            <Button
              text="Learn More"
              href="#"
              background-color="#111827"
              text-color="#ffffff"
              border-radius="6px"
              padding="12px 28px"
            />
          </Column>
        </Row>

        <Row :cells="[1]">
          <Column padding="24px">
            <Divider border-color="#f3f4f6" />
          </Column>
        </Row>
      </Body>
    `})},c={render:()=>({components:{Body:n,Row:e,Column:o,Heading:r,Text:t,Divider:x},template:`
      <Body background-color="#fafaf9" content-width="640px">
        <Row :cells="[1]" padding="0px">
          <Column padding="40px 24px 16px">
            <Heading
              text="Quarterly Review"
              level="h1"
              text-align="center"
              color="#1c1917"
              font-size="32px"
            />
            <Text
              text="Q4 2025 Performance Highlights"
              text-align="center"
              color="#78716c"
              font-size="14px"
            />
          </Column>
        </Row>

        <Row :cells="[1]">
          <Column padding="0px 24px">
            <Divider border-color="#e7e5e4" />
          </Column>
        </Row>

        <!-- Editorial + Stats: 2:1 ratio -->
        <Row :cells="[2,1]" padding="0px">
          <Column padding="24px">
            <Heading text="Record-Breaking Growth" level="h2" color="#292524" font-size="22px" />
            <Text
              text="This quarter marked a pivotal moment for our platform. We saw unprecedented adoption across all major frameworks, with Vue and React leading the charge. Our rendering engine processed over 2 billion templates, maintaining a 99.97% uptime SLA throughout."
              color="#57534e"
              font-size="14px"
              line-height="1.7"
            />
            <Text
              text="The new shared pipeline architecture reduced rendering time by 40% while simultaneously improving cross-client compatibility. Teams using our component library reported a 3x improvement in template development speed compared to hand-coded alternatives."
              color="#57534e"
              font-size="14px"
              line-height="1.7"
            />
          </Column>
          <Column padding="24px" background-color="#1c1917" border-radius="8px">
            <Heading text="2B+" level="h2" text-align="center" color="#fbbf24" font-size="36px" />
            <Text text="Templates Rendered" text-align="center" color="#a8a29e" font-size="12px" />

            <Divider border-color="#44403c" />

            <Heading text="40%" level="h2" text-align="center" color="#34d399" font-size="36px" />
            <Text text="Faster Rendering" text-align="center" color="#a8a29e" font-size="12px" />

            <Divider border-color="#44403c" />

            <Heading text="99.97%" level="h2" text-align="center" color="#60a5fa" font-size="36px" />
            <Text text="Uptime SLA" text-align="center" color="#a8a29e" font-size="12px" />
          </Column>
        </Row>

        <Row :cells="[1]">
          <Column padding="16px 24px 40px">
            <Divider border-color="#e7e5e4" />
            <Text
              text="For the full report, contact your account manager or visit the analytics dashboard."
              text-align="center"
              color="#a8a29e"
              font-size="12px"
            />
          </Column>
        </Row>
      </Body>
    `})};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    backgroundColor: '#ffffff',
    padding: '10px',
    columnsBackgroundColor: '#f8fafc',
    mode: 'web'
  },
  render: args => ({
    components: {
      Body,
      Row,
      Column,
      Heading,
      Text,
      Button
    },
    setup() {
      return {
        args
      };
    },
    template: \`
      <Body background-color="#e2e8f0" content-width="600px" :mode="args.mode">
        <Row
          :cells="[1,1]"
          :background-color="args.backgroundColor"
          :padding="args.padding"
          :columns-background-color="args.columnsBackgroundColor"
        >
          <Column padding="20px">
            <Heading text="Left Column" level="h2" color="#1e293b" />
            <Text
              text="This is the first column in a two-column layout. Adjust the Row props using the controls panel below."
              color="#64748b"
              font-size="14px"
            />
            <Button
              text="Primary Action"
              href="#"
              background-color="#3b82f6"
              text-color="#ffffff"
              border-radius="6px"
            />
          </Column>
          <Column padding="20px">
            <Heading text="Right Column" level="h2" color="#1e293b" />
            <Text
              text="This is the second column. Try changing the background color, padding, and columns background color."
              color="#64748b"
              font-size="14px"
            />
            <Button
              text="Secondary Action"
              href="#"
              background-color="#8b5cf6"
              text-color="#ffffff"
              border-radius="6px"
            />
          </Column>
        </Row>
      </Body>
    \`
  })
}`,...a.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Body,
      Row,
      Column,
      Heading,
      Text,
      Button
    },
    template: \`
      <Body background-color="#0f172a" content-width="640px">
        <!-- Spacer -->
        <Row :cells="[1]" padding="0px">
          <Column padding="60px 40px 20px">
            <Heading
              text="Build, Ship, Iterate"
              level="h1"
              text-align="center"
              color="#f8fafc"
              font-size="42px"
            />
            <Text
              text="The modern platform for creating production-ready email templates and landing pages. Designed for developers, loved by designers."
              text-align="center"
              color="#94a3b8"
              font-size="17px"
            />
          </Column>
        </Row>

        <!-- Dual CTA -->
        <Row :cells="[1,1]" padding="0px">
          <Column padding="10px 16px 60px">
            <Button
              text="Start Free Trial"
              href="#"
              background-color="#6366f1"
              text-color="#ffffff"
              border-radius="8px"
              padding="14px 0px"
              full-width="true"
            />
          </Column>
          <Column padding="10px 16px 60px">
            <Button
              text="View Live Demo"
              href="#"
              background-color="transparent"
              text-color="#a5b4fc"
              border-radius="8px"
              padding="14px 0px"
              full-width="true"
            />
          </Column>
        </Row>
      </Body>
    \`
  })
}`,...l.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Body,
      Row,
      Column,
      Heading,
      Text,
      Divider
    },
    template: \`
      <Body background-color="#f1f5f9" content-width="660px">
        <Row :cells="[1]" padding="0px">
          <Column padding="40px 20px 24px">
            <Heading
              text="Our Services"
              level="h2"
              text-align="center"
              color="#0f172a"
              font-size="28px"
            />
            <Text
              text="Everything you need to create exceptional digital experiences."
              text-align="center"
              color="#64748b"
              font-size="15px"
            />
          </Column>
        </Row>

        <Row :cells="[1,1,1]" padding="0px 10px 40px 10px">
          <Column padding="24px" background-color="#ffffff" border-radius="8px">
            <Divider border-color="#ef4444" width="40px" />
            <Heading text="Design" level="h3" color="#1e293b" font-size="18px" />
            <Text
              text="Custom templates crafted by our team of designers. Fully responsive and tested across 90+ email clients."
              color="#64748b"
              font-size="13px"
            />
          </Column>
          <Column padding="24px" background-color="#ffffff" border-radius="8px">
            <Divider border-color="#3b82f6" width="40px" />
            <Heading text="Development" level="h3" color="#1e293b" font-size="18px" />
            <Text
              text="Component-based architecture with React, Vue, and Angular support. TypeScript-first with full type safety."
              color="#64748b"
              font-size="13px"
            />
          </Column>
          <Column padding="24px" background-color="#ffffff" border-radius="8px">
            <Divider border-color="#10b981" width="40px" />
            <Heading text="Delivery" level="h3" color="#1e293b" font-size="18px" />
            <Text
              text="Integrate with any ESP via our API. Automatic inlining, minification, and compatibility transforms."
              color="#64748b"
              font-size="13px"
            />
          </Column>
        </Row>
      </Body>
    \`
  })
}`,...i.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Body,
      Row,
      Column,
      Heading,
      Text,
      Button,
      Image,
      Divider
    },
    template: \`
      <Body background-color="#ffffff" content-width="640px">
        <Row :cells="[1]" padding="0px">
          <Column padding="32px 24px 16px">
            <Heading
              text="Featured Product"
              level="h2"
              text-align="center"
              color="#111827"
              font-size="24px"
            />
          </Column>
        </Row>

        <Row :cells="[1,1]" padding="0px 20px">
          <Column padding="16px">
            <Image
              src="https://placehold.co/280x320/e2e8f0/475569?text=Product+Image"
              alt="Product showcase"
              width="100%"
            />
          </Column>
          <Column padding="16px 16px 16px 24px">
            <Heading text="Unlayer Elements Pro" level="h3" color="#111827" font-size="22px" />
            <Text
              text="The complete toolkit for building production-ready email templates. Includes 50+ pre-built components, dark mode support, and responsive layouts."
              color="#4b5563"
              font-size="14px"
            />
            <Divider border-color="#e5e7eb" />
            <Text text="Starting at $29/month" color="#059669" font-size="20px" />
            <Button
              text="Learn More"
              href="#"
              background-color="#111827"
              text-color="#ffffff"
              border-radius="6px"
              padding="12px 28px"
            />
          </Column>
        </Row>

        <Row :cells="[1]">
          <Column padding="24px">
            <Divider border-color="#f3f4f6" />
          </Column>
        </Row>
      </Body>
    \`
  })
}`,...d.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Body,
      Row,
      Column,
      Heading,
      Text,
      Divider
    },
    template: \`
      <Body background-color="#fafaf9" content-width="640px">
        <Row :cells="[1]" padding="0px">
          <Column padding="40px 24px 16px">
            <Heading
              text="Quarterly Review"
              level="h1"
              text-align="center"
              color="#1c1917"
              font-size="32px"
            />
            <Text
              text="Q4 2025 Performance Highlights"
              text-align="center"
              color="#78716c"
              font-size="14px"
            />
          </Column>
        </Row>

        <Row :cells="[1]">
          <Column padding="0px 24px">
            <Divider border-color="#e7e5e4" />
          </Column>
        </Row>

        <!-- Editorial + Stats: 2:1 ratio -->
        <Row :cells="[2,1]" padding="0px">
          <Column padding="24px">
            <Heading text="Record-Breaking Growth" level="h2" color="#292524" font-size="22px" />
            <Text
              text="This quarter marked a pivotal moment for our platform. We saw unprecedented adoption across all major frameworks, with Vue and React leading the charge. Our rendering engine processed over 2 billion templates, maintaining a 99.97% uptime SLA throughout."
              color="#57534e"
              font-size="14px"
              line-height="1.7"
            />
            <Text
              text="The new shared pipeline architecture reduced rendering time by 40% while simultaneously improving cross-client compatibility. Teams using our component library reported a 3x improvement in template development speed compared to hand-coded alternatives."
              color="#57534e"
              font-size="14px"
              line-height="1.7"
            />
          </Column>
          <Column padding="24px" background-color="#1c1917" border-radius="8px">
            <Heading text="2B+" level="h2" text-align="center" color="#fbbf24" font-size="36px" />
            <Text text="Templates Rendered" text-align="center" color="#a8a29e" font-size="12px" />

            <Divider border-color="#44403c" />

            <Heading text="40%" level="h2" text-align="center" color="#34d399" font-size="36px" />
            <Text text="Faster Rendering" text-align="center" color="#a8a29e" font-size="12px" />

            <Divider border-color="#44403c" />

            <Heading text="99.97%" level="h2" text-align="center" color="#60a5fa" font-size="36px" />
            <Text text="Uptime SLA" text-align="center" color="#a8a29e" font-size="12px" />
          </Column>
        </Row>

        <Row :cells="[1]">
          <Column padding="16px 24px 40px">
            <Divider border-color="#e7e5e4" />
            <Text
              text="For the full report, contact your account manager or visit the analytics dashboard."
              text-align="center"
              color="#a8a29e"
              font-size="12px"
            />
          </Column>
        </Row>
      </Body>
    \`
  })
}`,...c.parameters?.docs?.source}}};const k=["Playground","HeroBanner","ServiceCards","ProductShowcase","EditorialWithStats"];export{c as EditorialWithStats,l as HeroBanner,a as Playground,d as ProductShowcase,i as ServiceCards,k as __namedExportsOrder,T as default};
