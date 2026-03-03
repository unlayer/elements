import{C as e,R as x,B as a}from"./Column-BthB5a2A.js";import{B as d}from"./Button-Dpxp_fCE.js";import{T as l}from"./Text-Bju3ph6h.js";import{H as i}from"./Heading-BlN1fPTG.js";import{D as p}from"./Divider-CBLHcOXg.js";import"./iframe-BMyXcb8A.js";import"./preload-helper-PPVm8Dsz.js";import"./create-component-D1merdym.js";import"./index-8x7ipbY-.js";const z={title:"Layout/Column",component:e,tags:["autodocs"],parameters:{layout:"padded"},argTypes:{backgroundColor:{control:"color"},padding:{control:"text"},borderRadius:{control:"text"}}},t={args:{backgroundColor:"#f0f4f8",padding:"24px",borderRadius:"8px"},render:c=>({components:{Body:a,Row:x,Column:e,Heading:i,Text:l,Button:d},setup(){return{args:c}},template:`
      <Body background-color="#e2e8f0" content-width="600px">
        <Row :cells="[1]">
          <Column
            :background-color="args.backgroundColor"
            :padding="args.padding"
            :border-radius="args.borderRadius"
          >
            <Heading text="Column Playground" level="h2" color="#1e293b" />
            <Text
              text="Adjust the Column properties using the controls below. Change the background color, padding, and border radius to see how the Column adapts."
              color="#64748b"
              font-size="14px"
            />
            <Button
              text="Sample Button"
              href="#"
              background-color="#6366f1"
              text-color="#ffffff"
              border-radius="6px"
            />
          </Column>
        </Row>
      </Body>
    `})},n={render:()=>({components:{Body:a,Row:x,Column:e,Heading:i,Text:l,Button:d,Divider:p},template:`
      <Body background-color="#f8fafc" content-width="660px">
        <Row :cells="[1]" padding="0px">
          <Column padding="40px 20px 24px">
            <Heading
              text="Simple, Transparent Pricing"
              level="h1"
              text-align="center"
              color="#0f172a"
              font-size="30px"
            />
            <Text
              text="No hidden fees. No surprises. Pick the plan that fits your team."
              text-align="center"
              color="#64748b"
              font-size="15px"
            />
          </Column>
        </Row>

        <Row :cells="[1,1,1]" padding="0px 8px 40px 8px">
          <!-- Starter -->
          <Column padding="28px 20px" background-color="#ffffff" border-radius="12px">
            <Text text="STARTER" text-align="center" color="#94a3b8" font-size="12px" />
            <Heading text="$0" level="h2" text-align="center" color="#0f172a" font-size="40px" />
            <Text text="per month" text-align="center" color="#94a3b8" font-size="13px" />
            <Divider border-color="#f1f5f9" />
            <Text text="5 templates" text-align="center" color="#475569" font-size="13px" />
            <Text text="1 team member" text-align="center" color="#475569" font-size="13px" />
            <Text text="Community support" text-align="center" color="#475569" font-size="13px" />
            <Text text="Web export only" text-align="center" color="#475569" font-size="13px" />
            <Button
              text="Get Started"
              href="#"
              background-color="#f1f5f9"
              text-color="#475569"
              border-radius="8px"
              padding="10px 0px"
              full-width="true"
            />
          </Column>

          <!-- Pro (featured) -->
          <Column padding="28px 20px" background-color="#0f172a" border-radius="12px">
            <Text text="PRO" text-align="center" color="#818cf8" font-size="12px" />
            <Heading text="$29" level="h2" text-align="center" color="#ffffff" font-size="40px" />
            <Text text="per month" text-align="center" color="#64748b" font-size="13px" />
            <Divider border-color="#1e293b" />
            <Text text="Unlimited templates" text-align="center" color="#cbd5e1" font-size="13px" />
            <Text text="5 team members" text-align="center" color="#cbd5e1" font-size="13px" />
            <Text text="Priority support" text-align="center" color="#cbd5e1" font-size="13px" />
            <Text text="All export formats" text-align="center" color="#cbd5e1" font-size="13px" />
            <Button
              text="Start Free Trial"
              href="#"
              background-color="#6366f1"
              text-color="#ffffff"
              border-radius="8px"
              padding="10px 0px"
              full-width="true"
            />
          </Column>

          <!-- Enterprise -->
          <Column padding="28px 20px" background-color="#ffffff" border-radius="12px">
            <Text text="ENTERPRISE" text-align="center" color="#94a3b8" font-size="12px" />
            <Heading text="Custom" level="h2" text-align="center" color="#0f172a" font-size="40px" />
            <Text text="per year" text-align="center" color="#94a3b8" font-size="13px" />
            <Divider border-color="#f1f5f9" />
            <Text text="Everything in Pro" text-align="center" color="#475569" font-size="13px" />
            <Text text="Unlimited members" text-align="center" color="#475569" font-size="13px" />
            <Text text="Dedicated support" text-align="center" color="#475569" font-size="13px" />
            <Text text="Custom integrations" text-align="center" color="#475569" font-size="13px" />
            <Button
              text="Contact Sales"
              href="#"
              background-color="#f1f5f9"
              text-color="#475569"
              border-radius="8px"
              padding="10px 0px"
              full-width="true"
            />
          </Column>
        </Row>
      </Body>
    `})},o={render:()=>({components:{Body:a,Row:x,Column:e,Heading:i,Text:l,Divider:p},template:`
      <Body background-color="#faf5ff" content-width="660px">
        <Row :cells="[1]" padding="0px">
          <Column padding="40px 20px 24px">
            <Heading
              text="What Our Customers Say"
              level="h2"
              text-align="center"
              color="#3b0764"
              font-size="28px"
            />
            <Text
              text="Trusted by thousands of teams worldwide."
              text-align="center"
              color="#7e22ce"
              font-size="15px"
            />
          </Column>
        </Row>

        <Row :cells="[1,1,1]" padding="0px 8px 40px 8px">
          <!-- Testimonial 1 -->
          <Column padding="24px 20px" background-color="#ffffff" border-radius="12px">
            <Divider border-color="#a855f7" width="40px" />
            <Text
              text="&ldquo;Unlayer Elements cut our email development time by 80%. We went from weeks to hours for new templates.&rdquo;"
              color="#374151"
              font-size="14px"
              line-height="1.6"
            />
            <Divider border-color="#f3f4f6" />
            <Text text="Sarah Chen" color="#111827" font-size="14px" />
            <Text text="CTO, TechFlow" color="#9ca3af" font-size="12px" />
          </Column>

          <!-- Testimonial 2 -->
          <Column padding="24px 20px" background-color="#ffffff" border-radius="12px">
            <Divider border-color="#ec4899" width="40px" />
            <Text
              text="&ldquo;The cross-framework support is incredible. Our Vue and React teams both use the same component API.&rdquo;"
              color="#374151"
              font-size="14px"
              line-height="1.6"
            />
            <Divider border-color="#f3f4f6" />
            <Text text="Marcus Rivera" color="#111827" font-size="14px" />
            <Text text="Lead Developer, Pixel Labs" color="#9ca3af" font-size="12px" />
          </Column>

          <!-- Testimonial 3 -->
          <Column padding="24px 20px" background-color="#ffffff" border-radius="12px">
            <Divider border-color="#6366f1" width="40px" />
            <Text
              text="&ldquo;Best developer experience for email templates I have ever used. The TypeScript support is first-class.&rdquo;"
              color="#374151"
              font-size="14px"
              line-height="1.6"
            />
            <Divider border-color="#f3f4f6" />
            <Text text="Aiko Tanaka" color="#111827" font-size="14px" />
            <Text text="Engineering Lead, Kōdo" color="#9ca3af" font-size="12px" />
          </Column>
        </Row>
      </Body>
    `})},r={render:()=>({components:{Body:a,Row:x,Column:e,Heading:i,Text:l},template:`
      <Body background-color="#ffffff" content-width="660px">
        <!-- Context heading -->
        <Row :cells="[1]" padding="0px">
          <Column padding="40px 20px 16px">
            <Heading
              text="Platform at a Glance"
              level="h2"
              text-align="center"
              color="#0f172a"
              font-size="24px"
            />
            <Text
              text="Real-time numbers from our global infrastructure."
              text-align="center"
              color="#64748b"
              font-size="14px"
            />
          </Column>
        </Row>

        <!-- Stats strip -->
        <Row :cells="[1,1,1,1]" background-color="#0f172a" padding="0px 8px">
          <Column padding="28px 12px" border-radius="0px">
            <Heading
              text="12M+"
              level="h2"
              text-align="center"
              color="#fbbf24"
              font-size="32px"
            />
            <Text
              text="Emails Sent Daily"
              text-align="center"
              color="#94a3b8"
              font-size="11px"
            />
          </Column>
          <Column padding="28px 12px" border-radius="0px">
            <Heading
              text="99.99%"
              level="h2"
              text-align="center"
              color="#34d399"
              font-size="32px"
            />
            <Text
              text="Delivery Rate"
              text-align="center"
              color="#94a3b8"
              font-size="11px"
            />
          </Column>
          <Column padding="28px 12px" border-radius="0px">
            <Heading
              text="50+"
              level="h2"
              text-align="center"
              color="#60a5fa"
              font-size="32px"
            />
            <Text
              text="Components"
              text-align="center"
              color="#94a3b8"
              font-size="11px"
            />
          </Column>
          <Column padding="28px 12px" border-radius="0px">
            <Heading
              text="5"
              level="h2"
              text-align="center"
              color="#f472b6"
              font-size="32px"
            />
            <Text
              text="Frameworks"
              text-align="center"
              color="#94a3b8"
              font-size="11px"
            />
          </Column>
        </Row>

        <!-- Footnote -->
        <Row :cells="[1]" padding="0px">
          <Column padding="16px 20px 40px">
            <Text
              text="Numbers updated in real time. Last refreshed: March 3, 2026."
              text-align="center"
              color="#cbd5e1"
              font-size="11px"
            />
          </Column>
        </Row>
      </Body>
    `})};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    backgroundColor: '#f0f4f8',
    padding: '24px',
    borderRadius: '8px'
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
      <Body background-color="#e2e8f0" content-width="600px">
        <Row :cells="[1]">
          <Column
            :background-color="args.backgroundColor"
            :padding="args.padding"
            :border-radius="args.borderRadius"
          >
            <Heading text="Column Playground" level="h2" color="#1e293b" />
            <Text
              text="Adjust the Column properties using the controls below. Change the background color, padding, and border radius to see how the Column adapts."
              color="#64748b"
              font-size="14px"
            />
            <Button
              text="Sample Button"
              href="#"
              background-color="#6366f1"
              text-color="#ffffff"
              border-radius="6px"
            />
          </Column>
        </Row>
      </Body>
    \`
  })
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
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
      <Body background-color="#f8fafc" content-width="660px">
        <Row :cells="[1]" padding="0px">
          <Column padding="40px 20px 24px">
            <Heading
              text="Simple, Transparent Pricing"
              level="h1"
              text-align="center"
              color="#0f172a"
              font-size="30px"
            />
            <Text
              text="No hidden fees. No surprises. Pick the plan that fits your team."
              text-align="center"
              color="#64748b"
              font-size="15px"
            />
          </Column>
        </Row>

        <Row :cells="[1,1,1]" padding="0px 8px 40px 8px">
          <!-- Starter -->
          <Column padding="28px 20px" background-color="#ffffff" border-radius="12px">
            <Text text="STARTER" text-align="center" color="#94a3b8" font-size="12px" />
            <Heading text="$0" level="h2" text-align="center" color="#0f172a" font-size="40px" />
            <Text text="per month" text-align="center" color="#94a3b8" font-size="13px" />
            <Divider border-color="#f1f5f9" />
            <Text text="5 templates" text-align="center" color="#475569" font-size="13px" />
            <Text text="1 team member" text-align="center" color="#475569" font-size="13px" />
            <Text text="Community support" text-align="center" color="#475569" font-size="13px" />
            <Text text="Web export only" text-align="center" color="#475569" font-size="13px" />
            <Button
              text="Get Started"
              href="#"
              background-color="#f1f5f9"
              text-color="#475569"
              border-radius="8px"
              padding="10px 0px"
              full-width="true"
            />
          </Column>

          <!-- Pro (featured) -->
          <Column padding="28px 20px" background-color="#0f172a" border-radius="12px">
            <Text text="PRO" text-align="center" color="#818cf8" font-size="12px" />
            <Heading text="$29" level="h2" text-align="center" color="#ffffff" font-size="40px" />
            <Text text="per month" text-align="center" color="#64748b" font-size="13px" />
            <Divider border-color="#1e293b" />
            <Text text="Unlimited templates" text-align="center" color="#cbd5e1" font-size="13px" />
            <Text text="5 team members" text-align="center" color="#cbd5e1" font-size="13px" />
            <Text text="Priority support" text-align="center" color="#cbd5e1" font-size="13px" />
            <Text text="All export formats" text-align="center" color="#cbd5e1" font-size="13px" />
            <Button
              text="Start Free Trial"
              href="#"
              background-color="#6366f1"
              text-color="#ffffff"
              border-radius="8px"
              padding="10px 0px"
              full-width="true"
            />
          </Column>

          <!-- Enterprise -->
          <Column padding="28px 20px" background-color="#ffffff" border-radius="12px">
            <Text text="ENTERPRISE" text-align="center" color="#94a3b8" font-size="12px" />
            <Heading text="Custom" level="h2" text-align="center" color="#0f172a" font-size="40px" />
            <Text text="per year" text-align="center" color="#94a3b8" font-size="13px" />
            <Divider border-color="#f1f5f9" />
            <Text text="Everything in Pro" text-align="center" color="#475569" font-size="13px" />
            <Text text="Unlimited members" text-align="center" color="#475569" font-size="13px" />
            <Text text="Dedicated support" text-align="center" color="#475569" font-size="13px" />
            <Text text="Custom integrations" text-align="center" color="#475569" font-size="13px" />
            <Button
              text="Contact Sales"
              href="#"
              background-color="#f1f5f9"
              text-color="#475569"
              border-radius="8px"
              padding="10px 0px"
              full-width="true"
            />
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
      Divider
    },
    template: \`
      <Body background-color="#faf5ff" content-width="660px">
        <Row :cells="[1]" padding="0px">
          <Column padding="40px 20px 24px">
            <Heading
              text="What Our Customers Say"
              level="h2"
              text-align="center"
              color="#3b0764"
              font-size="28px"
            />
            <Text
              text="Trusted by thousands of teams worldwide."
              text-align="center"
              color="#7e22ce"
              font-size="15px"
            />
          </Column>
        </Row>

        <Row :cells="[1,1,1]" padding="0px 8px 40px 8px">
          <!-- Testimonial 1 -->
          <Column padding="24px 20px" background-color="#ffffff" border-radius="12px">
            <Divider border-color="#a855f7" width="40px" />
            <Text
              text="&ldquo;Unlayer Elements cut our email development time by 80%. We went from weeks to hours for new templates.&rdquo;"
              color="#374151"
              font-size="14px"
              line-height="1.6"
            />
            <Divider border-color="#f3f4f6" />
            <Text text="Sarah Chen" color="#111827" font-size="14px" />
            <Text text="CTO, TechFlow" color="#9ca3af" font-size="12px" />
          </Column>

          <!-- Testimonial 2 -->
          <Column padding="24px 20px" background-color="#ffffff" border-radius="12px">
            <Divider border-color="#ec4899" width="40px" />
            <Text
              text="&ldquo;The cross-framework support is incredible. Our Vue and React teams both use the same component API.&rdquo;"
              color="#374151"
              font-size="14px"
              line-height="1.6"
            />
            <Divider border-color="#f3f4f6" />
            <Text text="Marcus Rivera" color="#111827" font-size="14px" />
            <Text text="Lead Developer, Pixel Labs" color="#9ca3af" font-size="12px" />
          </Column>

          <!-- Testimonial 3 -->
          <Column padding="24px 20px" background-color="#ffffff" border-radius="12px">
            <Divider border-color="#6366f1" width="40px" />
            <Text
              text="&ldquo;Best developer experience for email templates I have ever used. The TypeScript support is first-class.&rdquo;"
              color="#374151"
              font-size="14px"
              line-height="1.6"
            />
            <Divider border-color="#f3f4f6" />
            <Text text="Aiko Tanaka" color="#111827" font-size="14px" />
            <Text text="Engineering Lead, Kōdo" color="#9ca3af" font-size="12px" />
          </Column>
        </Row>
      </Body>
    \`
  })
}`,...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Body,
      Row,
      Column,
      Heading,
      Text
    },
    template: \`
      <Body background-color="#ffffff" content-width="660px">
        <!-- Context heading -->
        <Row :cells="[1]" padding="0px">
          <Column padding="40px 20px 16px">
            <Heading
              text="Platform at a Glance"
              level="h2"
              text-align="center"
              color="#0f172a"
              font-size="24px"
            />
            <Text
              text="Real-time numbers from our global infrastructure."
              text-align="center"
              color="#64748b"
              font-size="14px"
            />
          </Column>
        </Row>

        <!-- Stats strip -->
        <Row :cells="[1,1,1,1]" background-color="#0f172a" padding="0px 8px">
          <Column padding="28px 12px" border-radius="0px">
            <Heading
              text="12M+"
              level="h2"
              text-align="center"
              color="#fbbf24"
              font-size="32px"
            />
            <Text
              text="Emails Sent Daily"
              text-align="center"
              color="#94a3b8"
              font-size="11px"
            />
          </Column>
          <Column padding="28px 12px" border-radius="0px">
            <Heading
              text="99.99%"
              level="h2"
              text-align="center"
              color="#34d399"
              font-size="32px"
            />
            <Text
              text="Delivery Rate"
              text-align="center"
              color="#94a3b8"
              font-size="11px"
            />
          </Column>
          <Column padding="28px 12px" border-radius="0px">
            <Heading
              text="50+"
              level="h2"
              text-align="center"
              color="#60a5fa"
              font-size="32px"
            />
            <Text
              text="Components"
              text-align="center"
              color="#94a3b8"
              font-size="11px"
            />
          </Column>
          <Column padding="28px 12px" border-radius="0px">
            <Heading
              text="5"
              level="h2"
              text-align="center"
              color="#f472b6"
              font-size="32px"
            />
            <Text
              text="Frameworks"
              text-align="center"
              color="#94a3b8"
              font-size="11px"
            />
          </Column>
        </Row>

        <!-- Footnote -->
        <Row :cells="[1]" padding="0px">
          <Column padding="16px 20px 40px">
            <Text
              text="Numbers updated in real time. Last refreshed: March 3, 2026."
              text-align="center"
              color="#cbd5e1"
              font-size="11px"
            />
          </Column>
        </Row>
      </Body>
    \`
  })
}`,...r.parameters?.docs?.source}}};const w=["Playground","PricingCards","TestimonialCards","StatsBar"];export{t as Playground,n as PricingCards,r as StatsBar,o as TestimonialCards,w as __namedExportsOrder,z as default};
