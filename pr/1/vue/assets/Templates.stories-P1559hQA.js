import{B as e,C as o,R as t}from"./Column-BthB5a2A.js";import{D as n}from"./Divider-CBLHcOXg.js";import{I as r}from"./Image-1zjiVWTH.js";import{B as a}from"./Button-Dpxp_fCE.js";import{T as l}from"./Text-Bju3ph6h.js";import{H as i}from"./Heading-BlN1fPTG.js";import{T as x}from"./Table-DIDKQtAJ.js";import"./iframe-BMyXcb8A.js";import"./preload-helper-PPVm8Dsz.js";import"./create-component-D1merdym.js";import"./index-8x7ipbY-.js";const z={title:"Templates",component:e,parameters:{layout:"fullscreen",docs:{description:{component:"Showcase email templates demonstrating real-world patterns with Unlayer Elements. All render in email mode with preview text."}}},tags:["autodocs"]},s={render:()=>({components:{Body:e,Row:t,Column:o,Heading:i,Text:l,Button:a,Image:r,Divider:n},template:`
      <Body
        mode="email"
        background-color="#f4f4f5"
        content-width="560px"
        preview-text="Welcome aboard! Here's everything you need to get started with Acme."
      >
        <!-- Logo -->
        <Row :cells="[1]" background-color="#ffffff" padding="40px 48px 0 48px">
          <Column>
            <Image
              src="https://placehold.co/120x32/6366f1/ffffff?text=acme"
              alt="Acme Logo"
              width="120px"
            />
          </Column>
        </Row>

        <!-- Greeting -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 48px">
          <Column>
            <Heading
              text="Welcome to Acme"
              level="h1"
              font-size="26px"
              color="#18181b"
              text-align="left"
            />
            <Text
              text="Hi there,<br/><br/>Thanks for signing up! We're thrilled to have you on board. Acme helps teams build, ship, and iterate faster with a modern developer platform."
              font-size="15px"
              color="#3f3f46"
              text-align="left"
            />
          </Column>
        </Row>

        <!-- Feature highlights -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 48px">
          <Column>
            <Divider border-color="#e4e4e7" />
            <Text
              text="<strong>Instant Deployments</strong> -- Push to deploy in seconds with zero-config builds and global CDN distribution."
              font-size="14px"
              color="#52525b"
              text-align="left"
            />
            <Text
              text="<strong>Team Collaboration</strong> -- Preview deployments, branch environments, and comments make team workflows seamless."
              font-size="14px"
              color="#52525b"
              text-align="left"
            />
            <Text
              text="<strong>Built-in Analytics</strong> -- Real-time insights into performance, errors, and usage -- no extra tools needed."
              font-size="14px"
              color="#52525b"
              text-align="left"
            />
            <Divider border-color="#e4e4e7" />
          </Column>
        </Row>

        <!-- CTA -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 48px 40px 48px">
          <Column>
            <Button
              text="Go to Dashboard"
              href="https://example.com/dashboard"
              background-color="#6366f1"
              text-color="#ffffff"
              border-radius="8px"
              padding="14px 28px"
            />
          </Column>
        </Row>

        <!-- Footer -->
        <Row :cells="[1]" padding="24px 48px">
          <Column>
            <Text
              text="Acme Inc. | 123 Innovation Drive, San Francisco, CA 94103<br/>You're receiving this because you signed up for an Acme account."
              font-size="12px"
              color="#a1a1aa"
              text-align="center"
            />
          </Column>
        </Row>
      </Body>
    `}),parameters:{docs:{description:{story:"Welcome/onboarding email -- Stripe-inspired. Clean logo, feature highlights with dividers, indigo CTA button, gray footer."}}}},c={render:()=>({components:{Body:e,Row:t,Column:o,Heading:i,Text:l,Button:a,Image:r,Divider:n},template:`
      <Body
        mode="email"
        background-color="#000000"
        content-width="480px"
        preview-text="Alex invited you to join the Rocket Team on Acme."
      >
        <!-- Logo -->
        <Row :cells="[1]" background-color="#000000" padding="40px 40px 0 40px">
          <Column>
            <Image
              src="https://placehold.co/36x36/ffffff/000000?text=A"
              alt="Acme"
              width="36px"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Invite content -->
        <Row :cells="[1]" background-color="#000000" padding="0 40px">
          <Column>
            <Heading
              text="Join Rocket Team on Acme"
              level="h1"
              font-size="24px"
              color="#ededed"
              text-align="center"
            />
            <Text
              text="<strong>Alex Chen</strong> (alex@acme.dev) has invited you to the <strong>Rocket Team</strong> team on Acme."
              font-size="14px"
              color="#a1a1aa"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Avatars side by side -->
        <Row :cells="[1,1,1]" background-color="#000000" padding="0 40px">
          <Column>
            <Image
              src="https://placehold.co/64x64/6366f1/ffffff?text=AC"
              alt="Alex Chen"
              width="64px"
              text-align="right"
            />
          </Column>
          <Column>
            <Text
              text="-->"
              font-size="24px"
              color="#71717a"
              text-align="center"
            />
          </Column>
          <Column>
            <Image
              src="https://placehold.co/64x64/3f3f46/ededed?text=You"
              alt="You"
              width="64px"
              text-align="left"
            />
          </Column>
        </Row>

        <!-- CTA -->
        <Row :cells="[1]" background-color="#000000" padding="32px 40px 24px 40px">
          <Column>
            <Button
              text="Join the Team"
              href="https://example.com/join"
              background-color="#ededed"
              text-color="#000000"
              border-radius="6px"
              padding="12px 24px"
            />
          </Column>
        </Row>

        <!-- Security note -->
        <Row :cells="[1]" background-color="#000000" padding="0 40px">
          <Column>
            <Divider border-color="#27272a" />
            <Text
              text="This invitation was sent to you@example.com. If you didn't expect it, you can safely ignore this email."
              font-size="12px"
              color="#71717a"
              text-align="center"
            />
          </Column>
        </Row>
      </Body>
    `}),parameters:{docs:{description:{story:"Team invitation email -- Vercel-inspired dark theme. Avatar pair with arrow, light CTA button on black background, security note."}}}},d={render:()=>({components:{Body:e,Row:t,Column:o,Heading:i,Text:l,Button:a,Image:r,Divider:n,Table:x},setup(){return{headers:["Item","Qty","Price"],data:[["Wireless Headphones Pro","1","$249.00"],["USB-C Charging Cable (2m)","2","$38.00"],["Leather Carrying Case","1","$59.00"]]}},template:`
      <Body
        mode="email"
        background-color="#f5f5f7"
        content-width="580px"
        preview-text="Your order #A1029384 has been confirmed. Estimated delivery: Mar 8-10."
      >
        <!-- Logo -->
        <Row :cells="[1]" background-color="#ffffff" padding="36px 48px 0 48px">
          <Column>
            <Image
              src="https://placehold.co/100x28/1d1d1f/ffffff?text=STORE"
              alt="Store"
              width="100px"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Confirmation header -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 48px">
          <Column>
            <Heading
              text="Order Confirmed"
              level="h1"
              font-size="28px"
              color="#1d1d1f"
              text-align="center"
            />
            <Text
              text="Thank you for your purchase. Here's your order summary."
              font-size="15px"
              color="#86868b"
              text-align="center"
            />
            <Divider border-color="#e5e5e7" />
          </Column>
        </Row>

        <!-- Order details table -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 48px">
          <Column>
            <Table :headers="headers" :data="data" mode="email" />
          </Column>
        </Row>

        <!-- Total -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 48px">
          <Column>
            <Divider border-color="#e5e5e7" />
            <Text
              text="<strong>Total: $346.00</strong>"
              font-size="18px"
              color="#1d1d1f"
              text-align="right"
            />
            <Text
              text="Includes $27.68 tax | Free shipping"
              font-size="13px"
              color="#86868b"
              text-align="right"
            />
            <Divider border-color="#e5e5e7" />
          </Column>
        </Row>

        <!-- Shipping info -->
        <Row :cells="[1,1]" background-color="#ffffff" padding="0 48px">
          <Column>
            <Text
              text="<strong>Shipping to</strong><br/>Alex Johnson<br/>123 Main Street<br/>San Francisco, CA 94103"
              font-size="13px"
              color="#6e6e73"
              text-align="left"
            />
          </Column>
          <Column>
            <Text
              text="<strong>Order number</strong><br/>#A1029384<br/><br/><strong>Estimated delivery</strong><br/>March 8-10, 2026"
              font-size="13px"
              color="#6e6e73"
              text-align="left"
            />
          </Column>
        </Row>

        <!-- CTA -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 48px 40px 48px">
          <Column>
            <Button
              text="Track Your Order"
              href="https://example.com/track"
              background-color="#0071e3"
              text-color="#ffffff"
              border-radius="8px"
              padding="14px 28px"
            />
          </Column>
        </Row>

        <!-- Footer -->
        <Row :cells="[1]" padding="24px 48px">
          <Column>
            <Text
              text="Questions? Contact us at support@store.com<br/>Store Inc. | 1 Infinite Loop, Cupertino, CA"
              font-size="12px"
              color="#86868b"
              text-align="center"
            />
          </Column>
        </Row>
      </Body>
    `}),parameters:{docs:{description:{story:"Order confirmation email -- Apple-inspired. Clean white layout with Table component for line items, two-column shipping/order details, blue CTA."}}}},f={render:()=>({components:{Body:e,Row:t,Column:o,Heading:i,Text:l,Button:a,Image:r,Divider:n},template:`
      <Body
        mode="email"
        background-color="#f5f5f5"
        content-width="480px"
        preview-text="Reset your password. This link expires in 60 minutes."
      >
        <!-- Logo -->
        <Row :cells="[1]" background-color="#ffffff" padding="40px 44px 0 44px">
          <Column>
            <Image
              src="https://placehold.co/40x40/0061ff/ffffff?text=V"
              alt="Vault Logo"
              width="40px"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Content -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 44px">
          <Column>
            <Heading
              text="Reset your password"
              level="h1"
              font-size="22px"
              color="#1e1919"
              text-align="center"
            />
            <Text
              text="We received a request to reset the password for the account associated with <strong>user@example.com</strong>."
              font-size="14px"
              color="#637381"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Reset code -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 44px">
          <Column>
            <Text
              text="Your reset code:"
              font-size="13px"
              color="#637381"
              text-align="center"
            />
            <Heading
              text="847 293"
              level="h2"
              font-size="36px"
              color="#0061ff"
              text-align="center"
            />
            <Text
              text="This code expires in <strong>60 minutes</strong>."
              font-size="13px"
              color="#637381"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- CTA button -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 44px">
          <Column>
            <Button
              text="Reset Password"
              href="https://example.com/reset"
              background-color="#0061ff"
              text-color="#ffffff"
              border-radius="8px"
              padding="14px 28px"
            />
          </Column>
        </Row>

        <!-- Security tips -->
        <Row :cells="[1]" background-color="#ffffff" padding="24px 44px 36px 44px">
          <Column>
            <Divider border-color="#e5e5e5" />
            <Text
              text="<strong>Didn't request this?</strong><br/>If you didn't request a password reset, you can safely ignore this email. Your password won't change unless you click the link above."
              font-size="13px"
              color="#919eab"
              text-align="center"
            />
            <Text
              text="<strong>Security tips:</strong> Never share your reset code. Vault will never ask for your password via email. Enable two-factor authentication for extra protection."
              font-size="12px"
              color="#919eab"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Footer -->
        <Row :cells="[1]" padding="20px 44px">
          <Column>
            <Text
              text="Vault Inc. | 185 Berry Street, Suite 550, San Francisco, CA 94107"
              font-size="11px"
              color="#b0b0b0"
              text-align="center"
            />
          </Column>
        </Row>
      </Body>
    `}),parameters:{docs:{description:{story:"Password reset email -- Dropbox-inspired. Blue logo, large monospace reset code, 60-minute expiry notice, security tips."}}}},p={render:()=>({components:{Body:e,Row:t,Column:o,Heading:i,Text:l,Button:a,Image:r,Divider:n},template:`
      <Body
        mode="email"
        background-color="#f7f7f7"
        content-width="540px"
        preview-text="How was your stay at the Sunset Villa? Share your experience!"
      >
        <!-- Hero image -->
        <Row :cells="[1]" background-color="#ffffff" padding="0">
          <Column>
            <Image
              src="https://placehold.co/540x260/e0f2fe/0c4a6e?text=Sunset+Villa"
              alt="Sunset Villa"
              width="100%"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Prompt -->
        <Row :cells="[1]" background-color="#ffffff" padding="32px 44px 0 44px">
          <Column>
            <Heading
              text="How was your stay?"
              level="h1"
              font-size="24px"
              color="#222222"
              text-align="center"
            />
            <Text
              text="You checked out of <strong>Sunset Villa</strong> on February 28. Your review helps future guests and supports your host, Maria."
              font-size="15px"
              color="#717171"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Host avatar + name -->
        <Row :cells="[1]" background-color="#ffffff" padding="16px 44px 0 44px">
          <Column>
            <Image
              src="https://placehold.co/72x72/ff385c/ffffff?text=M"
              alt="Maria - Host"
              width="72px"
              text-align="center"
            />
            <Text
              text="Hosted by <strong>Maria</strong>"
              font-size="14px"
              color="#717171"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- CTA -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 44px 36px 44px">
          <Column>
            <Button
              text="Write a Review"
              href="https://example.com/review"
              background-color="#ff385c"
              text-color="#ffffff"
              border-radius="8px"
              padding="14px 28px"
            />
          </Column>
        </Row>

        <!-- Reminder note -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 44px 32px 44px">
          <Column>
            <Divider border-color="#ebebeb" />
            <Text
              text="Reviews must be submitted within 14 days of checkout. Your honest feedback -- positive or constructive -- helps our community."
              font-size="13px"
              color="#b0b0b0"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Footer -->
        <Row :cells="[1]" padding="20px 44px">
          <Column>
            <Text
              text="Sent by StayBnB | 888 Hospitality Blvd, San Francisco, CA<br/>Manage your notification preferences in account settings."
              font-size="11px"
              color="#b0b0b0"
              text-align="center"
            />
          </Column>
        </Row>
      </Body>
    `}),parameters:{docs:{description:{story:"Review request email -- Airbnb-inspired. Hero property image, circular host avatar, red CTA button (#ff385c), 14-day reminder."}}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
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
      <Body
        mode="email"
        background-color="#f4f4f5"
        content-width="560px"
        preview-text="Welcome aboard! Here's everything you need to get started with Acme."
      >
        <!-- Logo -->
        <Row :cells="[1]" background-color="#ffffff" padding="40px 48px 0 48px">
          <Column>
            <Image
              src="https://placehold.co/120x32/6366f1/ffffff?text=acme"
              alt="Acme Logo"
              width="120px"
            />
          </Column>
        </Row>

        <!-- Greeting -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 48px">
          <Column>
            <Heading
              text="Welcome to Acme"
              level="h1"
              font-size="26px"
              color="#18181b"
              text-align="left"
            />
            <Text
              text="Hi there,<br/><br/>Thanks for signing up! We're thrilled to have you on board. Acme helps teams build, ship, and iterate faster with a modern developer platform."
              font-size="15px"
              color="#3f3f46"
              text-align="left"
            />
          </Column>
        </Row>

        <!-- Feature highlights -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 48px">
          <Column>
            <Divider border-color="#e4e4e7" />
            <Text
              text="<strong>Instant Deployments</strong> -- Push to deploy in seconds with zero-config builds and global CDN distribution."
              font-size="14px"
              color="#52525b"
              text-align="left"
            />
            <Text
              text="<strong>Team Collaboration</strong> -- Preview deployments, branch environments, and comments make team workflows seamless."
              font-size="14px"
              color="#52525b"
              text-align="left"
            />
            <Text
              text="<strong>Built-in Analytics</strong> -- Real-time insights into performance, errors, and usage -- no extra tools needed."
              font-size="14px"
              color="#52525b"
              text-align="left"
            />
            <Divider border-color="#e4e4e7" />
          </Column>
        </Row>

        <!-- CTA -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 48px 40px 48px">
          <Column>
            <Button
              text="Go to Dashboard"
              href="https://example.com/dashboard"
              background-color="#6366f1"
              text-color="#ffffff"
              border-radius="8px"
              padding="14px 28px"
            />
          </Column>
        </Row>

        <!-- Footer -->
        <Row :cells="[1]" padding="24px 48px">
          <Column>
            <Text
              text="Acme Inc. | 123 Innovation Drive, San Francisco, CA 94103<br/>You're receiving this because you signed up for an Acme account."
              font-size="12px"
              color="#a1a1aa"
              text-align="center"
            />
          </Column>
        </Row>
      </Body>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: 'Welcome/onboarding email -- Stripe-inspired. Clean logo, feature highlights with dividers, indigo CTA button, gray footer.'
      }
    }
  }
}`,...s.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
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
      <Body
        mode="email"
        background-color="#000000"
        content-width="480px"
        preview-text="Alex invited you to join the Rocket Team on Acme."
      >
        <!-- Logo -->
        <Row :cells="[1]" background-color="#000000" padding="40px 40px 0 40px">
          <Column>
            <Image
              src="https://placehold.co/36x36/ffffff/000000?text=A"
              alt="Acme"
              width="36px"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Invite content -->
        <Row :cells="[1]" background-color="#000000" padding="0 40px">
          <Column>
            <Heading
              text="Join Rocket Team on Acme"
              level="h1"
              font-size="24px"
              color="#ededed"
              text-align="center"
            />
            <Text
              text="<strong>Alex Chen</strong> (alex@acme.dev) has invited you to the <strong>Rocket Team</strong> team on Acme."
              font-size="14px"
              color="#a1a1aa"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Avatars side by side -->
        <Row :cells="[1,1,1]" background-color="#000000" padding="0 40px">
          <Column>
            <Image
              src="https://placehold.co/64x64/6366f1/ffffff?text=AC"
              alt="Alex Chen"
              width="64px"
              text-align="right"
            />
          </Column>
          <Column>
            <Text
              text="-->"
              font-size="24px"
              color="#71717a"
              text-align="center"
            />
          </Column>
          <Column>
            <Image
              src="https://placehold.co/64x64/3f3f46/ededed?text=You"
              alt="You"
              width="64px"
              text-align="left"
            />
          </Column>
        </Row>

        <!-- CTA -->
        <Row :cells="[1]" background-color="#000000" padding="32px 40px 24px 40px">
          <Column>
            <Button
              text="Join the Team"
              href="https://example.com/join"
              background-color="#ededed"
              text-color="#000000"
              border-radius="6px"
              padding="12px 24px"
            />
          </Column>
        </Row>

        <!-- Security note -->
        <Row :cells="[1]" background-color="#000000" padding="0 40px">
          <Column>
            <Divider border-color="#27272a" />
            <Text
              text="This invitation was sent to you@example.com. If you didn't expect it, you can safely ignore this email."
              font-size="12px"
              color="#71717a"
              text-align="center"
            />
          </Column>
        </Row>
      </Body>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: 'Team invitation email -- Vercel-inspired dark theme. Avatar pair with arrow, light CTA button on black background, security note.'
      }
    }
  }
}`,...c.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Body,
      Row,
      Column,
      Heading,
      Text,
      Button,
      Image,
      Divider,
      Table
    },
    setup() {
      const headers = ['Item', 'Qty', 'Price'];
      const data = [['Wireless Headphones Pro', '1', '$249.00'], ['USB-C Charging Cable (2m)', '2', '$38.00'], ['Leather Carrying Case', '1', '$59.00']];
      return {
        headers,
        data
      };
    },
    template: \`
      <Body
        mode="email"
        background-color="#f5f5f7"
        content-width="580px"
        preview-text="Your order #A1029384 has been confirmed. Estimated delivery: Mar 8-10."
      >
        <!-- Logo -->
        <Row :cells="[1]" background-color="#ffffff" padding="36px 48px 0 48px">
          <Column>
            <Image
              src="https://placehold.co/100x28/1d1d1f/ffffff?text=STORE"
              alt="Store"
              width="100px"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Confirmation header -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 48px">
          <Column>
            <Heading
              text="Order Confirmed"
              level="h1"
              font-size="28px"
              color="#1d1d1f"
              text-align="center"
            />
            <Text
              text="Thank you for your purchase. Here's your order summary."
              font-size="15px"
              color="#86868b"
              text-align="center"
            />
            <Divider border-color="#e5e5e7" />
          </Column>
        </Row>

        <!-- Order details table -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 48px">
          <Column>
            <Table :headers="headers" :data="data" mode="email" />
          </Column>
        </Row>

        <!-- Total -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 48px">
          <Column>
            <Divider border-color="#e5e5e7" />
            <Text
              text="<strong>Total: $346.00</strong>"
              font-size="18px"
              color="#1d1d1f"
              text-align="right"
            />
            <Text
              text="Includes $27.68 tax | Free shipping"
              font-size="13px"
              color="#86868b"
              text-align="right"
            />
            <Divider border-color="#e5e5e7" />
          </Column>
        </Row>

        <!-- Shipping info -->
        <Row :cells="[1,1]" background-color="#ffffff" padding="0 48px">
          <Column>
            <Text
              text="<strong>Shipping to</strong><br/>Alex Johnson<br/>123 Main Street<br/>San Francisco, CA 94103"
              font-size="13px"
              color="#6e6e73"
              text-align="left"
            />
          </Column>
          <Column>
            <Text
              text="<strong>Order number</strong><br/>#A1029384<br/><br/><strong>Estimated delivery</strong><br/>March 8-10, 2026"
              font-size="13px"
              color="#6e6e73"
              text-align="left"
            />
          </Column>
        </Row>

        <!-- CTA -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 48px 40px 48px">
          <Column>
            <Button
              text="Track Your Order"
              href="https://example.com/track"
              background-color="#0071e3"
              text-color="#ffffff"
              border-radius="8px"
              padding="14px 28px"
            />
          </Column>
        </Row>

        <!-- Footer -->
        <Row :cells="[1]" padding="24px 48px">
          <Column>
            <Text
              text="Questions? Contact us at support@store.com<br/>Store Inc. | 1 Infinite Loop, Cupertino, CA"
              font-size="12px"
              color="#86868b"
              text-align="center"
            />
          </Column>
        </Row>
      </Body>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: 'Order confirmation email -- Apple-inspired. Clean white layout with Table component for line items, two-column shipping/order details, blue CTA.'
      }
    }
  }
}`,...d.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
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
      <Body
        mode="email"
        background-color="#f5f5f5"
        content-width="480px"
        preview-text="Reset your password. This link expires in 60 minutes."
      >
        <!-- Logo -->
        <Row :cells="[1]" background-color="#ffffff" padding="40px 44px 0 44px">
          <Column>
            <Image
              src="https://placehold.co/40x40/0061ff/ffffff?text=V"
              alt="Vault Logo"
              width="40px"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Content -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 44px">
          <Column>
            <Heading
              text="Reset your password"
              level="h1"
              font-size="22px"
              color="#1e1919"
              text-align="center"
            />
            <Text
              text="We received a request to reset the password for the account associated with <strong>user@example.com</strong>."
              font-size="14px"
              color="#637381"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Reset code -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 44px">
          <Column>
            <Text
              text="Your reset code:"
              font-size="13px"
              color="#637381"
              text-align="center"
            />
            <Heading
              text="847 293"
              level="h2"
              font-size="36px"
              color="#0061ff"
              text-align="center"
            />
            <Text
              text="This code expires in <strong>60 minutes</strong>."
              font-size="13px"
              color="#637381"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- CTA button -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 44px">
          <Column>
            <Button
              text="Reset Password"
              href="https://example.com/reset"
              background-color="#0061ff"
              text-color="#ffffff"
              border-radius="8px"
              padding="14px 28px"
            />
          </Column>
        </Row>

        <!-- Security tips -->
        <Row :cells="[1]" background-color="#ffffff" padding="24px 44px 36px 44px">
          <Column>
            <Divider border-color="#e5e5e5" />
            <Text
              text="<strong>Didn't request this?</strong><br/>If you didn't request a password reset, you can safely ignore this email. Your password won't change unless you click the link above."
              font-size="13px"
              color="#919eab"
              text-align="center"
            />
            <Text
              text="<strong>Security tips:</strong> Never share your reset code. Vault will never ask for your password via email. Enable two-factor authentication for extra protection."
              font-size="12px"
              color="#919eab"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Footer -->
        <Row :cells="[1]" padding="20px 44px">
          <Column>
            <Text
              text="Vault Inc. | 185 Berry Street, Suite 550, San Francisco, CA 94107"
              font-size="11px"
              color="#b0b0b0"
              text-align="center"
            />
          </Column>
        </Row>
      </Body>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: 'Password reset email -- Dropbox-inspired. Blue logo, large monospace reset code, 60-minute expiry notice, security tips.'
      }
    }
  }
}`,...f.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
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
      <Body
        mode="email"
        background-color="#f7f7f7"
        content-width="540px"
        preview-text="How was your stay at the Sunset Villa? Share your experience!"
      >
        <!-- Hero image -->
        <Row :cells="[1]" background-color="#ffffff" padding="0">
          <Column>
            <Image
              src="https://placehold.co/540x260/e0f2fe/0c4a6e?text=Sunset+Villa"
              alt="Sunset Villa"
              width="100%"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Prompt -->
        <Row :cells="[1]" background-color="#ffffff" padding="32px 44px 0 44px">
          <Column>
            <Heading
              text="How was your stay?"
              level="h1"
              font-size="24px"
              color="#222222"
              text-align="center"
            />
            <Text
              text="You checked out of <strong>Sunset Villa</strong> on February 28. Your review helps future guests and supports your host, Maria."
              font-size="15px"
              color="#717171"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Host avatar + name -->
        <Row :cells="[1]" background-color="#ffffff" padding="16px 44px 0 44px">
          <Column>
            <Image
              src="https://placehold.co/72x72/ff385c/ffffff?text=M"
              alt="Maria - Host"
              width="72px"
              text-align="center"
            />
            <Text
              text="Hosted by <strong>Maria</strong>"
              font-size="14px"
              color="#717171"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- CTA -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 44px 36px 44px">
          <Column>
            <Button
              text="Write a Review"
              href="https://example.com/review"
              background-color="#ff385c"
              text-color="#ffffff"
              border-radius="8px"
              padding="14px 28px"
            />
          </Column>
        </Row>

        <!-- Reminder note -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 44px 32px 44px">
          <Column>
            <Divider border-color="#ebebeb" />
            <Text
              text="Reviews must be submitted within 14 days of checkout. Your honest feedback -- positive or constructive -- helps our community."
              font-size="13px"
              color="#b0b0b0"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Footer -->
        <Row :cells="[1]" padding="20px 44px">
          <Column>
            <Text
              text="Sent by StayBnB | 888 Hospitality Blvd, San Francisco, CA<br/>Manage your notification preferences in account settings."
              font-size="11px"
              color="#b0b0b0"
              text-align="center"
            />
          </Column>
        </Row>
      </Body>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: 'Review request email -- Airbnb-inspired. Hero property image, circular host avatar, red CTA button (#ff385c), 14-day reminder.'
      }
    }
  }
}`,...p.parameters?.docs?.source}}};const B=["WelcomeEmail","TeamInvite","OrderConfirmation","PasswordReset","ReviewRequest"];export{d as OrderConfirmation,f as PasswordReset,p as ReviewRequest,c as TeamInvite,s as WelcomeEmail,B as __namedExportsOrder,z as default};
