import{j as o}from"./jsx-runtime-xwze4D1j.js";import{D as d}from"./Divider-0fPrDG0q.js";import{H as a}from"./Heading-D9pqzybp.js";import{M as u}from"./Body-BK25WPe3.js";import{P as i}from"./Paragraph-D5sjAO1l.js";import{R as t,C as e}from"./Column-DAtsyuq_.js";import{E as h}from"./Email-DnqwI5Jp.js";import{C as n}from"./create-component-Th5TTpA4.js";import"./iframe-Tag0ZA8G.js";import"./preload-helper-PPVm8Dsz.js";import"./markup-kYjE3CG0.js";import"./Html-vYj9dK7z.js";import"./Button-Dl8ekx4f.js";import"./Image-DVwsdY2-.js";import"./Social-B_B2N5bL.js";import"./Table-1jVQHU5y.js";const l="#18181B",p="#52525B",m="#A1A1AA",c="#E4E4E7",x={label:"Sans Serif",value:"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"};function r(){return o.jsxs(h,{backgroundColor:"#FAFAFA",contentWidth:"600px",fontFamily:x,children:[o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"32px 48px 0 48px",children:o.jsx(e,{children:o.jsx(a,{headingType:"h3",fontSize:"18px",fontWeight:700,color:l,textAlign:"left",children:"◆ Linear"})})}),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"20px 48px 0 48px",children:o.jsxs(e,{children:[o.jsx(a,{headingType:"h1",fontSize:"32px",fontWeight:700,color:l,lineHeight:"120%",children:"Product updates, June 2026"}),o.jsx(i,{html:"Three improvements shipped this month to make you faster.",fontSize:"16px",color:p,lineHeight:"160%"})]})}),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"20px 48px 0 48px",children:o.jsxs(e,{children:[o.jsx(a,{headingType:"h2",fontSize:"20px",fontWeight:600,color:l,lineHeight:"130%",children:"Faster command palette"}),o.jsx(i,{html:"The command palette now opens in under 50ms. Read the full <a href='https://linear.app/changelog'>changelog entry</a> for the details.",fontSize:"15px",color:p,lineHeight:"160%"})]})}),o.jsxs(t,{layout:n.TwoEqual,backgroundColor:"#FFFFFF",padding:"12px 48px 8px 48px",children:[o.jsxs(e,{children:[o.jsx(a,{headingType:"h2",fontSize:"20px",fontWeight:600,color:l,children:"Sub-issues"}),o.jsx(i,{html:"Break work down without leaving the issue view.",fontSize:"15px",color:p,lineHeight:"160%"})]}),o.jsxs(e,{children:[o.jsx(a,{headingType:"h2",fontSize:"20px",fontWeight:600,color:l,children:"Saved views"}),o.jsx(i,{html:"Pin the filters you use every day to the sidebar.",fontSize:"15px",color:p,lineHeight:"160%"})]})]}),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"16px 48px 0 48px",children:o.jsx(e,{children:o.jsx(d,{borderTopWidth:"1px",borderTopColor:c,borderTopStyle:"solid"})})}),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"16px 48px 8px 48px",children:o.jsx(e,{children:o.jsx(u,{items:[{text:"Docs",href:"https://linear.app/docs"},{text:"Blog",href:"https://linear.app/blog"},{text:"Careers",href:"https://linear.app/careers"}],layout:"horizontal",separator:"•",align:"center"})})}),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"0 48px 36px 48px",children:o.jsx(e,{children:o.jsx(i,{html:"You're receiving this because you use Linear.",fontSize:"12px",color:m,textAlign:"center"})})})]})}const v={title:"Agent Examples/Linear · Product Digest",component:r},s={};r.__docgenInfo={description:"",methods:[],displayName:"ProductDigest"};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`function ProductDigest() {
  return <Email backgroundColor="#FAFAFA" contentWidth="600px" fontFamily={sans}>
      {/* Brand */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="32px 48px 0 48px">
        <Column>
          <Heading headingType="h3" fontSize="18px" fontWeight={700} color={INK} textAlign="left">
            ◆ Linear
          </Heading>
        </Column>
      </Row>

      {/* Title */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="20px 48px 0 48px">
        <Column>
          <Heading headingType="h1" fontSize="32px" fontWeight={700} color={INK} lineHeight="120%">
            Product updates, June 2026
          </Heading>
          <Paragraph html="Three improvements shipped this month to make you faster." fontSize="16px" color={BODY} lineHeight="160%" />
        </Column>
      </Row>

      {/* Feature 1 */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="20px 48px 0 48px">
        <Column>
          <Heading headingType="h2" fontSize="20px" fontWeight={600} color={INK} lineHeight="130%">
            Faster command palette
          </Heading>
          <Paragraph html="The command palette now opens in under 50ms. Read the full <a href='https://linear.app/changelog'>changelog entry</a> for the details." fontSize="15px" color={BODY} lineHeight="160%" />
        </Column>
      </Row>

      {/* Two-column features */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#FFFFFF" padding="12px 48px 8px 48px">
        <Column>
          <Heading headingType="h2" fontSize="20px" fontWeight={600} color={INK}>
            Sub-issues
          </Heading>
          <Paragraph html="Break work down without leaving the issue view." fontSize="15px" color={BODY} lineHeight="160%" />
        </Column>
        <Column>
          <Heading headingType="h2" fontSize="20px" fontWeight={600} color={INK}>
            Saved views
          </Heading>
          <Paragraph html="Pin the filters you use every day to the sidebar." fontSize="15px" color={BODY} lineHeight="160%" />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="16px 48px 0 48px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* Footer menu */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="16px 48px 8px 48px">
        <Column>
          <Menu items={[{
          text: "Docs",
          href: "https://linear.app/docs"
        }, {
          text: "Blog",
          href: "https://linear.app/blog"
        }, {
          text: "Careers",
          href: "https://linear.app/careers"
        }]} layout="horizontal" separator="•" align="center" />
        </Column>
      </Row>
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="0 48px 36px 48px">
        <Column>
          <Paragraph html="You're receiving this because you use Linear." fontSize="12px" color={MUTED} textAlign="center" />
        </Column>
      </Row>
    </Email>;
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:"{}",...s.parameters?.docs?.source}}};const E=["ProductDigest","Default"];export{s as Default,r as ProductDigest,E as __namedExportsOrder,v as default};
