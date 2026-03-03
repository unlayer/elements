import{c as w,w as f,m as p}from"./create-component-D1merdym.js";import{B as g}from"./Button-Dpxp_fCE.js";import{T as b}from"./Text-Bju3ph6h.js";import{H as h}from"./Heading-BlN1fPTG.js";import{C as v,R as y,B as x}from"./Column-BthB5a2A.js";import"./iframe-BMyXcb8A.js";import"./preload-helper-PPVm8Dsz.js";import"./index-8x7ipbY-.js";const m={type:"youtube",videoId:"",thumbnail:"",loading:!1},u={video:m};function V(e){const o=e.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);if(o){const a=o[1];return{type:"youtube",videoId:a,thumbnail:`https://img.youtube.com/vi/${a}/0.jpg`}}const r=e.match(/vimeo\.com\/(\d+)/);return r?{type:"vimeo",videoId:r[1],thumbnail:""}:null}const t=w({name:"Video",defaultValues:u,propMapper:e=>{const{videoUrl:o,...r}=e;if(typeof o=="string"){const a=V(o),c=p(r,u,"Video");return a&&(c.video={...m,...a}),c}return p(e,u,"Video")},exporters:f}),P={title:"Components/Video",component:t,parameters:{layout:"centered",docs:{description:{component:"Embeds video players with thumbnail fallbacks for email compatibility. Supports YouTube and Vimeo sources with responsive sizing. In email mode, renders a clickable thumbnail image instead of an iframe."}}},argTypes:{values:{description:"Video configuration including source URL, thumbnail, and player type.",control:!1,table:{type:{summary:"VideoValues",detail:`{
  video: {
    type: "youtube" | "vimeo";
    videoId: string;
    url: string;
    thumbnail: string;
    loading: boolean;
  };
  containerPadding?: string;
  textAlign?: string;
  href?: { url: string; target: string };
}`}}},mode:{control:{type:"select"},options:["web","email","document"],description:"Rendering mode. Email mode produces a clickable thumbnail instead of an iframe.",table:{defaultValue:{summary:"web"},type:{summary:"RenderMode"}}}},tags:["autodocs"]},n={render:()=>({components:{Video:t},template:`
      <div style="width: 600px; margin: 0 auto;">
        <Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" mode="web" />
      </div>
    `}),parameters:{docs:{description:{story:'**Shorthand API** -- pass a YouTube or Vimeo URL and the component auto-parses the video ID and thumbnail.\n\n```html\n<Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />\n```'}}}},i={render:()=>({components:{Video:t},setup(){return{values:{video:{loading:!1,type:"youtube",videoId:"dQw4w9WgXcQ",thumbnail:"https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",url:"https://www.youtube.com/watch?v=dQw4w9WgXcQ"},containerPadding:"10px"}}},template:`
      <div style="width: 600px; margin: 0 auto;">
        <Video :values="values" mode="web" />
      </div>
    `}),parameters:{docs:{description:{story:"**Full Control** -- use the `values` prop for complete exporter-format control."}}}},d={render:()=>({components:{Body:x,Row:y,Column:v,Heading:h,Text:b,Button:g,Video:t},setup(){return{videoValues:{video:{loading:!1,type:"youtube",videoId:"dQw4w9WgXcQ",thumbnail:"https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",url:"https://www.youtube.com/watch?v=dQw4w9WgXcQ"},href:{url:"https://www.youtube.com/watch?v=dQw4w9WgXcQ",target:"_blank"},textAlign:"center",containerPadding:"0"}}},template:`
      <Body mode="email" background-color="#f1f5f9" content-width="600px">
        <!-- Header -->
        <Row :cells="[1]" background-color="#0f172a" padding="48px 40px 40px">
          <Column>
            <Heading
              text="Introducing Pulse 2.0"
              level="h1"
              font-size="36px"
              color="#ffffff"
              text-align="center"
            />
            <Text
              text="The fastest way to build, ship, and measure."
              font-size="18px"
              color="#94a3b8"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Video -->
        <Row :cells="[1]" background-color="#ffffff" padding="32px 40px 24px">
          <Column>
            <Video :values="videoValues" />
          </Column>
        </Row>

        <!-- Description -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 40px 32px">
          <Column>
            <Text
              text="Watch the 2-minute walkthrough to see how Pulse 2.0 cuts your build-to-deploy cycle in half with real-time analytics, one-click staging, and zero-config CI."
              font-size="16px"
              color="#475569"
              text-align="center"
            />
            <Button
              text="Start Free Trial"
              href="https://example.com/get-started"
              background-color="#2563eb"
              text-color="#ffffff"
              border-radius="8px"
              padding="16px 40px"
            />
          </Column>
        </Row>

        <!-- Footer -->
        <Row :cells="[1]" background-color="#f8fafc" padding="24px 40px">
          <Column>
            <Text
              text="Pulse Inc. | San Francisco, CA | Unsubscribe"
              font-size="12px"
              color="#94a3b8"
              text-align="center"
            />
          </Column>
        </Row>
      </Body>
    `}),parameters:{layout:"fullscreen",docs:{description:{story:"A complete product launch email with a dark header, embedded video, description text, and CTA button. In email mode, the video renders as a clickable thumbnail safe for all email clients."}}}},s={render:()=>({components:{Video:t},setup(){return{values:{video:{loading:!1,type:"youtube",videoId:"9bZkp7q19f0",thumbnail:"https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg",url:"https://www.youtube.com/watch?v=9bZkp7q19f0"},textAlign:"center",containerPadding:"0px"}}},template:`
      <div style="width: 600px; margin: 0 auto;">
        <Video :values="values" mode="web" />
      </div>
    `}),parameters:{docs:{description:{story:"A clean YouTube embed with zero padding, centered in a 600px container. Renders as a live iframe player in web mode."}}}},l={render:()=>({components:{Video:t},setup(){return{values:{video:{loading:!1,type:"youtube",videoId:"jNQXAC9IVRw",thumbnail:"https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg",url:"https://www.youtube.com/watch?v=jNQXAC9IVRw"},href:{url:"https://www.youtube.com/watch?v=jNQXAC9IVRw",target:"_blank"},textAlign:"center",containerPadding:"20px"}}},template:`
      <div style="width: 600px; margin: 0 auto; background-color: #f1f5f9; padding: 24px; border-radius: 8px;">
        <Video :values="values" mode="email" />
      </div>
    `}),parameters:{docs:{description:{story:"In email mode, the video renders as a thumbnail image with a play button overlay that links to the video URL. This is the only reliable way to include video content in email clients, since iframes are stripped by most providers."}}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Video
    },
    template: \`
      <div style="width: 600px; margin: 0 auto;">
        <Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" mode="web" />
      </div>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: \`**Shorthand API** -- pass a YouTube or Vimeo URL and the component auto-parses the video ID and thumbnail.

\\\`\\\`\\\`html
<Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
\\\`\\\`\\\`\`
      }
    }
  }
}`,...n.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Video
    },
    setup() {
      const values = {
        video: {
          loading: false,
          type: 'youtube',
          videoId: 'dQw4w9WgXcQ',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        },
        containerPadding: '10px'
      };
      return {
        values
      };
    },
    template: \`
      <div style="width: 600px; margin: 0 auto;">
        <Video :values="values" mode="web" />
      </div>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: '**Full Control** -- use the \`values\` prop for complete exporter-format control.'
      }
    }
  }
}`,...i.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Body,
      Row,
      Column,
      Heading,
      Text,
      Button,
      Video
    },
    setup() {
      const videoValues = {
        video: {
          loading: false,
          type: 'youtube',
          videoId: 'dQw4w9WgXcQ',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        },
        href: {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          target: '_blank'
        },
        textAlign: 'center',
        containerPadding: '0'
      };
      return {
        videoValues
      };
    },
    template: \`
      <Body mode="email" background-color="#f1f5f9" content-width="600px">
        <!-- Header -->
        <Row :cells="[1]" background-color="#0f172a" padding="48px 40px 40px">
          <Column>
            <Heading
              text="Introducing Pulse 2.0"
              level="h1"
              font-size="36px"
              color="#ffffff"
              text-align="center"
            />
            <Text
              text="The fastest way to build, ship, and measure."
              font-size="18px"
              color="#94a3b8"
              text-align="center"
            />
          </Column>
        </Row>

        <!-- Video -->
        <Row :cells="[1]" background-color="#ffffff" padding="32px 40px 24px">
          <Column>
            <Video :values="videoValues" />
          </Column>
        </Row>

        <!-- Description -->
        <Row :cells="[1]" background-color="#ffffff" padding="0 40px 32px">
          <Column>
            <Text
              text="Watch the 2-minute walkthrough to see how Pulse 2.0 cuts your build-to-deploy cycle in half with real-time analytics, one-click staging, and zero-config CI."
              font-size="16px"
              color="#475569"
              text-align="center"
            />
            <Button
              text="Start Free Trial"
              href="https://example.com/get-started"
              background-color="#2563eb"
              text-color="#ffffff"
              border-radius="8px"
              padding="16px 40px"
            />
          </Column>
        </Row>

        <!-- Footer -->
        <Row :cells="[1]" background-color="#f8fafc" padding="24px 40px">
          <Column>
            <Text
              text="Pulse Inc. | San Francisco, CA | Unsubscribe"
              font-size="12px"
              color="#94a3b8"
              text-align="center"
            />
          </Column>
        </Row>
      </Body>
    \`
  }),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'A complete product launch email with a dark header, embedded video, description text, and CTA button. ' + 'In email mode, the video renders as a clickable thumbnail safe for all email clients.'
      }
    }
  }
}`,...d.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Video
    },
    setup() {
      const values = {
        video: {
          loading: false,
          type: 'youtube',
          videoId: '9bZkp7q19f0',
          thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
          url: 'https://www.youtube.com/watch?v=9bZkp7q19f0'
        },
        textAlign: 'center',
        containerPadding: '0px'
      };
      return {
        values
      };
    },
    template: \`
      <div style="width: 600px; margin: 0 auto;">
        <Video :values="values" mode="web" />
      </div>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: 'A clean YouTube embed with zero padding, centered in a 600px container. Renders as a live iframe player in web mode.'
      }
    }
  }
}`,...s.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Video
    },
    setup() {
      const values = {
        video: {
          loading: false,
          type: 'youtube',
          videoId: 'jNQXAC9IVRw',
          thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
          url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
        },
        href: {
          url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
          target: '_blank'
        },
        textAlign: 'center',
        containerPadding: '20px'
      };
      return {
        values
      };
    },
    template: \`
      <div style="width: 600px; margin: 0 auto; background-color: #f1f5f9; padding: 24px; border-radius: 8px;">
        <Video :values="values" mode="email" />
      </div>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: 'In email mode, the video renders as a thumbnail image with a play button overlay ' + 'that links to the video URL. This is the only reliable way to include video content ' + 'in email clients, since iframes are stripped by most providers.'
      }
    }
  }
}`,...l.parameters?.docs?.source}}};const W=["Default","FullValuesAPI","ProductDemo","YouTubeEmbed","EmailVideo"];export{n as Default,l as EmailVideo,i as FullValuesAPI,d as ProductDemo,s as YouTubeEmbed,W as __namedExportsOrder,P as default};
