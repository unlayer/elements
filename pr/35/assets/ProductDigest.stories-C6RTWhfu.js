import{j as e}from"./jsx-runtime-D0Ax_1V6.js";import{D as d}from"./Divider-BPiKx73Q.js";import{H as a}from"./Heading-BlPJe80S.js";import{M as u}from"./Menu-DD9ILzd7.js";import{P as i}from"./Paragraph-Dv65ToeF.js";import{R as n,C as o}from"./Column-JO9XLS40.js";import{E as h}from"./Email-BKOORzq_.js";import{C as t}from"./create-component-D81WrlbS.js";import"./iframe-DbtyXCV9.js";import"./preload-helper-PPVm8Dsz.js";import"./Body-VpB_cE-U.js";const l="#18181B",p="#52525B",c="#A1A1AA",x="#E4E4E7",g={label:"Sans Serif",value:"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"};function r(){return e.jsxs(h,{backgroundColor:"#FAFAFA",contentWidth:"600px",fontFamily:g,children:[e.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"32px 48px 0 48px",children:e.jsx(o,{children:e.jsx(a,{headingType:"h3",fontSize:"18px",fontWeight:700,color:l,textAlign:"left",children:"◆ Linear"})})}),e.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"20px 48px 0 48px",children:e.jsxs(o,{children:[e.jsx(a,{headingType:"h1",fontSize:"32px",fontWeight:700,color:l,lineHeight:"120%",children:"Product updates, June 2026"}),e.jsx(i,{html:"Three improvements shipped this month to make you faster.",fontSize:"16px",color:p,lineHeight:"160%"})]})}),e.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"20px 48px 0 48px",children:e.jsxs(o,{children:[e.jsx(a,{headingType:"h2",fontSize:"20px",fontWeight:600,color:l,lineHeight:"130%",children:"Faster command palette"}),e.jsx(i,{html:"The command palette now opens in under 50ms. Read the full <a href='https://linear.app/changelog'>changelog entry</a> for the details.",fontSize:"15px",color:p,lineHeight:"160%"})]})}),e.jsxs(n,{layout:t.TwoEqual,backgroundColor:"#FFFFFF",padding:"12px 48px 8px 48px",children:[e.jsxs(o,{children:[e.jsx(a,{headingType:"h2",fontSize:"20px",fontWeight:600,color:l,children:"Sub-issues"}),e.jsx(i,{html:"Break work down without leaving the issue view.",fontSize:"15px",color:p,lineHeight:"160%"})]}),e.jsxs(o,{children:[e.jsx(a,{headingType:"h2",fontSize:"20px",fontWeight:600,color:l,children:"Saved views"}),e.jsx(i,{html:"Pin the filters you use every day to the sidebar.",fontSize:"15px",color:p,lineHeight:"160%"})]})]}),e.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"16px 48px 0 48px",children:e.jsx(o,{children:e.jsx(d,{borderTopWidth:"1px",borderTopColor:x,borderTopStyle:"solid"})})}),e.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"16px 48px 8px 48px",children:e.jsx(o,{children:e.jsx(u,{items:[{text:"Docs",href:"https://linear.app/docs"},{text:"Blog",href:"https://linear.app/blog"},{text:"Careers",href:"https://linear.app/careers"}],layout:"horizontal",separator:"•",align:"center"})})}),e.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"0 48px 36px 48px",children:e.jsx(o,{children:e.jsx(i,{html:"You're receiving this because you use Linear.",fontSize:"12px",color:c,textAlign:"center"})})})]})}const k={title:"Agent Examples/Linear · Product Digest",component:r},s={};r.__docgenInfo={description:"",methods:[],displayName:"ProductDigest"};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`function ProductDigest() {
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
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:"{}",...s.parameters?.docs?.source}}};const z=["ProductDigest","Default"];export{s as Default,r as ProductDigest,z as __namedExportsOrder,k as default};
