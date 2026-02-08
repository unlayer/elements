import{j as n}from"./jsx-runtime-CeNQlCuc.js";import{B as l}from"./Body-BcFaf7ar.js";import{R as o,C as t,a as i}from"./Column-DBOgK1Qy.js";import{T as e}from"./Text-DZoIEdgn.js";import{H as r}from"./Heading-DSUodn_3.js";import{B as s}from"./Button-C65C_Gd_.js";import{T as b}from"./Table-BwsynbIx.js";import"./iframe-Ofo6XfC9.js";import"./preload-helper-PPVm8Dsz.js";import"./create-component-DEvu5BmU.js";const R={title:"Layout/Body",component:l,parameters:{layout:"fullscreen",docs:{description:{component:`
# 🏗️ Body Component

The **Body** component is the main container that wraps entire email/web layouts. It provides the foundational structure and styling for all content.

## Key Features
- 🎨 **Background Styling**: Colors, images, positioning, and sizing
- 🔤 **Typography**: Font family, text color, and link styling
- 📱 **Responsive**: Adapts to different display modes (web, email, document)
- 🎯 **Layout Control**: Content alignment and width management
- 📧 **Email-Safe**: Optimized for email clients with proper fallbacks

## Display Modes
- **Web**: Modern flexbox layout with full viewport height
- **Email**: Table-based layout for email client compatibility  
- **Document**: Print-friendly layout for PDFs and documents
- **Popup**: Modal/overlay display with positioning controls

## Common Use Cases
- Email template foundations
- Landing page containers
- Document layouts
- Modal/popup backgrounds
- Newsletter structures
        `}}},argTypes:{values:{description:"**Body Configuration Object**\n\nMain body options:\n- `backgroundColor`: Background color for the entire body\n- `backgroundImage`: Background image with positioning and sizing\n- `fontFamily`: Default font family for all content\n- `textColor`: Default text color\n- `linkStyle`: Link colors and underline settings\n- `contentAlign`: Content alignment (center, left, right)\n- `contentWidth`: Maximum content width\n\n*See individual stories below for complete examples*",control:!1,table:{type:{summary:"BodyValues",detail:`{
  backgroundColor?: string;
  backgroundImage?: {
    url: string;
    fullWidth?: boolean;
    repeat?: string;
    size?: string;
    position?: string;
  };
  fontFamily?: {
    label: string;
    value: string;
  };
  textColor?: string;
  linkStyle?: {
    linkColor: string;
    linkHoverColor: string;
    linkUnderline: boolean;
    linkHoverUnderline: boolean;
  };
  contentAlign?: string;
  contentWidth?: string;
}`}}},mode:{control:{type:"select"},options:["web","email","document"],description:"**Rendering Mode** - Controls output format and layout optimizations",table:{defaultValue:{summary:"web"},type:{summary:"RenderMode"}}}},tags:["autodocs"]},d={render:()=>n.jsxs(l,{backgroundColor:"#ffffff",textColor:"#1f2937",contentAlign:"center",contentWidth:"800px",mode:"web",children:[n.jsx(o,{backgroundColor:"#3b82f6",padding:"60px 40px",mode:"web",children:n.jsxs(t,{padding:"20px",children:[n.jsx(r,{values:{headingType:"h2",text:"✨ Semantic Props in Action",fontSize:"42px",color:"#ffffff",textAlign:"center"},children:"✨ Semantic Props in Action"}),n.jsx(e,{values:{text:"All components now support clean, flat semantic props! No need for nested objects - just pass props directly.",fontSize:"18px",color:"#e0e7ff",textAlign:"center",lineHeight:"1.6",containerPadding:"0 0 20px 0"}}),n.jsx(s,{backgroundColor:"#10b981",color:"white",padding:"14px 28px",borderRadius:"8px",fontSize:"16px",fontWeight:600,children:"Try It Now"})]})}),n.jsx(o,{backgroundColor:"#f8fafc",padding:"40px",mode:"web",children:n.jsx(t,{children:n.jsx(e,{values:{text:"💡 Props are automatically mapped to their correct nested structures - zero configuration needed!",fontSize:"16px",color:"#64748b",textAlign:"center"}})})})]}),parameters:{docs:{description:{story:'\n**🎨 Universal Semantic Props for Layout Components**\n\nBody, Row, and Column now support clean semantic props with automatic mapping:\n\n```tsx\n<Body\n  backgroundColor="#ffffff"\n  textColor="#1f2937"\n  contentAlign="center"\n  contentWidth="800px"\n>\n  <Row\n    backgroundColor="#3b82f6"\n    padding="60px 40px"\n  >\n    <Column\n      backgroundColor="#ffffff"\n      padding="20px"\n      borderRadius="12px"\n    >\n      {/* Content components */}\n    </Column>\n  </Row>\n</Body>\n```\n\n**Container Components with Semantic Props:**\n- ✅ **Body**: `backgroundColor`, `textColor`, `contentAlign`, `contentWidth`\n- ✅ **Row**: `backgroundColor`, `padding`, `alignItems`, `columnsBackgroundColor`\n- ✅ **Column**: `backgroundColor`, `padding`, `border`, `borderRadius`\n- ✅ **Button**: `backgroundColor`, `color`, `padding`, `borderRadius`, `fontSize`, `fontWeight`\n\n**Benefits:**\n- ✅ Clean, flat prop API\n- ✅ Full TypeScript autocomplete\n- ✅ Automatic prop grouping into nested structures\n- ✅ Future-proof - no code changes when renderers update\n        '}}}},c={args:{values:{backgroundColor:"#0f172a",fontFamily:{label:"Inter",value:"Inter, system-ui, -apple-system, sans-serif"},textColor:"#ffffff",linkStyle:{linkColor:"#60a5fa",linkHoverColor:"#3b82f6",linkUnderline:!1,linkHoverUnderline:!0},contentAlign:"center",contentWidth:"800px"},mode:"web"},render:a=>n.jsxs(l,{...a,children:[n.jsx(o,{layout:i.OneColumn,backgroundColor:"#1e293b",padding:"80px 40px 60px 40px",mode:"web",children:n.jsxs(t,{children:[n.jsx(e,{values:{text:"🌐 WEB MODE SHOWCASE",fontSize:"14px",color:"#60a5fa",textAlign:"center",lineHeight:"1.5",containerPadding:"0 0 16px 0",fontFamily:"Inter, sans-serif"},mode:"web"}),n.jsx(r,{values:{text:"Modern Web Experience",headingType:"h1",fontSize:"48px",fontWeight:"800",color:"#ffffff",textAlign:"center",containerPadding:"0 0 24px 0",fontFamily:"Inter, sans-serif"},mode:"web"}),n.jsx(e,{values:{text:"Optimized for modern browsers with flexbox layouts, responsive design, and interactive elements. Perfect for landing pages and web applications.",fontSize:"18px",color:"#cbd5e1",textAlign:"center",lineHeight:"1.6",containerPadding:"0 0 32px 0",fontFamily:"Inter, sans-serif"},mode:"web"}),n.jsx(s,{values:{text:"Try Web Builder →",buttonColors:{backgroundColor:"#3b82f6",color:"#ffffff"},padding:"16px 32px",borderRadius:"12px",fontSize:"16px",fontWeight:"600",textAlign:"center",fontFamily:"Inter, sans-serif"},mode:"web"})]})}),n.jsx(o,{layout:i.OneColumn,backgroundColor:"#334155",padding:"60px 40px",mode:"web",children:n.jsx(t,{children:n.jsx(e,{values:{text:`✨ Flexbox Layouts
🎨 CSS Grid Support
📱 Responsive Design
⚡ Fast Loading
🔧 Custom CSS`,fontSize:"16px",color:"#e2e8f0",textAlign:"center",lineHeight:"2.0",containerPadding:"0",fontFamily:"Inter, sans-serif"},mode:"web"})})})]})},f={args:{values:{backgroundColor:"#f8fafc",fontFamily:{label:"Inter",value:"Inter, system-ui, -apple-system, sans-serif"},textColor:"#1e293b",linkStyle:{linkColor:"#0ea5e9",linkHoverColor:"#0284c7",linkUnderline:!1,linkHoverUnderline:!0},contentAlign:"center",contentWidth:"900px"},mode:"web"},render:a=>n.jsxs(l,{...a,children:[n.jsx(o,{layout:i.OneColumn,backgroundColor:"#ffffff",padding:"60px 40px",mode:"web",children:n.jsxs(t,{children:[n.jsx(e,{values:{text:"👋 WELCOME TO UNLAYER",fontSize:"14px",color:"#0ea5e9",textAlign:"center",lineHeight:"1.5",containerPadding:"0 0 16px 0",fontFamily:"Inter, sans-serif",fontWeight:"600",letterSpacing:"0.05em"},mode:"web"}),n.jsx(r,{values:{text:"Build Beautiful Emails & Pages",headingType:"h1",fontSize:"42px",fontWeight:"800",color:"#1e293b",textAlign:"center",containerPadding:"0 0 20px 0",fontFamily:"Inter, sans-serif",lineHeight:"1.1"},mode:"web"}),n.jsx(e,{values:{text:"Create stunning email templates, landing pages, and documents with our powerful drag-and-drop builder. No coding required.",fontSize:"18px",color:"#64748b",textAlign:"center",lineHeight:"1.6",containerPadding:"0 0 32px 0",fontFamily:"Inter, sans-serif"},mode:"web"}),n.jsx(s,{values:{text:"Start Building →",buttonColors:{backgroundColor:"#0ea5e9",color:"#ffffff"},padding:"14px 28px",borderRadius:"8px",fontSize:"16px",fontWeight:"600",textAlign:"center",fontFamily:"Inter, sans-serif"},mode:"web"})]})}),n.jsxs(o,{layout:i.ThreeEqual,backgroundColor:"#f8fafc",padding:"60px 40px",mode:"web",children:[n.jsxs(t,{children:[n.jsx(e,{values:{text:"🎨",fontSize:"32px",textAlign:"center",containerPadding:"0 0 16px 0"},mode:"web"}),n.jsx(r,{values:{text:"Drag & Drop Builder",headingType:"h3",fontSize:"20px",fontWeight:"700",color:"#1e293b",textAlign:"center",containerPadding:"0 0 12px 0",fontFamily:"Inter, sans-serif"},mode:"web"}),n.jsx(e,{values:{text:"Intuitive visual editor with pre-built components and templates.",fontSize:"14px",color:"#64748b",textAlign:"center",lineHeight:"1.5",fontFamily:"Inter, sans-serif"},mode:"web"})]}),n.jsxs(t,{children:[n.jsx(e,{values:{text:"📱",fontSize:"32px",textAlign:"center",containerPadding:"0 0 16px 0"},mode:"web"}),n.jsx(r,{values:{text:"Responsive Design",headingType:"h3",fontSize:"20px",fontWeight:"700",color:"#1e293b",textAlign:"center",containerPadding:"0 0 12px 0",fontFamily:"Inter, sans-serif"},mode:"web"}),n.jsx(e,{values:{text:"Perfect rendering across all devices and email clients.",fontSize:"14px",color:"#64748b",textAlign:"center",lineHeight:"1.5",fontFamily:"Inter, sans-serif"},mode:"web"})]}),n.jsxs(t,{children:[n.jsx(e,{values:{text:"⚡",fontSize:"32px",textAlign:"center",containerPadding:"0 0 16px 0"},mode:"web"}),n.jsx(r,{values:{text:"Export Anywhere",headingType:"h3",fontSize:"20px",fontWeight:"700",color:"#1e293b",textAlign:"center",containerPadding:"0 0 12px 0",fontFamily:"Inter, sans-serif"},mode:"web"}),n.jsx(e,{values:{text:"Export to HTML, PDF, or integrate with your favorite tools.",fontSize:"14px",color:"#64748b",textAlign:"center",lineHeight:"1.5",fontFamily:"Inter, sans-serif"},mode:"web"})]})]})]})},x={args:{values:{backgroundColor:"#ffffff",fontFamily:{label:"Inter",value:"Inter, system-ui, -apple-system, sans-serif"},textColor:"#1f2937",linkStyle:{linkColor:"#3b82f6",linkHoverColor:"#1d4ed8",linkUnderline:!1,linkHoverUnderline:!0},contentAlign:"center",contentWidth:"1200px"},mode:"web"},render:a=>n.jsxs(l,{...a,children:[n.jsx(o,{layout:i.OneColumn,backgroundColor:"transparent",padding:"120px 40px 80px 40px",mode:"web",children:n.jsxs(t,{children:[n.jsx(e,{values:{text:"EMBEDDABLE CONTENT CREATION TOOLS",fontSize:"12px",color:"#6b7280",textAlign:"center",lineHeight:"1.5",containerPadding:"0 0 24px 0",fontFamily:"Inter, sans-serif"},mode:"web"}),n.jsx(r,{values:{text:"Empower Your SaaS with Professional Content Creation",headingType:"h1",fontSize:"56px",fontWeight:"700",color:"#1f2937",textAlign:"center",containerPadding:"0 0 32px 0",fontFamily:"Inter, sans-serif"},mode:"web"}),n.jsx(e,{values:{text:"Integrate powerful drag-n-drop builders for emails, pages, and documents. Save development costs and accelerate your go-to-market strategy.",fontSize:"20px",color:"#4b5563",textAlign:"center",lineHeight:"1.6",containerPadding:"0 0 48px 0",fontFamily:"Inter, sans-serif"},mode:"web"}),n.jsx(s,{values:{text:"Get Started Now",buttonColors:{backgroundColor:"#3b82f6",color:"#ffffff"},padding:"16px 32px",borderRadius:"8px",fontSize:"16px",fontWeight:"600",textAlign:"center",fontFamily:"Inter, sans-serif"},mode:"web"})]})}),n.jsx(o,{layout:i.OneColumn,backgroundColor:"#f8fafc",padding:"80px 40px",mode:"web",children:n.jsxs(t,{children:[n.jsx(r,{values:{text:"ENTERPRISE-GRADE PLATFORM",headingType:"h3",fontSize:"12px",fontWeight:"600",color:"#6b7280",textAlign:"center",containerPadding:"0 0 16px 0",fontFamily:"Inter, sans-serif"},mode:"web"}),n.jsx(r,{values:{text:"Trusted by Industry Leaders",headingType:"h2",fontSize:"36px",fontWeight:"700",color:"#1f2937",textAlign:"center",containerPadding:"0 0 24px 0",fontFamily:"Inter, sans-serif"},mode:"web"}),n.jsx(e,{values:{text:"Join over 1000+ successful companies who trust Unlayer to power their content creation workflows",fontSize:"18px",color:"#4b5563",textAlign:"center",lineHeight:"1.6",containerPadding:"0 0 48px 0",fontFamily:"Inter, sans-serif"},mode:"web"})]})})]})},p={args:{values:{backgroundColor:"#f8fafc",fontFamily:{label:"Arial",value:"Arial, Helvetica, sans-serif"},textColor:"#1f2937",linkStyle:{linkColor:"#3b82f6",linkHoverColor:"#1d4ed8",linkUnderline:!0,linkHoverUnderline:!0},contentAlign:"center",contentWidth:"600px"},mode:"email"},render:a=>n.jsxs(l,{...a,children:[n.jsx(o,{layout:i.OneColumn,backgroundColor:"#ffffff",padding:"40px 30px 20px 30px",mode:"email",children:n.jsxs(t,{children:[n.jsx(e,{values:{text:"📧 EMAIL MODE SHOWCASE",fontSize:"12px",color:"#059669",textAlign:"center",lineHeight:"1.5",containerPadding:"0 0 16px 0",fontFamily:"Arial, Helvetica, sans-serif"},mode:"email"}),n.jsx(r,{values:{text:"Email-Safe Templates",headingType:"h1",fontSize:"32px",fontWeight:"700",color:"#1f2937",textAlign:"center",containerPadding:"0 0 16px 0",fontFamily:"Arial, Helvetica, sans-serif"},mode:"email"}),n.jsx(e,{values:{text:"Optimized for email clients with table-based layouts, inline CSS, and maximum compatibility across Gmail, Outlook, and Apple Mail.",fontSize:"16px",color:"#4b5563",textAlign:"center",lineHeight:"1.5",containerPadding:"0 0 24px 0",fontFamily:"Arial, Helvetica, sans-serif"},mode:"email"}),n.jsx(s,{values:{text:"Try Email Builder",buttonColors:{backgroundColor:"#059669",color:"#ffffff"},padding:"14px 28px",borderRadius:"4px",fontSize:"16px",fontWeight:"600",textAlign:"center",fontFamily:"Arial, Helvetica, sans-serif"},mode:"email"})]})}),n.jsx(o,{layout:i.OneColumn,backgroundColor:"#f0fdf4",padding:"30px 30px 40px 30px",mode:"email",children:n.jsx(t,{children:n.jsx(e,{values:{text:`✅ Table-Based Layouts
✅ Inline CSS Styles
✅ Outlook Compatible
✅ Gmail Tested
✅ Mobile Responsive`,fontSize:"14px",color:"#065f46",textAlign:"center",lineHeight:"2.0",containerPadding:"0",fontFamily:"Arial, Helvetica, sans-serif"},mode:"email"})})})]})},m={args:{values:{backgroundColor:"#ffffff",fontFamily:{label:"Times New Roman",value:"Times New Roman, Times, serif"},textColor:"#000000",linkStyle:{linkColor:"#0066cc",linkHoverColor:"#004499",linkUnderline:!0,linkHoverUnderline:!0},contentAlign:"left",contentWidth:"100%"},mode:"document"},render:a=>n.jsxs(l,{...a,children:[n.jsx(o,{layout:i.OneColumn,backgroundColor:"transparent",padding:"60px 80px 20px 80px",mode:"document",children:n.jsxs(t,{children:[n.jsx(r,{values:{text:"QUARTERLY BUSINESS REPORT",headingType:"h1",fontSize:"24px",fontWeight:"700",color:"#000000",textAlign:"center",containerPadding:"0 0 8px 0",fontFamily:"Times New Roman, Times, serif"},mode:"document"}),n.jsx(e,{values:{text:"Q4 2024 Performance Analysis",fontSize:"16px",color:"#333333",textAlign:"center",lineHeight:"1.4",containerPadding:"0 0 20px 0",fontFamily:"Times New Roman, Times, serif"},mode:"document"}),n.jsx(e,{values:{text:`Prepared by: Finance Department
Date: December 31, 2024
Document ID: RPT-2024-Q4-001`,fontSize:"11px",color:"#666666",textAlign:"center",lineHeight:"1.6",containerPadding:"0 0 30px 0",fontFamily:"Times New Roman, Times, serif"},mode:"document"})]})}),n.jsx(o,{layout:i.OneColumn,backgroundColor:"transparent",padding:"0px 80px 20px 80px",mode:"document",children:n.jsxs(t,{children:[n.jsx(r,{values:{text:"1. Executive Summary",headingType:"h2",fontSize:"16px",fontWeight:"700",color:"#000000",textAlign:"left",containerPadding:"0 0 12px 0",fontFamily:"Times New Roman, Times, serif"},mode:"document"}),n.jsx(e,{values:{text:"This quarterly report presents a comprehensive analysis of our business performance for Q4 2024. The company has achieved significant growth across multiple key performance indicators, with revenue increasing by 23% compared to the previous quarter.",fontSize:"12px",color:"#000000",textAlign:"justify",lineHeight:"1.6",containerPadding:"0 0 20px 0",fontFamily:"Times New Roman, Times, serif"},mode:"document"})]})}),n.jsx(o,{layout:i.OneColumn,backgroundColor:"transparent",padding:"0px 80px 20px 80px",mode:"document",children:n.jsxs(t,{children:[n.jsx(r,{values:{text:"2. Financial Performance",headingType:"h2",fontSize:"16px",fontWeight:"700",color:"#000000",textAlign:"left",containerPadding:"0 0 12px 0",fontFamily:"Times New Roman, Times, serif"},mode:"document"}),n.jsx(e,{values:{text:"The following table summarizes our key financial metrics for Q4 2024:",fontSize:"12px",color:"#000000",textAlign:"left",lineHeight:"1.6",containerPadding:"0 0 16px 0",fontFamily:"Times New Roman, Times, serif"},mode:"document"})]})}),n.jsx(o,{layout:i.OneColumn,backgroundColor:"transparent",padding:"0px 80px 20px 80px",mode:"document",children:n.jsx(t,{children:n.jsx(b,{values:{table:{headers:[{cells:[{text:"Metric"},{text:"Q3 2024"},{text:"Q4 2024"},{text:"Growth %"}]}],rows:[{cells:[{text:"Total Revenue"},{text:"$2,450,000"},{text:"$3,015,000"},{text:"+23.1%"}]},{cells:[{text:"Net Profit"},{text:"$485,000"},{text:"$642,000"},{text:"+32.4%"}]},{cells:[{text:"Active Customers"},{text:"12,450"},{text:"15,680"},{text:"+25.9%"}]},{cells:[{text:"Customer Acquisition"},{text:"1,250"},{text:"1,890"},{text:"+51.2%"}]},{cells:[{text:"Monthly Recurring Rev."},{text:"$815,000"},{text:"$1,005,000"},{text:"+23.3%"}]},{cells:[{text:"Churn Rate"},{text:"3.2%"},{text:"2.1%"},{text:"-34.4%"}]}]},enableHeader:!0,backgroundColor:"#ffffff",border:{borderTopWidth:"1px",borderTopStyle:"solid",borderTopColor:"#000000",borderLeftWidth:"1px",borderLeftStyle:"solid",borderLeftColor:"#000000",borderRightWidth:"1px",borderRightStyle:"solid",borderRightColor:"#000000",borderBottomWidth:"1px",borderBottomStyle:"solid",borderBottomColor:"#000000"},headerBackgroundColor:"#f8f9fa",headerColor:"#000000",headerFontSize:"12px",headerFontWeight:"700",headerTextAlign:"left",headerFontFamily:"Times New Roman, Times, serif",contentColor:"#000000",contentFontSize:"11px",contentTextAlign:"left",contentFontFamily:"Times New Roman, Times, serif",contentLineHeight:"1.4",containerPadding:"0 0 20px 0"},mode:"document"})})}),n.jsx(o,{layout:i.OneColumn,backgroundColor:"transparent",padding:"0px 80px 20px 80px",mode:"document",children:n.jsxs(t,{children:[n.jsx(r,{values:{text:"3. Key Insights",headingType:"h2",fontSize:"16px",fontWeight:"700",color:"#000000",textAlign:"left",containerPadding:"0 0 12px 0",fontFamily:"Times New Roman, Times, serif"},mode:"document"}),n.jsx(e,{values:{text:`• Revenue Growth: Exceeded targets by 8.1%, driven by strong customer acquisition
• Profitability: Improved margins through operational efficiency initiatives
• Customer Retention: Significant reduction in churn rate indicates improved satisfaction
• Market Expansion: Successfully entered two new geographic markets`,fontSize:"12px",color:"#000000",textAlign:"left",lineHeight:"1.8",containerPadding:"0 0 20px 0",fontFamily:"Times New Roman, Times, serif"},mode:"document"})]})}),n.jsx(o,{layout:i.OneColumn,backgroundColor:"transparent",padding:"20px 80px 60px 80px",mode:"document",children:n.jsx(t,{children:n.jsx(e,{values:{text:`This document is confidential and proprietary. Distribution is restricted to authorized personnel only.

For questions regarding this report, please contact: finance@company.com`,fontSize:"10px",color:"#666666",textAlign:"center",lineHeight:"1.6",containerPadding:"20px 0 0 0",fontFamily:"Times New Roman, Times, serif"},mode:"document"})})})]})},u={args:{values:{backgroundColor:"#1e293b",backgroundImage:{url:"https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=800&fit=crop&q=80",fullWidth:!0,repeat:"no-repeat",size:"cover",position:"center"},fontFamily:{label:"System",value:"system-ui, -apple-system, sans-serif"},textColor:"#ffffff",linkStyle:{linkColor:"#60a5fa",linkHoverColor:"#93c5fd",linkUnderline:!1,linkHoverUnderline:!0},contentAlign:"center",contentWidth:"800px"},mode:"web"},render:a=>n.jsx(l,{...a,children:n.jsx(o,{layout:i.OneColumn,backgroundColor:"rgba(0, 0, 0, 0.5)",padding:"80px 40px",mode:"web",children:n.jsxs(t,{children:[n.jsx(r,{values:{text:"🌟 Hero Section with Background",headingType:"h1",fontSize:"48px",fontWeight:"900",color:"#ffffff",textAlign:"center",containerPadding:"0 0 24px 0",fontFamily:"system-ui, sans-serif",letterSpacing:"-0.02em",lineHeight:"1.1"},mode:"web"}),n.jsx(e,{values:{text:"This Body component showcases a beautiful background image with overlay content. Perfect for hero sections and landing pages.",fontSize:"20px",color:"#e2e8f0",textAlign:"center",lineHeight:"1.6",containerPadding:"0 0 32px 0",fontFamily:"system-ui, sans-serif"},mode:"web"}),n.jsx(s,{values:{text:"🚀 Explore More",buttonColors:{backgroundColor:"#3b82f6",color:"#ffffff"},padding:"16px 32px",borderRadius:"8px",fontSize:"18px",fontWeight:"600",textAlign:"center",fontFamily:"system-ui, sans-serif",border:{borderWidth:"2px",borderStyle:"solid",borderColor:"#3b82f6"}},mode:"web"})]})})})},g={args:{values:{backgroundColor:"#f1f5f9",fontFamily:{label:"Inter",value:"Inter, system-ui, sans-serif"},textColor:"#0f172a",linkStyle:{linkColor:"#0ea5e9",linkHoverColor:"#0284c7",linkUnderline:!1,linkHoverUnderline:!0},contentAlign:"center",contentWidth:"900px"},mode:"web"},render:a=>n.jsxs(l,{...a,children:[n.jsx(o,{layout:i.OneColumn,backgroundColor:"transparent",padding:"40px 20px 20px 20px",mode:"web",children:n.jsx(t,{children:n.jsx(r,{values:{text:"📊 Feature Showcase",headingType:"h2",fontSize:"36px",fontWeight:"800",color:"#0f172a",textAlign:"center",containerPadding:"0 0 40px 0",fontFamily:"Inter, sans-serif"},mode:"web"})})}),n.jsxs(o,{layout:i.ThreeEqual,backgroundColor:"transparent",padding:"0 20px 40px 20px",columnsBackgroundColor:"#ffffff",mode:"web",children:[n.jsxs(t,{children:[n.jsx(e,{values:{text:"🎨 Design",fontSize:"20px",fontWeight:"700",color:"#3b82f6",textAlign:"center",containerPadding:"24px 16px 12px 16px",fontFamily:"Inter, sans-serif"},mode:"web"}),n.jsx(e,{values:{text:"Beautiful, responsive designs that work across all devices and email clients.",fontSize:"14px",color:"#64748b",textAlign:"center",lineHeight:"1.5",containerPadding:"0 16px 24px 16px",fontFamily:"Inter, sans-serif"},mode:"web"})]}),n.jsxs(t,{children:[n.jsx(e,{values:{text:"⚡ Performance",fontSize:"20px",fontWeight:"700",color:"#10b981",textAlign:"center",containerPadding:"24px 16px 12px 16px",fontFamily:"Inter, sans-serif"},mode:"web"}),n.jsx(e,{values:{text:"Lightning-fast rendering with optimized code generation and CDN delivery.",fontSize:"14px",color:"#64748b",textAlign:"center",lineHeight:"1.5",containerPadding:"0 16px 24px 16px",fontFamily:"Inter, sans-serif"},mode:"web"})]}),n.jsxs(t,{children:[n.jsx(e,{values:{text:"🔧 Flexibility",fontSize:"20px",fontWeight:"700",color:"#f59e0b",textAlign:"center",containerPadding:"24px 16px 12px 16px",fontFamily:"Inter, sans-serif"},mode:"web"}),n.jsx(e,{values:{text:"Highly customizable components that adapt to your brand and requirements.",fontSize:"14px",color:"#64748b",textAlign:"center",lineHeight:"1.5",containerPadding:"0 16px 24px 16px",fontFamily:"Inter, sans-serif"},mode:"web"})]})]})]})};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <Body backgroundColor="#ffffff" textColor="#1f2937" contentAlign="center" contentWidth="800px" mode="web">
      <Row backgroundColor="#3b82f6" padding="60px 40px" mode="web">
        <Column padding="20px">
          <Heading values={{
          headingType: "h2",
          text: "✨ Semantic Props in Action",
          fontSize: "42px",
          color: "#ffffff",
          textAlign: "center"
        }}>
            ✨ Semantic Props in Action
          </Heading>
          <Text values={{
          text: "All components now support clean, flat semantic props! No need for nested objects - just pass props directly.",
          fontSize: "18px",
          color: "#e0e7ff",
          textAlign: "center",
          lineHeight: "1.6",
          containerPadding: "0 0 20px 0"
        }} />
          <Button backgroundColor="#10b981" color="white" padding="14px 28px" borderRadius="8px" fontSize="16px" fontWeight={600}>
            Try It Now
          </Button>
        </Column>
      </Row>
      <Row backgroundColor="#f8fafc" padding="40px" mode="web">
        <Column>
          <Text values={{
          text: "💡 Props are automatically mapped to their correct nested structures - zero configuration needed!",
          fontSize: "16px",
          color: "#64748b",
          textAlign: "center"
        }} />
        </Column>
      </Row>
    </Body>,
  parameters: {
    docs: {
      description: {
        story: \`
**🎨 Universal Semantic Props for Layout Components**

Body, Row, and Column now support clean semantic props with automatic mapping:

\\\`\\\`\\\`tsx
<Body
  backgroundColor="#ffffff"
  textColor="#1f2937"
  contentAlign="center"
  contentWidth="800px"
>
  <Row
    backgroundColor="#3b82f6"
    padding="60px 40px"
  >
    <Column
      backgroundColor="#ffffff"
      padding="20px"
      borderRadius="12px"
    >
      {/* Content components */}
    </Column>
  </Row>
</Body>
\\\`\\\`\\\`

**Container Components with Semantic Props:**
- ✅ **Body**: \\\`backgroundColor\\\`, \\\`textColor\\\`, \\\`contentAlign\\\`, \\\`contentWidth\\\`
- ✅ **Row**: \\\`backgroundColor\\\`, \\\`padding\\\`, \\\`alignItems\\\`, \\\`columnsBackgroundColor\\\`
- ✅ **Column**: \\\`backgroundColor\\\`, \\\`padding\\\`, \\\`border\\\`, \\\`borderRadius\\\`
- ✅ **Button**: \\\`backgroundColor\\\`, \\\`color\\\`, \\\`padding\\\`, \\\`borderRadius\\\`, \\\`fontSize\\\`, \\\`fontWeight\\\`

**Benefits:**
- ✅ Clean, flat prop API
- ✅ Full TypeScript autocomplete
- ✅ Automatic prop grouping into nested structures
- ✅ Future-proof - no code changes when renderers update
        \`
      }
    }
  }
}`,...d.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      backgroundColor: "#0f172a",
      fontFamily: {
        label: "Inter",
        value: "Inter, system-ui, -apple-system, sans-serif"
      },
      textColor: "#ffffff",
      linkStyle: {
        linkColor: "#60a5fa",
        linkHoverColor: "#3b82f6",
        linkUnderline: false,
        linkHoverUnderline: true
      },
      contentAlign: "center",
      contentWidth: "800px"
    },
    mode: "web"
  },
  render: args => <Body {...args}>
      {/* Hero Section */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#1e293b" padding="80px 40px 60px 40px" mode="web">
        <Column>
          <Text values={{
          text: "🌐 WEB MODE SHOWCASE",
          fontSize: "14px",
          color: "#60a5fa",
          textAlign: "center",
          lineHeight: "1.5",
          containerPadding: "0 0 16px 0",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
          <Heading values={{
          text: "Modern Web Experience",
          headingType: "h1",
          fontSize: "48px",
          fontWeight: "800",
          color: "#ffffff",
          textAlign: "center",
          containerPadding: "0 0 24px 0",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
          <Text values={{
          text: "Optimized for modern browsers with flexbox layouts, responsive design, and interactive elements. Perfect for landing pages and web applications.",
          fontSize: "18px",
          color: "#cbd5e1",
          textAlign: "center",
          lineHeight: "1.6",
          containerPadding: "0 0 32px 0",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
          <Button values={{
          text: "Try Web Builder →",
          buttonColors: {
            backgroundColor: "#3b82f6",
            color: "#ffffff"
          },
          padding: "16px 32px",
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: "600",
          textAlign: "center",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
        </Column>
      </Row>

      {/* Features */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#334155" padding="60px 40px" mode="web">
        <Column>
          <Text values={{
          text: "✨ Flexbox Layouts\\n🎨 CSS Grid Support\\n📱 Responsive Design\\n⚡ Fast Loading\\n🔧 Custom CSS",
          fontSize: "16px",
          color: "#e2e8f0",
          textAlign: "center",
          lineHeight: "2.0",
          containerPadding: "0",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
        </Column>
      </Row>
    </Body>
}`,...c.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      backgroundColor: "#f8fafc",
      fontFamily: {
        label: "Inter",
        value: "Inter, system-ui, -apple-system, sans-serif"
      },
      textColor: "#1e293b",
      linkStyle: {
        linkColor: "#0ea5e9",
        linkHoverColor: "#0284c7",
        linkUnderline: false,
        linkHoverUnderline: true
      },
      contentAlign: "center",
      contentWidth: "900px"
    },
    mode: "web"
  },
  render: args => <Body {...args}>
      {/* Welcome Section */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="60px 40px" mode="web">
        <Column>
          <Text values={{
          text: "👋 WELCOME TO UNLAYER",
          fontSize: "14px",
          color: "#0ea5e9",
          textAlign: "center",
          lineHeight: "1.5",
          containerPadding: "0 0 16px 0",
          fontFamily: "Inter, sans-serif",
          fontWeight: "600",
          letterSpacing: "0.05em"
        }} mode="web" />
          <Heading values={{
          text: "Build Beautiful Emails & Pages",
          headingType: "h1",
          fontSize: "42px",
          fontWeight: "800",
          color: "#1e293b",
          textAlign: "center",
          containerPadding: "0 0 20px 0",
          fontFamily: "Inter, sans-serif",
          lineHeight: "1.1"
        }} mode="web" />
          <Text values={{
          text: "Create stunning email templates, landing pages, and documents with our powerful drag-and-drop builder. No coding required.",
          fontSize: "18px",
          color: "#64748b",
          textAlign: "center",
          lineHeight: "1.6",
          containerPadding: "0 0 32px 0",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
          <Button values={{
          text: "Start Building →",
          buttonColors: {
            backgroundColor: "#0ea5e9",
            color: "#ffffff"
          },
          padding: "14px 28px",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: "600",
          textAlign: "center",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
        </Column>
      </Row>

      {/* Features Grid */}
      <Row layout={ColumnLayouts.ThreeEqual} backgroundColor="#f8fafc" padding="60px 40px" mode="web">
        <Column>
          <Text values={{
          text: "🎨",
          fontSize: "32px",
          textAlign: "center",
          containerPadding: "0 0 16px 0"
        }} mode="web" />
          <Heading values={{
          text: "Drag & Drop Builder",
          headingType: "h3",
          fontSize: "20px",
          fontWeight: "700",
          color: "#1e293b",
          textAlign: "center",
          containerPadding: "0 0 12px 0",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
          <Text values={{
          text: "Intuitive visual editor with pre-built components and templates.",
          fontSize: "14px",
          color: "#64748b",
          textAlign: "center",
          lineHeight: "1.5",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
        </Column>
        <Column>
          <Text values={{
          text: "📱",
          fontSize: "32px",
          textAlign: "center",
          containerPadding: "0 0 16px 0"
        }} mode="web" />
          <Heading values={{
          text: "Responsive Design",
          headingType: "h3",
          fontSize: "20px",
          fontWeight: "700",
          color: "#1e293b",
          textAlign: "center",
          containerPadding: "0 0 12px 0",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
          <Text values={{
          text: "Perfect rendering across all devices and email clients.",
          fontSize: "14px",
          color: "#64748b",
          textAlign: "center",
          lineHeight: "1.5",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
        </Column>
        <Column>
          <Text values={{
          text: "⚡",
          fontSize: "32px",
          textAlign: "center",
          containerPadding: "0 0 16px 0"
        }} mode="web" />
          <Heading values={{
          text: "Export Anywhere",
          headingType: "h3",
          fontSize: "20px",
          fontWeight: "700",
          color: "#1e293b",
          textAlign: "center",
          containerPadding: "0 0 12px 0",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
          <Text values={{
          text: "Export to HTML, PDF, or integrate with your favorite tools.",
          fontSize: "14px",
          color: "#64748b",
          textAlign: "center",
          lineHeight: "1.5",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
        </Column>
      </Row>
    </Body>
}`,...f.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      backgroundColor: "#ffffff",
      fontFamily: {
        label: "Inter",
        value: "Inter, system-ui, -apple-system, sans-serif"
      },
      textColor: "#1f2937",
      linkStyle: {
        linkColor: "#3b82f6",
        linkHoverColor: "#1d4ed8",
        linkUnderline: false,
        linkHoverUnderline: true
      },
      contentAlign: "center",
      contentWidth: "1200px"
    },
    mode: "web"
  },
  render: args => <Body {...args}>
      {/* Hero Section */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="transparent" padding="120px 40px 80px 40px" mode="web">
        <Column>
          <Text values={{
          text: "EMBEDDABLE CONTENT CREATION TOOLS",
          fontSize: "12px",
          color: "#6b7280",
          textAlign: "center",
          lineHeight: "1.5",
          containerPadding: "0 0 24px 0",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
          <Heading values={{
          text: "Empower Your SaaS with Professional Content Creation",
          headingType: "h1",
          fontSize: "56px",
          fontWeight: "700",
          color: "#1f2937",
          textAlign: "center",
          containerPadding: "0 0 32px 0",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
          <Text values={{
          text: "Integrate powerful drag-n-drop builders for emails, pages, and documents. Save development costs and accelerate your go-to-market strategy.",
          fontSize: "20px",
          color: "#4b5563",
          textAlign: "center",
          lineHeight: "1.6",
          containerPadding: "0 0 48px 0",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
          <Button values={{
          text: "Get Started Now",
          buttonColors: {
            backgroundColor: "#3b82f6",
            color: "#ffffff"
          },
          padding: "16px 32px",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: "600",
          textAlign: "center",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
        </Column>
      </Row>

      {/* Stats Section */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#f8fafc" padding="80px 40px" mode="web">
        <Column>
          <Heading values={{
          text: "ENTERPRISE-GRADE PLATFORM",
          headingType: "h3",
          fontSize: "12px",
          fontWeight: "600",
          color: "#6b7280",
          textAlign: "center",
          containerPadding: "0 0 16px 0",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
          <Heading values={{
          text: "Trusted by Industry Leaders",
          headingType: "h2",
          fontSize: "36px",
          fontWeight: "700",
          color: "#1f2937",
          textAlign: "center",
          containerPadding: "0 0 24px 0",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
          <Text values={{
          text: "Join over 1000+ successful companies who trust Unlayer to power their content creation workflows",
          fontSize: "18px",
          color: "#4b5563",
          textAlign: "center",
          lineHeight: "1.6",
          containerPadding: "0 0 48px 0",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
        </Column>
      </Row>
    </Body>
}`,...x.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      backgroundColor: "#f8fafc",
      fontFamily: {
        label: "Arial",
        value: "Arial, Helvetica, sans-serif"
      },
      textColor: "#1f2937",
      linkStyle: {
        linkColor: "#3b82f6",
        linkHoverColor: "#1d4ed8",
        linkUnderline: true,
        linkHoverUnderline: true
      },
      contentAlign: "center",
      contentWidth: "600px"
    },
    mode: "email"
  },
  render: args => <Body {...args}>
      {/* Header */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff" padding="40px 30px 20px 30px" mode="email">
        <Column>
          <Text values={{
          text: "📧 EMAIL MODE SHOWCASE",
          fontSize: "12px",
          color: "#059669",
          textAlign: "center",
          lineHeight: "1.5",
          containerPadding: "0 0 16px 0",
          fontFamily: "Arial, Helvetica, sans-serif"
        }} mode="email" />
          <Heading values={{
          text: "Email-Safe Templates",
          headingType: "h1",
          fontSize: "32px",
          fontWeight: "700",
          color: "#1f2937",
          textAlign: "center",
          containerPadding: "0 0 16px 0",
          fontFamily: "Arial, Helvetica, sans-serif"
        }} mode="email" />
          <Text values={{
          text: "Optimized for email clients with table-based layouts, inline CSS, and maximum compatibility across Gmail, Outlook, and Apple Mail.",
          fontSize: "16px",
          color: "#4b5563",
          textAlign: "center",
          lineHeight: "1.5",
          containerPadding: "0 0 24px 0",
          fontFamily: "Arial, Helvetica, sans-serif"
        }} mode="email" />
          <Button values={{
          text: "Try Email Builder",
          buttonColors: {
            backgroundColor: "#059669",
            color: "#ffffff"
          },
          padding: "14px 28px",
          borderRadius: "4px",
          fontSize: "16px",
          fontWeight: "600",
          textAlign: "center",
          fontFamily: "Arial, Helvetica, sans-serif"
        }} mode="email" />
        </Column>
      </Row>

      {/* Features */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#f0fdf4" padding="30px 30px 40px 30px" mode="email">
        <Column>
          <Text values={{
          text: "✅ Table-Based Layouts\\n✅ Inline CSS Styles\\n✅ Outlook Compatible\\n✅ Gmail Tested\\n✅ Mobile Responsive",
          fontSize: "14px",
          color: "#065f46",
          textAlign: "center",
          lineHeight: "2.0",
          containerPadding: "0",
          fontFamily: "Arial, Helvetica, sans-serif"
        }} mode="email" />
        </Column>
      </Row>
    </Body>
}`,...p.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      backgroundColor: "#ffffff",
      fontFamily: {
        label: "Times New Roman",
        value: "Times New Roman, Times, serif"
      },
      textColor: "#000000",
      linkStyle: {
        linkColor: "#0066cc",
        linkHoverColor: "#004499",
        linkUnderline: true,
        linkHoverUnderline: true
      },
      contentAlign: "left",
      contentWidth: "100%"
    },
    mode: "document"
  },
  render: args => <Body {...args}>
      {/* Document Header */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="transparent" padding="60px 80px 20px 80px" mode="document">
        <Column>
          <Heading values={{
          text: "QUARTERLY BUSINESS REPORT",
          headingType: "h1",
          fontSize: "24px",
          fontWeight: "700",
          color: "#000000",
          textAlign: "center",
          containerPadding: "0 0 8px 0",
          fontFamily: "Times New Roman, Times, serif"
        }} mode="document" />
          <Text values={{
          text: "Q4 2024 Performance Analysis",
          fontSize: "16px",
          color: "#333333",
          textAlign: "center",
          lineHeight: "1.4",
          containerPadding: "0 0 20px 0",
          fontFamily: "Times New Roman, Times, serif"
        }} mode="document" />
          <Text values={{
          text: "Prepared by: Finance Department\\nDate: December 31, 2024\\nDocument ID: RPT-2024-Q4-001",
          fontSize: "11px",
          color: "#666666",
          textAlign: "center",
          lineHeight: "1.6",
          containerPadding: "0 0 30px 0",
          fontFamily: "Times New Roman, Times, serif"
        }} mode="document" />
        </Column>
      </Row>

      {/* Executive Summary */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="transparent" padding="0px 80px 20px 80px" mode="document">
        <Column>
          <Heading values={{
          text: "1. Executive Summary",
          headingType: "h2",
          fontSize: "16px",
          fontWeight: "700",
          color: "#000000",
          textAlign: "left",
          containerPadding: "0 0 12px 0",
          fontFamily: "Times New Roman, Times, serif"
        }} mode="document" />
          <Text values={{
          text: "This quarterly report presents a comprehensive analysis of our business performance for Q4 2024. The company has achieved significant growth across multiple key performance indicators, with revenue increasing by 23% compared to the previous quarter.",
          fontSize: "12px",
          color: "#000000",
          textAlign: "justify",
          lineHeight: "1.6",
          containerPadding: "0 0 20px 0",
          fontFamily: "Times New Roman, Times, serif"
        }} mode="document" />
        </Column>
      </Row>

      {/* Financial Performance Table */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="transparent" padding="0px 80px 20px 80px" mode="document">
        <Column>
          <Heading values={{
          text: "2. Financial Performance",
          headingType: "h2",
          fontSize: "16px",
          fontWeight: "700",
          color: "#000000",
          textAlign: "left",
          containerPadding: "0 0 12px 0",
          fontFamily: "Times New Roman, Times, serif"
        }} mode="document" />
          <Text values={{
          text: "The following table summarizes our key financial metrics for Q4 2024:",
          fontSize: "12px",
          color: "#000000",
          textAlign: "left",
          lineHeight: "1.6",
          containerPadding: "0 0 16px 0",
          fontFamily: "Times New Roman, Times, serif"
        }} mode="document" />
        </Column>
      </Row>

      {/* Financial Performance Table */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="transparent" padding="0px 80px 20px 80px" mode="document">
        <Column>
          <Table values={{
          table: {
            headers: [{
              cells: [{
                text: "Metric"
              }, {
                text: "Q3 2024"
              }, {
                text: "Q4 2024"
              }, {
                text: "Growth %"
              }]
            }],
            rows: [{
              cells: [{
                text: "Total Revenue"
              }, {
                text: "$2,450,000"
              }, {
                text: "$3,015,000"
              }, {
                text: "+23.1%"
              }]
            }, {
              cells: [{
                text: "Net Profit"
              }, {
                text: "$485,000"
              }, {
                text: "$642,000"
              }, {
                text: "+32.4%"
              }]
            }, {
              cells: [{
                text: "Active Customers"
              }, {
                text: "12,450"
              }, {
                text: "15,680"
              }, {
                text: "+25.9%"
              }]
            }, {
              cells: [{
                text: "Customer Acquisition"
              }, {
                text: "1,250"
              }, {
                text: "1,890"
              }, {
                text: "+51.2%"
              }]
            }, {
              cells: [{
                text: "Monthly Recurring Rev."
              }, {
                text: "$815,000"
              }, {
                text: "$1,005,000"
              }, {
                text: "+23.3%"
              }]
            }, {
              cells: [{
                text: "Churn Rate"
              }, {
                text: "3.2%"
              }, {
                text: "2.1%"
              }, {
                text: "-34.4%"
              }]
            }]
          },
          enableHeader: true,
          backgroundColor: "#ffffff",
          border: {
            borderTopWidth: "1px",
            borderTopStyle: "solid",
            borderTopColor: "#000000",
            borderLeftWidth: "1px",
            borderLeftStyle: "solid",
            borderLeftColor: "#000000",
            borderRightWidth: "1px",
            borderRightStyle: "solid",
            borderRightColor: "#000000",
            borderBottomWidth: "1px",
            borderBottomStyle: "solid",
            borderBottomColor: "#000000"
          },
          headerBackgroundColor: "#f8f9fa",
          headerColor: "#000000",
          headerFontSize: "12px",
          headerFontWeight: "700",
          headerTextAlign: "left",
          headerFontFamily: "Times New Roman, Times, serif",
          contentColor: "#000000",
          contentFontSize: "11px",
          contentTextAlign: "left",
          contentFontFamily: "Times New Roman, Times, serif",
          contentLineHeight: "1.4",
          containerPadding: "0 0 20px 0"
        }} mode="document" />
        </Column>
      </Row>

      {/* Key Insights */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="transparent" padding="0px 80px 20px 80px" mode="document">
        <Column>
          <Heading values={{
          text: "3. Key Insights",
          headingType: "h2",
          fontSize: "16px",
          fontWeight: "700",
          color: "#000000",
          textAlign: "left",
          containerPadding: "0 0 12px 0",
          fontFamily: "Times New Roman, Times, serif"
        }} mode="document" />
          <Text values={{
          text: "• Revenue Growth: Exceeded targets by 8.1%, driven by strong customer acquisition\\n• Profitability: Improved margins through operational efficiency initiatives\\n• Customer Retention: Significant reduction in churn rate indicates improved satisfaction\\n• Market Expansion: Successfully entered two new geographic markets",
          fontSize: "12px",
          color: "#000000",
          textAlign: "left",
          lineHeight: "1.8",
          containerPadding: "0 0 20px 0",
          fontFamily: "Times New Roman, Times, serif"
        }} mode="document" />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="transparent" padding="20px 80px 60px 80px" mode="document">
        <Column>
          <Text values={{
          text: "This document is confidential and proprietary. Distribution is restricted to authorized personnel only.\\n\\nFor questions regarding this report, please contact: finance@company.com",
          fontSize: "10px",
          color: "#666666",
          textAlign: "center",
          lineHeight: "1.6",
          containerPadding: "20px 0 0 0",
          fontFamily: "Times New Roman, Times, serif"
        }} mode="document" />
        </Column>
      </Row>
    </Body>
}`,...m.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      backgroundColor: "#1e293b",
      backgroundImage: {
        url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=800&fit=crop&q=80",
        fullWidth: true,
        repeat: "no-repeat",
        size: "cover",
        position: "center"
      },
      fontFamily: {
        label: "System",
        value: "system-ui, -apple-system, sans-serif"
      },
      textColor: "#ffffff",
      linkStyle: {
        linkColor: "#60a5fa",
        linkHoverColor: "#93c5fd",
        linkUnderline: false,
        linkHoverUnderline: true
      },
      contentAlign: "center",
      contentWidth: "800px"
    },
    mode: "web"
  },
  render: args => <Body {...args}>
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="rgba(0, 0, 0, 0.5)" padding="80px 40px" mode="web">
        <Column>
          <Heading values={{
          text: "🌟 Hero Section with Background",
          headingType: "h1",
          fontSize: "48px",
          fontWeight: "900",
          color: "#ffffff",
          textAlign: "center",
          containerPadding: "0 0 24px 0",
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "-0.02em",
          lineHeight: "1.1"
        }} mode="web" />
          <Text values={{
          text: "This Body component showcases a beautiful background image with overlay content. Perfect for hero sections and landing pages.",
          fontSize: "20px",
          color: "#e2e8f0",
          textAlign: "center",
          lineHeight: "1.6",
          containerPadding: "0 0 32px 0",
          fontFamily: "system-ui, sans-serif"
        }} mode="web" />
          <Button values={{
          text: "🚀 Explore More",
          buttonColors: {
            backgroundColor: "#3b82f6",
            color: "#ffffff"
          },
          padding: "16px 32px",
          borderRadius: "8px",
          fontSize: "18px",
          fontWeight: "600",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          border: {
            borderWidth: "2px",
            borderStyle: "solid",
            borderColor: "#3b82f6"
          }
        }} mode="web" />
        </Column>
      </Row>
    </Body>
}`,...u.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    values: {
      backgroundColor: "#f1f5f9",
      fontFamily: {
        label: "Inter",
        value: "Inter, system-ui, sans-serif"
      },
      textColor: "#0f172a",
      linkStyle: {
        linkColor: "#0ea5e9",
        linkHoverColor: "#0284c7",
        linkUnderline: false,
        linkHoverUnderline: true
      },
      contentAlign: "center",
      contentWidth: "900px"
    },
    mode: "web"
  },
  render: args => <Body {...args}>
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="transparent" padding="40px 20px 20px 20px" mode="web">
        <Column>
          <Heading values={{
          text: "📊 Feature Showcase",
          headingType: "h2",
          fontSize: "36px",
          fontWeight: "800",
          color: "#0f172a",
          textAlign: "center",
          containerPadding: "0 0 40px 0",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.ThreeEqual} backgroundColor="transparent" padding="0 20px 40px 20px" columnsBackgroundColor="#ffffff" mode="web">
        <Column>
          <Text values={{
          text: "🎨 Design",
          fontSize: "20px",
          fontWeight: "700",
          color: "#3b82f6",
          textAlign: "center",
          containerPadding: "24px 16px 12px 16px",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
          <Text values={{
          text: "Beautiful, responsive designs that work across all devices and email clients.",
          fontSize: "14px",
          color: "#64748b",
          textAlign: "center",
          lineHeight: "1.5",
          containerPadding: "0 16px 24px 16px",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
        </Column>

        <Column>
          <Text values={{
          text: "⚡ Performance",
          fontSize: "20px",
          fontWeight: "700",
          color: "#10b981",
          textAlign: "center",
          containerPadding: "24px 16px 12px 16px",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
          <Text values={{
          text: "Lightning-fast rendering with optimized code generation and CDN delivery.",
          fontSize: "14px",
          color: "#64748b",
          textAlign: "center",
          lineHeight: "1.5",
          containerPadding: "0 16px 24px 16px",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
        </Column>

        <Column>
          <Text values={{
          text: "🔧 Flexibility",
          fontSize: "20px",
          fontWeight: "700",
          color: "#f59e0b",
          textAlign: "center",
          containerPadding: "24px 16px 12px 16px",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
          <Text values={{
          text: "Highly customizable components that adapt to your brand and requirements.",
          fontSize: "14px",
          color: "#64748b",
          textAlign: "center",
          lineHeight: "1.5",
          containerPadding: "0 16px 24px 16px",
          fontFamily: "Inter, sans-serif"
        }} mode="web" />
        </Column>
      </Row>
    </Body>
}`,...g.parameters?.docs?.source}}};const P=["SemanticPropsExample","WebMode","Default","LightMode","EmailMode","DocumentMode","BackgroundImage","MultiColumnLayout"];export{u as BackgroundImage,f as Default,m as DocumentMode,p as EmailMode,x as LightMode,g as MultiColumnLayout,d as SemanticPropsExample,c as WebMode,P as __namedExportsOrder,R as default};
