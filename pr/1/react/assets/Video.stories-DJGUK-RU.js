import{j as e}from"./jsx-runtime-DpkTyRkt.js";import{c as y,g as x,m as f}from"./create-component-DVErpCgp.js";import{U as v,B as C}from"./Body-CGL8G0j-.js";import{R as r,C as i,a as s}from"./Column-B51KzWRl.js";import{H as A}from"./Heading-nTW-ti6J.js";import{T as p}from"./Text-Dq4Hhlmh.js";import{B as Q}from"./Button-BQtb_465.js";import"./iframe-775iVVwO.js";import"./preload-helper-PPVm8Dsz.js";const w={type:"youtube",videoId:"",thumbnail:"",loading:!1},h={video:w};function j(n){const t=n.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);if(t){const o=t[1];return{type:"youtube",videoId:o,thumbnail:`https://img.youtube.com/vi/${o}/0.jpg`}}const a=n.match(/vimeo\.com\/(\d+)/);return a?{type:"vimeo",videoId:a[1],thumbnail:""}:null}const b=y({name:"Video",defaultValues:h,propMapper:n=>{const{videoUrl:t,...a}=n;if(typeof t=="string"){const o=j(t),g=f(a,h,"Video");return o&&(g.video={...w,...o}),g}return f(n,h,"Video")},displayName:"Video",exporters:x}),F={title:"Components/Video",component:b,parameters:{layout:"centered",docs:{description:{component:"Embeds video players with thumbnail fallbacks for email compatibility. Supports YouTube and Vimeo sources with responsive sizing. In email mode, renders a clickable thumbnail image instead of an iframe."}}},argTypes:{values:{description:"Video configuration including source URL, thumbnail, and player type.",control:!1,table:{type:{summary:"VideoValues",detail:`{
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
}`}}},mode:{control:{type:"select"},options:["web","email","document"],description:"Rendering mode. Email mode produces a clickable thumbnail instead of an iframe.",table:{defaultValue:{summary:"web"},type:{summary:"RenderMode"}}}},tags:["autodocs"]},d={name:"Default (Shorthand)",args:{videoUrl:"https://www.youtube.com/watch?v=dQw4w9WgXcQ",mode:"web"},decorators:[n=>e.jsx("div",{style:{width:"600px",margin:"0 auto"},children:e.jsx(n,{})})],parameters:{docs:{description:{story:'**Shorthand API** — pass a YouTube or Vimeo URL and the component auto-parses the video ID and thumbnail.\n\n```tsx\n<Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />\n```'}}}},l={name:"Full Values API",args:{values:{video:{loading:!1,type:"youtube",videoId:"dQw4w9WgXcQ",thumbnail:"https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",url:"https://www.youtube.com/watch?v=dQw4w9WgXcQ"},containerPadding:"10px"},mode:"web"},decorators:[n=>e.jsx("div",{style:{width:"600px",margin:"0 auto"},children:e.jsx(n,{})})],parameters:{docs:{description:{story:"**Full Control** — use the `values` prop for complete exporter-format control."}}}},c={name:"Product Launch Email",render:()=>e.jsx(v,{config:{mode:"email"},children:e.jsxs(C,{backgroundColor:"#f1f5f9",contentAlign:"center",contentWidth:"600px",children:[e.jsx(r,{layout:i.OneColumn,backgroundColor:"#0f172a",padding:"48px 40px 40px",children:e.jsxs(s,{children:[e.jsx(A,{values:{text:"Introducing Pulse 2.0",headingType:"h1",fontSize:"36px",fontWeight:"800",color:"#ffffff",textAlign:"center",fontFamily:"Arial, sans-serif",containerPadding:"0 0 8px 0"}}),e.jsx(p,{values:{text:"The fastest way to build, ship, and measure.",fontSize:"18px",color:"#94a3b8",textAlign:"center",lineHeight:"1.5",fontFamily:"Arial, sans-serif",containerPadding:"0"}})]})}),e.jsx(r,{layout:i.OneColumn,backgroundColor:"#ffffff",padding:"32px 40px 24px",children:e.jsx(s,{children:e.jsx(b,{values:{video:{loading:!1,type:"youtube",videoId:"dQw4w9WgXcQ",thumbnail:"https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",url:"https://www.youtube.com/watch?v=dQw4w9WgXcQ"},href:{url:"https://www.youtube.com/watch?v=dQw4w9WgXcQ",target:"_blank"},textAlign:"center",containerPadding:"0"}})})}),e.jsx(r,{layout:i.OneColumn,backgroundColor:"#ffffff",padding:"0 40px 32px",children:e.jsxs(s,{children:[e.jsx(p,{values:{text:"Watch the 2-minute walkthrough to see how Pulse 2.0 cuts your build-to-deploy cycle in half with real-time analytics, one-click staging, and zero-config CI.",fontSize:"16px",color:"#475569",textAlign:"center",lineHeight:"1.7",fontFamily:"Arial, sans-serif",containerPadding:"0 0 28px 0"}}),e.jsx(Q,{backgroundColor:"#2563eb",color:"white",padding:"16px 40px",borderRadius:"8px",fontSize:"16px",fontWeight:"700",href:"https://example.com/get-started",children:"Start Free Trial"})]})}),e.jsx(r,{layout:i.OneColumn,backgroundColor:"#f8fafc",padding:"24px 40px",children:e.jsx(s,{children:e.jsx(p,{values:{text:"Pulse Inc. | San Francisco, CA | Unsubscribe",fontSize:"12px",color:"#94a3b8",textAlign:"center",fontFamily:"Arial, sans-serif",containerPadding:"0"}})})})]})}),parameters:{docs:{description:{story:'A complete product launch email built with `UnlayerProvider`. The provider sets `mode: "email"` once and every child component inherits it -- zero mode props anywhere in the tree. The video renders as a clickable thumbnail, safe for all email clients.'}}}},u={name:"YouTube Embed",args:{values:{video:{loading:!1,type:"youtube",videoId:"9bZkp7q19f0",thumbnail:"https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg",url:"https://www.youtube.com/watch?v=9bZkp7q19f0"},textAlign:"center",containerPadding:"0px"},mode:"web"},decorators:[n=>e.jsx("div",{style:{width:"600px",margin:"0 auto"},children:e.jsx(n,{})})],parameters:{docs:{description:{story:"A clean YouTube embed with zero padding, centered in a 600px container. Renders as a live iframe player in web mode."}}}},m={name:"Email Thumbnail Fallback",args:{values:{video:{loading:!1,type:"youtube",videoId:"jNQXAC9IVRw",thumbnail:"https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg",url:"https://www.youtube.com/watch?v=jNQXAC9IVRw"},href:{url:"https://www.youtube.com/watch?v=jNQXAC9IVRw",target:"_blank"},textAlign:"center",containerPadding:"20px"},mode:"email"},decorators:[n=>e.jsx("div",{style:{width:"600px",margin:"0 auto",backgroundColor:"#f1f5f9",padding:"24px",borderRadius:"8px"},children:e.jsx(n,{})})],parameters:{docs:{description:{story:"In email mode, the video renders as a thumbnail image with a play button overlay that links to the video URL. This is the only reliable way to include video content in email clients, since iframes are stripped by most providers."}}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
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
}`,...d.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "Full Values API",
  args: {
    values: {
      video: {
        loading: false,
        type: "youtube",
        videoId: "dQw4w9WgXcQ",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      },
      containerPadding: "10px"
    },
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
        story: "**Full Control** — use the \`values\` prop for complete exporter-format control."
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
            <Heading values={{
            text: "Introducing Pulse 2.0",
            headingType: "h1",
            fontSize: "36px",
            fontWeight: "800",
            color: "#ffffff",
            textAlign: "center",
            fontFamily: "Arial, sans-serif",
            containerPadding: "0 0 8px 0"
          }} />
            <Text values={{
            text: "The fastest way to build, ship, and measure.",
            fontSize: "18px",
            color: "#94a3b8",
            textAlign: "center",
            lineHeight: "1.5",
            fontFamily: "Arial, sans-serif",
            containerPadding: "0"
          }} />
          </Column>
        </Row>

        {/* Video */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="32px 40px 24px">
          <Column>
            <Video values={{
            video: {
              loading: false,
              type: "youtube",
              videoId: "dQw4w9WgXcQ",
              thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
              url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            },
            href: {
              url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              target: "_blank"
            },
            textAlign: "center",
            containerPadding: "0"
          }} />
          </Column>
        </Row>

        {/* Description */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="0 40px 32px">
          <Column>
            <Text values={{
            text: "Watch the 2-minute walkthrough to see how Pulse 2.0 cuts your build-to-deploy cycle in half with real-time analytics, one-click staging, and zero-config CI.",
            fontSize: "16px",
            color: "#475569",
            textAlign: "center",
            lineHeight: "1.7",
            fontFamily: "Arial, sans-serif",
            containerPadding: "0 0 28px 0"
          }} />
            <Button backgroundColor="#2563eb" color="white" padding="16px 40px" borderRadius="8px" fontSize="16px" fontWeight="700" href="https://example.com/get-started">
              Start Free Trial
            </Button>
          </Column>
        </Row>

        {/* Footer */}
        <Row layout={ColumnLayouts.OneColumn} backgroundColor="#f8fafc" padding="24px 40px">
          <Column>
            <Text values={{
            text: "Pulse Inc. | San Francisco, CA | Unsubscribe",
            fontSize: "12px",
            color: "#94a3b8",
            textAlign: "center",
            fontFamily: "Arial, sans-serif",
            containerPadding: "0"
          }} />
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
    values: {
      video: {
        loading: false,
        type: "youtube",
        videoId: "9bZkp7q19f0",
        thumbnail: "https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg",
        url: "https://www.youtube.com/watch?v=9bZkp7q19f0"
      },
      textAlign: "center",
      containerPadding: "0px"
    },
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
    values: {
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
      containerPadding: "20px"
    },
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
}`,...m.parameters?.docs?.source}}};const U=["Default","FullValuesAPI","ProductDemo","YouTubeEmbed","EmailVideo"];export{d as Default,m as EmailVideo,l as FullValuesAPI,c as ProductDemo,u as YouTubeEmbed,U as __namedExportsOrder,F as default};
