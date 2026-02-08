import{j as n}from"./jsx-runtime-CeNQlCuc.js";import{C as e,R as i}from"./Column-DBOgK1Qy.js";import{B as d}from"./Body-BcFaf7ar.js";import{B as r}from"./Button-C65C_Gd_.js";import{T as o}from"./Text-DZoIEdgn.js";import{H as t}from"./Heading-DSUodn_3.js";import{D as p}from"./Divider-B-Xj2llA.js";import"./iframe-Ofo6XfC9.js";import"./preload-helper-PPVm8Dsz.js";import"./create-component-DEvu5BmU.js";const S={title:"Layout/Column",component:e,parameters:{layout:"padded",docs:{description:{component:`
# Column Component

A layout container that represents a single column within a Row. Columns must be nested inside **Body > Row > Column** to render correctly.

## Key Features
- **Flexible Widths**: Controlled by the parent Row's \`cells\` prop (e.g., \`[1,1]\` for equal halves, \`[2,1]\` for 2:1 ratio)
- **Background Styling**: Colors, borders, and border radius
- **Padding Control**: Inner spacing for content
- **Semantic Props**: Clean flat API with automatic mapping to nested structures

## Usage

\`\`\`tsx
<Body>
  <Row cells={[1, 1]}>
    <Column backgroundColor="#f0f9ff" padding="20px">
      <Text values={{ text: "Left column" }} />
    </Column>
    <Column>
      <Text values={{ text: "Right column" }} />
    </Column>
  </Row>
</Body>
\`\`\`
        `}}},argTypes:{values:{description:'**Column Configuration Object**\n\nMain column options:\n- `backgroundColor`: Column background color\n- `padding`: Inner padding (e.g., "10px", "20px 16px")\n- `border`: Border configuration\n- `borderRadius`: Corner rounding (e.g., "8px")',control:!1,table:{type:{summary:"ColumnValues",detail:`{
  backgroundColor?: string;
  padding?: string;
  border?: object;
  borderRadius?: string;
}`}}}},tags:["autodocs"]},a={render:()=>n.jsx(d,{backgroundColor:"#f8fafc",contentAlign:"center",contentWidth:"600px",mode:"web",children:n.jsx(i,{cells:[1],backgroundColor:"#ffffff",padding:"40px",mode:"web",children:n.jsx(e,{children:n.jsx(o,{values:{text:"This is a single-column layout. The Column component wraps content inside a Row, which is itself inside a Body.",fontSize:"16px",color:"#374151",textAlign:"center",lineHeight:"1.6",containerPadding:"0"},mode:"web"})})})}),parameters:{docs:{description:{story:`
**Single Column** - The simplest layout: Body > Row > Column > Text.

\`\`\`tsx
<Body>
  <Row cells={[1]}>
    <Column>
      <Text values={{ text: "Hello world" }} />
    </Column>
  </Row>
</Body>
\`\`\`
        `}}}},l={render:()=>n.jsx(d,{backgroundColor:"#f1f5f9",contentAlign:"center",contentWidth:"600px",mode:"web",children:n.jsx(i,{cells:[1],backgroundColor:"transparent",padding:"40px",mode:"web",children:n.jsxs(e,{values:{backgroundColor:"#f0f9ff",padding:"20px",borderRadius:"8px"},children:[n.jsx(t,{values:{text:"Styled Column",headingType:"h3",fontSize:"24px",fontWeight:"700",color:"#0c4a6e",textAlign:"center",containerPadding:"0 0 12px 0"},mode:"web"}),n.jsx(o,{values:{text:"This column has a light blue background, 20px padding, and rounded corners via the values prop.",fontSize:"15px",color:"#475569",textAlign:"center",lineHeight:"1.6",containerPadding:"0"},mode:"web"})]})})}),parameters:{docs:{description:{story:`
**Styled Column** - Column with custom background, padding, and border radius.

\`\`\`tsx
<Column values={{
  backgroundColor: "#f0f9ff",
  padding: "20px",
  borderRadius: "8px"
}}>
  ...
</Column>
\`\`\`
        `}}}},s={render:()=>n.jsx(d,{backgroundColor:"#f8fafc",contentAlign:"center",contentWidth:"700px",mode:"web",children:n.jsxs(i,{cells:[1,1],backgroundColor:"#ffffff",padding:"40px 20px",mode:"web",children:[n.jsxs(e,{children:[n.jsx(t,{values:{text:"Left Column",headingType:"h3",fontSize:"22px",fontWeight:"700",color:"#1e293b",textAlign:"left",containerPadding:"0 0 12px 0"},mode:"web"}),n.jsx(o,{values:{text:"This is the left column in a two-column layout. Both columns share equal width defined by cells={[1,1]}.",fontSize:"15px",color:"#475569",textAlign:"left",lineHeight:"1.6",containerPadding:"0"},mode:"web"})]}),n.jsxs(e,{children:[n.jsx(t,{values:{text:"Right Column",headingType:"h3",fontSize:"22px",fontWeight:"700",color:"#1e293b",textAlign:"left",containerPadding:"0 0 12px 0"},mode:"web"}),n.jsx(o,{values:{text:"This is the right column. Each column can contain different components independently.",fontSize:"15px",color:"#475569",textAlign:"left",lineHeight:"1.6",containerPadding:"0 0 16px 0"},mode:"web"}),n.jsx(r,{backgroundColor:"#3b82f6",color:"white",padding:"10px 20px",borderRadius:"6px",fontSize:"14px",fontWeight:600,children:"Learn More"})]})]})}),parameters:{docs:{description:{story:`
**Two Columns** - Equal-width two-column layout using \`cells={[1,1]}\`.

\`\`\`tsx
<Row cells={[1, 1]}>
  <Column>...</Column>
  <Column>...</Column>
</Row>
\`\`\`
        `}}}},c={render:()=>n.jsx(d,{backgroundColor:"#f1f5f9",contentAlign:"center",contentWidth:"900px",mode:"web",children:n.jsxs(i,{cells:[1,1,1],backgroundColor:"transparent",padding:"40px 20px",columnsBackgroundColor:"#ffffff",mode:"web",children:[n.jsxs(e,{values:{padding:"24px",borderRadius:"8px"},children:[n.jsx(t,{values:{text:"Starter",headingType:"h3",fontSize:"20px",fontWeight:"700",color:"#1e293b",textAlign:"center",containerPadding:"0 0 8px 0"},mode:"web"}),n.jsx(o,{values:{text:"Perfect for individuals and small projects getting started.",fontSize:"14px",color:"#64748b",textAlign:"center",lineHeight:"1.5",containerPadding:"0 0 16px 0"},mode:"web"}),n.jsx(r,{backgroundColor:"#3b82f6",color:"white",padding:"10px 20px",borderRadius:"6px",fontSize:"14px",fontWeight:600,children:"Get Started"})]}),n.jsxs(e,{values:{padding:"24px",borderRadius:"8px"},children:[n.jsx(t,{values:{text:"Professional",headingType:"h3",fontSize:"20px",fontWeight:"700",color:"#1e293b",textAlign:"center",containerPadding:"0 0 8px 0"},mode:"web"}),n.jsx(o,{values:{text:"For growing teams that need collaboration and advanced features.",fontSize:"14px",color:"#64748b",textAlign:"center",lineHeight:"1.5",containerPadding:"0 0 16px 0"},mode:"web"}),n.jsx(r,{backgroundColor:"#7c3aed",color:"white",padding:"10px 20px",borderRadius:"6px",fontSize:"14px",fontWeight:600,children:"Upgrade Now"})]}),n.jsxs(e,{values:{padding:"24px",borderRadius:"8px"},children:[n.jsx(t,{values:{text:"Enterprise",headingType:"h3",fontSize:"20px",fontWeight:"700",color:"#1e293b",textAlign:"center",containerPadding:"0 0 8px 0"},mode:"web"}),n.jsx(o,{values:{text:"Custom solutions with dedicated support for large organizations.",fontSize:"14px",color:"#64748b",textAlign:"center",lineHeight:"1.5",containerPadding:"0 0 16px 0"},mode:"web"}),n.jsx(r,{backgroundColor:"#059669",color:"white",padding:"10px 20px",borderRadius:"6px",fontSize:"14px",fontWeight:600,children:"Contact Sales"})]})]})}),parameters:{docs:{description:{story:`
**Three Column Cards** - A pricing-card style layout with three equal columns, each containing a heading, description, and call-to-action button.

\`\`\`tsx
<Row cells={[1, 1, 1]} columnsBackgroundColor="#ffffff">
  <Column values={{ padding: "24px", borderRadius: "8px" }}>
    <Heading ... />
    <Text ... />
    <Button ... />
  </Column>
  {/* repeat for each card */}
</Row>
\`\`\`
        `}}}},u={render:()=>n.jsx(d,{backgroundColor:"#f8fafc",contentAlign:"center",contentWidth:"800px",mode:"web",children:n.jsxs(i,{cells:[2,1],backgroundColor:"#ffffff",padding:"40px 20px",mode:"web",children:[n.jsxs(e,{children:[n.jsx(t,{values:{text:"Main Content Area",headingType:"h2",fontSize:"28px",fontWeight:"700",color:"#1e293b",textAlign:"left",containerPadding:"0 0 16px 0"},mode:"web"}),n.jsx(o,{values:{text:"This wider column takes up two-thirds of the row width using the cells={[2,1]} ratio. It is ideal for primary content such as articles, descriptions, or product details.",fontSize:"16px",color:"#475569",textAlign:"left",lineHeight:"1.6",containerPadding:"0 0 20px 0"},mode:"web"}),n.jsx(p,{values:{border:{borderTopWidth:"1px",borderTopColor:"#e2e8f0",borderTopStyle:"solid"},width:"100%"},mode:"web"}),n.jsx(o,{values:{text:"Additional content can follow the divider, keeping the reading flow natural in this wide column.",fontSize:"14px",color:"#64748b",textAlign:"left",lineHeight:"1.5",containerPadding:"16px 0 0 0"},mode:"web"})]}),n.jsxs(e,{values:{backgroundColor:"#f0f9ff",padding:"16px",borderRadius:"8px"},children:[n.jsx(t,{values:{text:"Sidebar",headingType:"h4",fontSize:"18px",fontWeight:"700",color:"#0c4a6e",textAlign:"center",containerPadding:"0 0 12px 0"},mode:"web"}),n.jsx(o,{values:{text:"This narrower column is one-third of the row. Great for sidebars, navigation, or supplementary info.",fontSize:"13px",color:"#475569",textAlign:"center",lineHeight:"1.5",containerPadding:"0 0 16px 0"},mode:"web"}),n.jsx(r,{backgroundColor:"#0ea5e9",color:"white",padding:"10px 16px",borderRadius:"6px",fontSize:"13px",fontWeight:600,children:"View All"})]})]})}),parameters:{docs:{description:{story:`
**Uneven Layout (2:1 Ratio)** - Demonstrates asymmetric column widths using \`cells={[2,1]}\`. The left column takes two-thirds and the right column takes one-third of the available width.

\`\`\`tsx
<Row cells={[2, 1]}>
  <Column>
    {/* Wide main content */}
  </Column>
  <Column>
    {/* Narrow sidebar */}
  </Column>
</Row>
\`\`\`
        `}}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => <Body backgroundColor="#f8fafc" contentAlign="center" contentWidth="600px" mode="web">
      <Row cells={[1]} backgroundColor="#ffffff" padding="40px" mode="web">
        <Column>
          <Text values={{
          text: "This is a single-column layout. The Column component wraps content inside a Row, which is itself inside a Body.",
          fontSize: "16px",
          color: "#374151",
          textAlign: "center",
          lineHeight: "1.6",
          containerPadding: "0"
        }} mode="web" />
        </Column>
      </Row>
    </Body>,
  parameters: {
    docs: {
      description: {
        story: \`
**Single Column** - The simplest layout: Body > Row > Column > Text.

\\\`\\\`\\\`tsx
<Body>
  <Row cells={[1]}>
    <Column>
      <Text values={{ text: "Hello world" }} />
    </Column>
  </Row>
</Body>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...a.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <Body backgroundColor="#f1f5f9" contentAlign="center" contentWidth="600px" mode="web">
      <Row cells={[1]} backgroundColor="transparent" padding="40px" mode="web">
        <Column values={{
        backgroundColor: "#f0f9ff",
        padding: "20px",
        borderRadius: "8px"
      }}>
          <Heading values={{
          text: "Styled Column",
          headingType: "h3",
          fontSize: "24px",
          fontWeight: "700",
          color: "#0c4a6e",
          textAlign: "center",
          containerPadding: "0 0 12px 0"
        }} mode="web" />
          <Text values={{
          text: "This column has a light blue background, 20px padding, and rounded corners via the values prop.",
          fontSize: "15px",
          color: "#475569",
          textAlign: "center",
          lineHeight: "1.6",
          containerPadding: "0"
        }} mode="web" />
        </Column>
      </Row>
    </Body>,
  parameters: {
    docs: {
      description: {
        story: \`
**Styled Column** - Column with custom background, padding, and border radius.

\\\`\\\`\\\`tsx
<Column values={{
  backgroundColor: "#f0f9ff",
  padding: "20px",
  borderRadius: "8px"
}}>
  ...
</Column>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...l.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <Body backgroundColor="#f8fafc" contentAlign="center" contentWidth="700px" mode="web">
      <Row cells={[1, 1]} backgroundColor="#ffffff" padding="40px 20px" mode="web">
        <Column>
          <Heading values={{
          text: "Left Column",
          headingType: "h3",
          fontSize: "22px",
          fontWeight: "700",
          color: "#1e293b",
          textAlign: "left",
          containerPadding: "0 0 12px 0"
        }} mode="web" />
          <Text values={{
          text: "This is the left column in a two-column layout. Both columns share equal width defined by cells={[1,1]}.",
          fontSize: "15px",
          color: "#475569",
          textAlign: "left",
          lineHeight: "1.6",
          containerPadding: "0"
        }} mode="web" />
        </Column>
        <Column>
          <Heading values={{
          text: "Right Column",
          headingType: "h3",
          fontSize: "22px",
          fontWeight: "700",
          color: "#1e293b",
          textAlign: "left",
          containerPadding: "0 0 12px 0"
        }} mode="web" />
          <Text values={{
          text: "This is the right column. Each column can contain different components independently.",
          fontSize: "15px",
          color: "#475569",
          textAlign: "left",
          lineHeight: "1.6",
          containerPadding: "0 0 16px 0"
        }} mode="web" />
          <Button backgroundColor="#3b82f6" color="white" padding="10px 20px" borderRadius="6px" fontSize="14px" fontWeight={600}>
            Learn More
          </Button>
        </Column>
      </Row>
    </Body>,
  parameters: {
    docs: {
      description: {
        story: \`
**Two Columns** - Equal-width two-column layout using \\\`cells={[1,1]}\\\`.

\\\`\\\`\\\`tsx
<Row cells={[1, 1]}>
  <Column>...</Column>
  <Column>...</Column>
</Row>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...s.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <Body backgroundColor="#f1f5f9" contentAlign="center" contentWidth="900px" mode="web">
      <Row cells={[1, 1, 1]} backgroundColor="transparent" padding="40px 20px" columnsBackgroundColor="#ffffff" mode="web">
        <Column values={{
        padding: "24px",
        borderRadius: "8px"
      }}>
          <Heading values={{
          text: "Starter",
          headingType: "h3",
          fontSize: "20px",
          fontWeight: "700",
          color: "#1e293b",
          textAlign: "center",
          containerPadding: "0 0 8px 0"
        }} mode="web" />
          <Text values={{
          text: "Perfect for individuals and small projects getting started.",
          fontSize: "14px",
          color: "#64748b",
          textAlign: "center",
          lineHeight: "1.5",
          containerPadding: "0 0 16px 0"
        }} mode="web" />
          <Button backgroundColor="#3b82f6" color="white" padding="10px 20px" borderRadius="6px" fontSize="14px" fontWeight={600}>
            Get Started
          </Button>
        </Column>
        <Column values={{
        padding: "24px",
        borderRadius: "8px"
      }}>
          <Heading values={{
          text: "Professional",
          headingType: "h3",
          fontSize: "20px",
          fontWeight: "700",
          color: "#1e293b",
          textAlign: "center",
          containerPadding: "0 0 8px 0"
        }} mode="web" />
          <Text values={{
          text: "For growing teams that need collaboration and advanced features.",
          fontSize: "14px",
          color: "#64748b",
          textAlign: "center",
          lineHeight: "1.5",
          containerPadding: "0 0 16px 0"
        }} mode="web" />
          <Button backgroundColor="#7c3aed" color="white" padding="10px 20px" borderRadius="6px" fontSize="14px" fontWeight={600}>
            Upgrade Now
          </Button>
        </Column>
        <Column values={{
        padding: "24px",
        borderRadius: "8px"
      }}>
          <Heading values={{
          text: "Enterprise",
          headingType: "h3",
          fontSize: "20px",
          fontWeight: "700",
          color: "#1e293b",
          textAlign: "center",
          containerPadding: "0 0 8px 0"
        }} mode="web" />
          <Text values={{
          text: "Custom solutions with dedicated support for large organizations.",
          fontSize: "14px",
          color: "#64748b",
          textAlign: "center",
          lineHeight: "1.5",
          containerPadding: "0 0 16px 0"
        }} mode="web" />
          <Button backgroundColor="#059669" color="white" padding="10px 20px" borderRadius="6px" fontSize="14px" fontWeight={600}>
            Contact Sales
          </Button>
        </Column>
      </Row>
    </Body>,
  parameters: {
    docs: {
      description: {
        story: \`
**Three Column Cards** - A pricing-card style layout with three equal columns, each containing a heading, description, and call-to-action button.

\\\`\\\`\\\`tsx
<Row cells={[1, 1, 1]} columnsBackgroundColor="#ffffff">
  <Column values={{ padding: "24px", borderRadius: "8px" }}>
    <Heading ... />
    <Text ... />
    <Button ... />
  </Column>
  {/* repeat for each card */}
</Row>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...c.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <Body backgroundColor="#f8fafc" contentAlign="center" contentWidth="800px" mode="web">
      <Row cells={[2, 1]} backgroundColor="#ffffff" padding="40px 20px" mode="web">
        <Column>
          <Heading values={{
          text: "Main Content Area",
          headingType: "h2",
          fontSize: "28px",
          fontWeight: "700",
          color: "#1e293b",
          textAlign: "left",
          containerPadding: "0 0 16px 0"
        }} mode="web" />
          <Text values={{
          text: "This wider column takes up two-thirds of the row width using the cells={[2,1]} ratio. It is ideal for primary content such as articles, descriptions, or product details.",
          fontSize: "16px",
          color: "#475569",
          textAlign: "left",
          lineHeight: "1.6",
          containerPadding: "0 0 20px 0"
        }} mode="web" />
          <Divider values={{
          border: {
            borderTopWidth: "1px",
            borderTopColor: "#e2e8f0",
            borderTopStyle: "solid"
          },
          width: "100%"
        }} mode="web" />
          <Text values={{
          text: "Additional content can follow the divider, keeping the reading flow natural in this wide column.",
          fontSize: "14px",
          color: "#64748b",
          textAlign: "left",
          lineHeight: "1.5",
          containerPadding: "16px 0 0 0"
        }} mode="web" />
        </Column>
        <Column values={{
        backgroundColor: "#f0f9ff",
        padding: "16px",
        borderRadius: "8px"
      }}>
          <Heading values={{
          text: "Sidebar",
          headingType: "h4",
          fontSize: "18px",
          fontWeight: "700",
          color: "#0c4a6e",
          textAlign: "center",
          containerPadding: "0 0 12px 0"
        }} mode="web" />
          <Text values={{
          text: "This narrower column is one-third of the row. Great for sidebars, navigation, or supplementary info.",
          fontSize: "13px",
          color: "#475569",
          textAlign: "center",
          lineHeight: "1.5",
          containerPadding: "0 0 16px 0"
        }} mode="web" />
          <Button backgroundColor="#0ea5e9" color="white" padding="10px 16px" borderRadius="6px" fontSize="13px" fontWeight={600}>
            View All
          </Button>
        </Column>
      </Row>
    </Body>,
  parameters: {
    docs: {
      description: {
        story: \`
**Uneven Layout (2:1 Ratio)** - Demonstrates asymmetric column widths using \\\`cells={[2,1]}\\\`. The left column takes two-thirds and the right column takes one-third of the available width.

\\\`\\\`\\\`tsx
<Row cells={[2, 1]}>
  <Column>
    {/* Wide main content */}
  </Column>
  <Column>
    {/* Narrow sidebar */}
  </Column>
</Row>
\\\`\\\`\\\`
        \`
      }
    }
  }
}`,...u.parameters?.docs?.source}}};const R=["SingleColumn","StyledColumn","TwoColumns","ThreeColumnCards","UnevenLayout"];export{a as SingleColumn,l as StyledColumn,c as ThreeColumnCards,s as TwoColumns,u as UnevenLayout,R as __namedExportsOrder,S as default};
