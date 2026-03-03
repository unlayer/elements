import{B as e,C as l,R as a}from"./Column-BthB5a2A.js";import{B as d}from"./Button-Dpxp_fCE.js";import{T as i}from"./Text-Bju3ph6h.js";import{H as p}from"./Heading-BlN1fPTG.js";import{I as x}from"./Image-1zjiVWTH.js";import{D as c}from"./Divider-CBLHcOXg.js";import"./iframe-BMyXcb8A.js";import"./preload-helper-PPVm8Dsz.js";import"./create-component-D1merdym.js";import"./index-8x7ipbY-.js";const v={title:"Layout/Body",component:e,tags:["autodocs"],parameters:{layout:"fullscreen"},argTypes:{backgroundColor:{control:"color"},contentWidth:{control:"text"},mode:{control:"select",options:["web","email"]}}},n={args:{backgroundColor:"#f0f4f8",contentWidth:"600px",mode:"web"},render:s=>({components:{Body:e,Row:a,Column:l,Heading:p,Text:i,Button:d},setup(){return{args:s}},template:`
      <Body
        :background-color="args.backgroundColor"
        :content-width="args.contentWidth"
        :mode="args.mode"
      >
        <Row :cells="[1]">
          <Column padding="20px">
            <Heading text="Welcome to Unlayer Elements" level="h1" text-align="center" />
            <Text text="Build beautiful emails, pages, and documents with composable Vue components. Each element renders pixel-perfect HTML across all major clients." text-align="center" />
            <Button text="Get Started" href="https://unlayer.com" background-color="#3b82f6" text-color="#ffffff" border-radius="6px" />
          </Column>
        </Row>
      </Body>
    `})},o={render:()=>({components:{Body:e,Row:a,Column:l,Heading:p,Text:i,Button:d,Divider:c,Image:x},template:`
      <Body background-color="#ffffff" content-width="640px">
        <!-- Hero -->
        <Row :cells="[1]" background-color="#0f172a" padding="0px">
          <Column padding="48px 40px">
            <Heading
              text="Ship faster with Unlayer"
              level="h1"
              text-align="center"
              color="#ffffff"
              font-size="36px"
            />
            <Text
              text="The component toolkit for email and web content. Drop in, customise, and deploy production-ready layouts in minutes."
              text-align="center"
              color="#94a3b8"
              font-size="16px"
            />
            <Button
              text="Start Building"
              href="https://unlayer.com"
              background-color="#6366f1"
              text-color="#ffffff"
              border-radius="8px"
              padding="14px 32px"
            />
          </Column>
        </Row>

        <!-- Features -->
        <Row :cells="[1,1,1]" padding="40px 0px">
          <Column padding="20px 16px">
            <Heading text="Composable" level="h3" text-align="center" color="#1e293b" />
            <Text
              text="Nest Body, Row, Column, and item components naturally. The tree renders to standards-compliant HTML."
              text-align="center"
              color="#64748b"
              font-size="14px"
            />
          </Column>
          <Column padding="20px 16px">
            <Heading text="Cross-Client" level="h3" text-align="center" color="#1e293b" />
            <Text
              text="Output works in Gmail, Outlook, Apple Mail, and every modern browser without additional configuration."
              text-align="center"
              color="#64748b"
              font-size="14px"
            />
          </Column>
          <Column padding="20px 16px">
            <Heading text="Framework Ready" level="h3" text-align="center" color="#1e293b" />
            <Text
              text="Available for React, Vue, Angular, Svelte, and Preact. Use the same API everywhere."
              text-align="center"
              color="#64748b"
              font-size="14px"
            />
          </Column>
        </Row>

        <Row :cells="[1]">
          <Column padding="0px 40px">
            <Divider border-color="#e2e8f0" />
          </Column>
        </Row>

        <!-- CTA -->
        <Row :cells="[1]" padding="0px">
          <Column padding="32px 40px">
            <Heading text="Ready to get started?" level="h2" text-align="center" color="#1e293b" />
            <Text
              text="Join thousands of teams building with Unlayer Elements."
              text-align="center"
              color="#64748b"
            />
            <Button
              text="Create Free Account"
              href="https://unlayer.com/signup"
              background-color="#10b981"
              text-color="#ffffff"
              border-radius="8px"
              padding="14px 28px"
            />
          </Column>
        </Row>
      </Body>
    `})},t={render:()=>({components:{Body:e,Row:a,Column:l,Heading:p,Text:i,Button:d,Divider:c},template:`
      <Body background-color="#0f172a" content-width="600px" text-color="#e2e8f0">
        <!-- Header -->
        <Row :cells="[1]" padding="0px">
          <Column padding="40px 32px 24px">
            <Heading
              text="Dark Mode Newsletter"
              level="h1"
              text-align="center"
              color="#f8fafc"
              font-size="32px"
            />
            <Text
              text="A weekly digest of the best developer content, curated for your reading pleasure."
              text-align="center"
              color="#94a3b8"
              font-size="15px"
            />
          </Column>
        </Row>

        <Row :cells="[1]">
          <Column padding="0px 32px">
            <Divider border-color="#334155" />
          </Column>
        </Row>

        <!-- Article 1 -->
        <Row :cells="[1]" padding="0px">
          <Column padding="24px 32px" background-color="#1e293b" border-radius="8px">
            <Heading text="Understanding Vue Reactivity" level="h3" color="#f1f5f9" />
            <Text
              text="A deep dive into Vue 3's reactivity system: how Proxies replaced Object.defineProperty, and what it means for performance in large applications."
              color="#cbd5e1"
              font-size="14px"
            />
            <Button
              text="Read Article"
              href="#"
              background-color="transparent"
              text-color="#818cf8"
              border-radius="4px"
              padding="8px 0px"
            />
          </Column>
        </Row>

        <!-- Article 2 -->
        <Row :cells="[1]" padding="0px">
          <Column padding="24px 32px" background-color="#1e293b" border-radius="8px">
            <Heading text="Building Email Templates at Scale" level="h3" color="#f1f5f9" />
            <Text
              text="How component-based architectures like Unlayer Elements let teams ship consistent, tested email templates across products and brands."
              color="#cbd5e1"
              font-size="14px"
            />
            <Button
              text="Read Article"
              href="#"
              background-color="transparent"
              text-color="#818cf8"
              border-radius="4px"
              padding="8px 0px"
            />
          </Column>
        </Row>

        <Row :cells="[1]">
          <Column padding="0px 32px">
            <Divider border-color="#334155" />
          </Column>
        </Row>

        <!-- Footer -->
        <Row :cells="[1]" padding="0px">
          <Column padding="16px 32px 40px">
            <Text
              text="You are receiving this because you subscribed to the Developer Digest."
              text-align="center"
              color="#475569"
              font-size="12px"
            />
          </Column>
        </Row>
      </Body>
    `})},r={render:()=>({components:{Body:e,Row:a,Column:l,Heading:p,Text:i,Button:d,Divider:c},template:`
      <Body
        mode="email"
        background-color="#f9fafb"
        content-width="600px"
        preview-text="Your weekly summary is here -- 3 new features shipped this week!"
      >
        <!-- Header -->
        <Row :cells="[1]" padding="0px">
          <Column padding="32px 24px 16px">
            <Heading
              text="Weekly Product Update"
              level="h1"
              text-align="center"
              color="#111827"
              font-size="28px"
            />
            <Text
              text="March 3, 2026"
              text-align="center"
              color="#9ca3af"
              font-size="13px"
            />
          </Column>
        </Row>

        <Row :cells="[1]">
          <Column padding="0px 24px">
            <Divider border-color="#e5e7eb" />
          </Column>
        </Row>

        <!-- Highlight -->
        <Row :cells="[1]" padding="0px">
          <Column padding="24px" background-color="#eff6ff" border-radius="8px">
            <Heading text="New: Vue Elements Package" level="h2" color="#1e40af" font-size="20px" />
            <Text
              text="Build pixel-perfect emails with Vue 3 components. Full SSR support, TypeScript-first, and works with every major email client out of the box."
              color="#1e3a5f"
              font-size="14px"
            />
            <Button
              text="View Documentation"
              href="https://docs.unlayer.com"
              background-color="#2563eb"
              text-color="#ffffff"
              border-radius="6px"
              padding="12px 24px"
            />
          </Column>
        </Row>

        <!-- Two-column updates -->
        <Row :cells="[1,1]" padding="16px 0px">
          <Column padding="16px" background-color="#ffffff" border-radius="6px">
            <Heading text="Performance" level="h3" color="#111827" font-size="16px" />
            <Text
              text="Rendering speed improved by 40% across all frameworks thanks to the new shared pipeline."
              color="#6b7280"
              font-size="13px"
            />
          </Column>
          <Column padding="16px" background-color="#ffffff" border-radius="6px">
            <Heading text="Accessibility" level="h3" color="#111827" font-size="16px" />
            <Text
              text="All components now include proper ARIA attributes and semantic HTML elements."
              color="#6b7280"
              font-size="13px"
            />
          </Column>
        </Row>

        <Row :cells="[1]">
          <Column padding="0px 24px">
            <Divider border-color="#e5e7eb" />
          </Column>
        </Row>

        <!-- Footer -->
        <Row :cells="[1]" padding="0px">
          <Column padding="16px 24px 32px">
            <Text
              text="Unlayer Inc. | 123 Builder St, San Francisco, CA 94107"
              text-align="center"
              color="#9ca3af"
              font-size="11px"
            />
            <Text
              text="You received this email because you opted in to product updates."
              text-align="center"
              color="#9ca3af"
              font-size="11px"
            />
          </Column>
        </Row>
      </Body>
    `})};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    backgroundColor: '#f0f4f8',
    contentWidth: '600px',
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
      <Body
        :background-color="args.backgroundColor"
        :content-width="args.contentWidth"
        :mode="args.mode"
      >
        <Row :cells="[1]">
          <Column padding="20px">
            <Heading text="Welcome to Unlayer Elements" level="h1" text-align="center" />
            <Text text="Build beautiful emails, pages, and documents with composable Vue components. Each element renders pixel-perfect HTML across all major clients." text-align="center" />
            <Button text="Get Started" href="https://unlayer.com" background-color="#3b82f6" text-color="#ffffff" border-radius="6px" />
          </Column>
        </Row>
      </Body>
    \`
  })
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Body,
      Row,
      Column,
      Heading,
      Text,
      Button,
      Divider,
      Image
    },
    template: \`
      <Body background-color="#ffffff" content-width="640px">
        <!-- Hero -->
        <Row :cells="[1]" background-color="#0f172a" padding="0px">
          <Column padding="48px 40px">
            <Heading
              text="Ship faster with Unlayer"
              level="h1"
              text-align="center"
              color="#ffffff"
              font-size="36px"
            />
            <Text
              text="The component toolkit for email and web content. Drop in, customise, and deploy production-ready layouts in minutes."
              text-align="center"
              color="#94a3b8"
              font-size="16px"
            />
            <Button
              text="Start Building"
              href="https://unlayer.com"
              background-color="#6366f1"
              text-color="#ffffff"
              border-radius="8px"
              padding="14px 32px"
            />
          </Column>
        </Row>

        <!-- Features -->
        <Row :cells="[1,1,1]" padding="40px 0px">
          <Column padding="20px 16px">
            <Heading text="Composable" level="h3" text-align="center" color="#1e293b" />
            <Text
              text="Nest Body, Row, Column, and item components naturally. The tree renders to standards-compliant HTML."
              text-align="center"
              color="#64748b"
              font-size="14px"
            />
          </Column>
          <Column padding="20px 16px">
            <Heading text="Cross-Client" level="h3" text-align="center" color="#1e293b" />
            <Text
              text="Output works in Gmail, Outlook, Apple Mail, and every modern browser without additional configuration."
              text-align="center"
              color="#64748b"
              font-size="14px"
            />
          </Column>
          <Column padding="20px 16px">
            <Heading text="Framework Ready" level="h3" text-align="center" color="#1e293b" />
            <Text
              text="Available for React, Vue, Angular, Svelte, and Preact. Use the same API everywhere."
              text-align="center"
              color="#64748b"
              font-size="14px"
            />
          </Column>
        </Row>

        <Row :cells="[1]">
          <Column padding="0px 40px">
            <Divider border-color="#e2e8f0" />
          </Column>
        </Row>

        <!-- CTA -->
        <Row :cells="[1]" padding="0px">
          <Column padding="32px 40px">
            <Heading text="Ready to get started?" level="h2" text-align="center" color="#1e293b" />
            <Text
              text="Join thousands of teams building with Unlayer Elements."
              text-align="center"
              color="#64748b"
            />
            <Button
              text="Create Free Account"
              href="https://unlayer.com/signup"
              background-color="#10b981"
              text-color="#ffffff"
              border-radius="8px"
              padding="14px 28px"
            />
          </Column>
        </Row>
      </Body>
    \`
  })
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Body,
      Row,
      Column,
      Heading,
      Text,
      Button,
      Divider
    },
    template: \`
      <Body background-color="#0f172a" content-width="600px" text-color="#e2e8f0">
        <!-- Header -->
        <Row :cells="[1]" padding="0px">
          <Column padding="40px 32px 24px">
            <Heading
              text="Dark Mode Newsletter"
              level="h1"
              text-align="center"
              color="#f8fafc"
              font-size="32px"
            />
            <Text
              text="A weekly digest of the best developer content, curated for your reading pleasure."
              text-align="center"
              color="#94a3b8"
              font-size="15px"
            />
          </Column>
        </Row>

        <Row :cells="[1]">
          <Column padding="0px 32px">
            <Divider border-color="#334155" />
          </Column>
        </Row>

        <!-- Article 1 -->
        <Row :cells="[1]" padding="0px">
          <Column padding="24px 32px" background-color="#1e293b" border-radius="8px">
            <Heading text="Understanding Vue Reactivity" level="h3" color="#f1f5f9" />
            <Text
              text="A deep dive into Vue 3's reactivity system: how Proxies replaced Object.defineProperty, and what it means for performance in large applications."
              color="#cbd5e1"
              font-size="14px"
            />
            <Button
              text="Read Article"
              href="#"
              background-color="transparent"
              text-color="#818cf8"
              border-radius="4px"
              padding="8px 0px"
            />
          </Column>
        </Row>

        <!-- Article 2 -->
        <Row :cells="[1]" padding="0px">
          <Column padding="24px 32px" background-color="#1e293b" border-radius="8px">
            <Heading text="Building Email Templates at Scale" level="h3" color="#f1f5f9" />
            <Text
              text="How component-based architectures like Unlayer Elements let teams ship consistent, tested email templates across products and brands."
              color="#cbd5e1"
              font-size="14px"
            />
            <Button
              text="Read Article"
              href="#"
              background-color="transparent"
              text-color="#818cf8"
              border-radius="4px"
              padding="8px 0px"
            />
          </Column>
        </Row>

        <Row :cells="[1]">
          <Column padding="0px 32px">
            <Divider border-color="#334155" />
          </Column>
        </Row>

        <!-- Footer -->
        <Row :cells="[1]" padding="0px">
          <Column padding="16px 32px 40px">
            <Text
              text="You are receiving this because you subscribed to the Developer Digest."
              text-align="center"
              color="#475569"
              font-size="12px"
            />
          </Column>
        </Row>
      </Body>
    \`
  })
}`,...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Body,
      Row,
      Column,
      Heading,
      Text,
      Button,
      Divider
    },
    template: \`
      <Body
        mode="email"
        background-color="#f9fafb"
        content-width="600px"
        preview-text="Your weekly summary is here -- 3 new features shipped this week!"
      >
        <!-- Header -->
        <Row :cells="[1]" padding="0px">
          <Column padding="32px 24px 16px">
            <Heading
              text="Weekly Product Update"
              level="h1"
              text-align="center"
              color="#111827"
              font-size="28px"
            />
            <Text
              text="March 3, 2026"
              text-align="center"
              color="#9ca3af"
              font-size="13px"
            />
          </Column>
        </Row>

        <Row :cells="[1]">
          <Column padding="0px 24px">
            <Divider border-color="#e5e7eb" />
          </Column>
        </Row>

        <!-- Highlight -->
        <Row :cells="[1]" padding="0px">
          <Column padding="24px" background-color="#eff6ff" border-radius="8px">
            <Heading text="New: Vue Elements Package" level="h2" color="#1e40af" font-size="20px" />
            <Text
              text="Build pixel-perfect emails with Vue 3 components. Full SSR support, TypeScript-first, and works with every major email client out of the box."
              color="#1e3a5f"
              font-size="14px"
            />
            <Button
              text="View Documentation"
              href="https://docs.unlayer.com"
              background-color="#2563eb"
              text-color="#ffffff"
              border-radius="6px"
              padding="12px 24px"
            />
          </Column>
        </Row>

        <!-- Two-column updates -->
        <Row :cells="[1,1]" padding="16px 0px">
          <Column padding="16px" background-color="#ffffff" border-radius="6px">
            <Heading text="Performance" level="h3" color="#111827" font-size="16px" />
            <Text
              text="Rendering speed improved by 40% across all frameworks thanks to the new shared pipeline."
              color="#6b7280"
              font-size="13px"
            />
          </Column>
          <Column padding="16px" background-color="#ffffff" border-radius="6px">
            <Heading text="Accessibility" level="h3" color="#111827" font-size="16px" />
            <Text
              text="All components now include proper ARIA attributes and semantic HTML elements."
              color="#6b7280"
              font-size="13px"
            />
          </Column>
        </Row>

        <Row :cells="[1]">
          <Column padding="0px 24px">
            <Divider border-color="#e5e7eb" />
          </Column>
        </Row>

        <!-- Footer -->
        <Row :cells="[1]" padding="0px">
          <Column padding="16px 24px 32px">
            <Text
              text="Unlayer Inc. | 123 Builder St, San Francisco, CA 94107"
              text-align="center"
              color="#9ca3af"
              font-size="11px"
            />
            <Text
              text="You received this email because you opted in to product updates."
              text-align="center"
              color="#9ca3af"
              font-size="11px"
            />
          </Column>
        </Row>
      </Body>
    \`
  })
}`,...r.parameters?.docs?.source}}};const k=["Playground","SaaSLanding","DarkTheme","EmailMode"];export{t as DarkTheme,r as EmailMode,n as Playground,o as SaaSLanding,k as __namedExportsOrder,v as default};
