import{j as e}from"./jsx-runtime-DVFAqOo8.js";import{c as x,p as v,y as f,m as w,C as i}from"./create-component-BG9UH6gc.js";import{U as Q,B as C}from"./Body-CQzvqPlz.js";import{R as r,C as d}from"./Column-uWZfzNUv.js";import{H as P}from"./Heading-DK3O1MA9.js";import{P as h}from"./Paragraph-AbI-4eQp.js";import{B as A}from"./Button-B4tF6TL2.js";import"./iframe-D6WVpXXw.js";import"./preload-helper-PPVm8Dsz.js";const b={type:"youtube",videoId:"",thumbnail:"",loading:!1,...f.video},g={...f,video:b};function j(o){const n=o.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|(?:embed|shorts|live)\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);if(n){const t=n[1];return{type:"youtube",videoId:t,thumbnail:`https://img.youtube.com/vi/${t}/0.jpg`,url:o}}const a=o.match(/vimeo\.com\/(\d+)/);return a?{type:"vimeo",videoId:a[1],thumbnail:"",url:o}:null}const y=x({name:"Video",defaultValues:g,propMapper:o=>{const{videoUrl:n,...a}=o;if(typeof n=="string"){const t=j(n),p=w(a,g,"Video");return t?p.video={...b,...t,...p.video}:console.warn(`[Unlayer] <Video videoUrl="${n}"> is not a recognized YouTube/Vimeo URL — the block renders the placeholder video. Pass values={{ video: { type, videoId, thumbnail, url } }} for other providers.`),p}return w(o,g,"Video")},displayName:"Video",exporters:v}),F={title:"Components/Video",component:y,parameters:{layout:"centered",docs:{description:{component:"Embeds video players with thumbnail fallbacks for email compatibility. Supports YouTube and Vimeo sources with responsive sizing. In email mode, renders a clickable thumbnail image instead of an iframe."}}},argTypes:{mode:{control:{type:"select"},options:["web","email","document"],description:"Rendering mode. Email mode produces a clickable thumbnail instead of an iframe.",table:{defaultValue:{summary:"web"},type:{summary:"RenderMode"}}}},tags:["autodocs"]},s={name:"Default (Shorthand)",args:{videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ",mode:"web"},decorators:[o=>e.jsx("div",{style:{width:"600px",margin:"0 auto"},children:e.jsx(o,{})})],parameters:{docs:{description:{story:'**Shorthand API** — pass a YouTube or Vimeo URL and the component auto-parses the video ID and thumbnail.\n\n```tsx\n<Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />\n```'}}}},l={name:"Full Props API",args:{video:{loading:!1,type:"youtube",videoId:"dQw4w9WgXcQ",thumbnail:"https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",url:"https://www.youtube.com/watch?v=dQw4w9WgXcQ"},containerPadding:"10px",mode:"web"},decorators:[o=>e.jsx("div",{style:{width:"600px",margin:"0 auto"},children:e.jsx(o,{})})],parameters:{docs:{description:{story:`**Full Control** — use individual props for complete control over video configuration.

\`\`\`tsx
<Video
  video={{
    loading: false,
    type: "youtube",
    videoId: "dQw4w9WgXcQ",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }}
  containerPadding="10px"
/>
\`\`\``}}}},c={name:"Product Launch Email",render:()=>e.jsx(Q,{config:{mode:"email"},children:e.jsxs(C,{backgroundColor:"#f1f5f9",contentAlign:"center",contentWidth:"600px",children:[e.jsx(r,{layout:i.OneColumn,backgroundColor:"#0f172a",padding:"48px 40px 40px",children:e.jsxs(d,{children:[e.jsx(P,{level:"h1",fontSize:"36px",fontWeight:"800",color:"#ffffff",textAlign:"center",fontFamily:"Arial, sans-serif",containerPadding:"0 0 8px 0",children:"Introducing Pulse 2.0"}),e.jsx(h,{text:"The fastest way to build, ship, and measure.",fontSize:"18px",color:"#94a3b8",textAlign:"center",lineHeight:"1.5",fontFamily:"Arial, sans-serif",containerPadding:"0"})]})}),e.jsx(r,{layout:i.OneColumn,backgroundColor:"#ffffff",padding:"32px 40px 24px",children:e.jsx(d,{children:e.jsx(y,{video:{loading:!1,type:"youtube",videoId:"dQw4w9WgXcQ",thumbnail:"https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",url:"https://www.youtube.com/watch?v=dQw4w9WgXcQ"},href:{url:"https://www.youtube.com/watch?v=dQw4w9WgXcQ",target:"_blank"},textAlign:"center",containerPadding:"0"})})}),e.jsx(r,{layout:i.OneColumn,backgroundColor:"#ffffff",padding:"0 40px 32px",children:e.jsxs(d,{children:[e.jsx(h,{text:"Watch the 2-minute walkthrough to see how Pulse 2.0 cuts your build-to-deploy cycle in half with real-time analytics, one-click staging, and zero-config CI.",fontSize:"16px",color:"#475569",textAlign:"center",lineHeight:"1.7",fontFamily:"Arial, sans-serif",containerPadding:"0 0 28px 0"}),e.jsx(A,{backgroundColor:"#2563eb",color:"white",padding:"16px 40px",borderRadius:"8px",fontSize:"16px",fontWeight:"700",href:"https://example.com/get-started",children:"Start Free Trial"})]})}),e.jsx(r,{layout:i.OneColumn,backgroundColor:"#f8fafc",padding:"24px 40px",children:e.jsx(d,{children:e.jsx(h,{text:"Pulse Inc. | San Francisco, CA | Unsubscribe",fontSize:"12px",color:"#94a3b8",textAlign:"center",fontFamily:"Arial, sans-serif",containerPadding:"0"})})})]})}),parameters:{docs:{description:{story:'A complete product launch email built with `UnlayerProvider`. The provider sets `mode: "email"` once and every child component inherits it -- zero mode props anywhere in the tree. The video renders as a clickable thumbnail, safe for all email clients.'}}}},u={name:"YouTube Embed",args:{video:{loading:!1,type:"youtube",videoId:"9bZkp7q19f0",thumbnail:"https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg",url:"https://www.youtube.com/watch?v=9bZkp7q19f0"},textAlign:"center",containerPadding:"0px",mode:"web"},decorators:[o=>e.jsx("div",{style:{width:"600px",margin:"0 auto"},children:e.jsx(o,{})})],parameters:{docs:{description:{story:"A clean YouTube embed with zero padding, centered in a 600px container. Renders as a live iframe player in web mode."}}}},m={name:"Email Thumbnail Fallback",args:{video:{loading:!1,type:"youtube",videoId:"jNQXAC9IVRw",thumbnail:"https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg",url:"https://www.youtube.com/watch?v=jNQXAC9IVRw"},href:{url:"https://www.youtube.com/watch?v=jNQXAC9IVRw",target:"_blank"},textAlign:"center",containerPadding:"20px",mode:"email"},decorators:[o=>e.jsx("div",{style:{width:"600px",margin:"0 auto",backgroundColor:"#f1f5f9",padding:"24px",borderRadius:"8px"},children:e.jsx(o,{})})],parameters:{docs:{description:{story:"In email mode, the video renders as a thumbnail image with a play button overlay that links to the video URL. This is the only reliable way to include video content in email clients, since iframes are stripped by most providers."}}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "Default (Shorthand)",
  args: {
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    mode: "web"
  },
  decorators: [Story => <div style={{
    width: "600px",
    margin: "0 auto"
  }}>
        <Story />
      </div>],
  parameters: {
    docs: {
      description: {
        story: \`**Shorthand API** — pass a YouTube or Vimeo URL and the component auto-parses the video ID and thumbnail.

\\\`\\\`\\\`tsx
<Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
\\\`\\\`\\\`\`
      }
    }
  }
}`,...s.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "Full Props API",
  args: {
    video: {
      loading: false,
      type: "youtube",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    containerPadding: "10px",
    mode: "web"
  },
  decorators: [Story => <div style={{
    width: "600px",
    margin: "0 auto"
  }}>
        <Story />
      </div>],
  parameters: {
    docs: {
      description: {
        story: \`**Full Control** — use individual props for complete control over video configuration.

\\\`\\\`\\\`tsx
<Video
  video={{
    loading: false,
    type: "youtube",
    videoId: "dQw4w9WgXcQ",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }}
  containerPadding="10px"
/>
\\\`\\\`\\\`\`
      }
    }
  }
}`,...l.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "Product Launch Email",
  render: () => <UnlayerProvider config={{
    mode: "email"
  }}>
      <Body backgroundColor="#f1f5f9" contentAlign="center" contentWidth="600px">
        {/* Header */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#0f172a" padding="48px 40px 40px">
          <Column>
            <Heading level="h1" fontSize="36px" fontWeight="800" color="#ffffff" textAlign="center" fontFamily="Arial, sans-serif" containerPadding="0 0 8px 0">
              Introducing Pulse 2.0
            </Heading>
            <Paragraph text="The fastest way to build, ship, and measure." fontSize="18px" color="#94a3b8" textAlign="center" lineHeight="1.5" fontFamily="Arial, sans-serif" containerPadding="0" />
          </Column>
        </Row>

        {/* Video */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="32px 40px 24px">
          <Column>
            <Video video={{
            loading: false,
            type: "youtube",
            videoId: "dQw4w9WgXcQ",
            thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          }} href={{
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            target: "_blank"
          }} textAlign="center" containerPadding="0" />
          </Column>
        </Row>

        {/* Description */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0 40px 32px">
          <Column>
            <Paragraph text="Watch the 2-minute walkthrough to see how Pulse 2.0 cuts your build-to-deploy cycle in half with real-time analytics, one-click staging, and zero-config CI." fontSize="16px" color="#475569" textAlign="center" lineHeight="1.7" fontFamily="Arial, sans-serif" containerPadding="0 0 28px 0" />
            <Button backgroundColor="#2563eb" color="white" padding="16px 40px" borderRadius="8px" fontSize="16px" fontWeight="700" href="https://example.com/get-started">
              Start Free Trial
            </Button>
          </Column>
        </Row>

        {/* Footer */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#f8fafc" padding="24px 40px">
          <Column>
            <Paragraph text="Pulse Inc. | San Francisco, CA | Unsubscribe" fontSize="12px" color="#94a3b8" textAlign="center" fontFamily="Arial, sans-serif" containerPadding="0" />
          </Column>
        </Row>
      </Body>
    </UnlayerProvider>,
  parameters: {
    docs: {
      description: {
        story: "A complete product launch email built with \`UnlayerProvider\`. " + "The provider sets \`mode: \\"email\\"\` once and every child component inherits it " + "-- zero mode props anywhere in the tree. " + "The video renders as a clickable thumbnail, safe for all email clients."
      }
    }
  }
}`,...c.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "YouTube Embed",
  args: {
    video: {
      loading: false,
      type: "youtube",
      videoId: "9bZkp7q19f0",
      thumbnail: "https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg",
      url: "https://www.youtube.com/watch?v=9bZkp7q19f0"
    },
    textAlign: "center",
    containerPadding: "0px",
    mode: "web"
  },
  decorators: [Story => <div style={{
    width: "600px",
    margin: "0 auto"
  }}>
        <Story />
      </div>],
  parameters: {
    docs: {
      description: {
        story: "A clean YouTube embed with zero padding, centered in a 600px container. " + "Renders as a live iframe player in web mode."
      }
    }
  }
}`,...u.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "Email Thumbnail Fallback",
  args: {
    video: {
      loading: false,
      type: "youtube",
      videoId: "jNQXAC9IVRw",
      thumbnail: "https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg",
      url: "https://www.youtube.com/watch?v=jNQXAC9IVRw"
    },
    href: {
      url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
      target: "_blank"
    },
    textAlign: "center",
    containerPadding: "20px",
    mode: "email"
  },
  decorators: [Story => <div style={{
    width: "600px",
    margin: "0 auto",
    backgroundColor: "#f1f5f9",
    padding: "24px",
    borderRadius: "8px"
  }}>
        <Story />
      </div>],
  parameters: {
    docs: {
      description: {
        story: "In email mode, the video renders as a thumbnail image with a play button overlay " + "that links to the video URL. This is the only reliable way to include video content " + "in email clients, since iframes are stripped by most providers."
      }
    }
  }
}`,...m.parameters?.docs?.source}}};const z=["Default","FullPropsAPI","ProductDemo","YouTubeEmbed","EmailVideo"];export{s as Default,m as EmailVideo,l as FullPropsAPI,c as ProductDemo,u as YouTubeEmbed,z as __namedExportsOrder,F as default};
