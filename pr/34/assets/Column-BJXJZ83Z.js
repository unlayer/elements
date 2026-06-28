import{j as x}from"./jsx-runtime-BGQ56ehA.js";import{R as _}from"./iframe-Uf6U1a0S.js";import{w as I,x as V,v as k,o as D,m as q,j as T,J as $,q as M,U as B,r as E,K as v}from"./create-component-CtZsFBQG.js";const H=I,{popupPosition:pe,popupDisplayDelay:le,popupWidth:de,popupHeight:me,popupBackgroundColor:ue,popupBackgroundImage:ce,popupOverlay_backgroundColor:ye,popupCloseButton_position:fe,popupCloseButton_backgroundColor:we,popupCloseButton_iconColor:ge,popupCloseButton_borderRadius:Ce,popupCloseButton_margin:_e,popupCloseButton_action:xe,...j}=H,F=j,W={...V},O={...k},K=W,Y=F;function G(r){if(r.length===0)return[];const o=r.reduce((t,n)=>t+n,0);return o<=0?[]:r.map(t=>{const n=Math.round(t/o*100*100)/100,a=`${n}`.replace(/\./g,"p");return{value:n,className:a}})}function J(r,o,t=600,n=620){const a=G(r);if(o==="email"){const e=`@media only screen and (min-width: ${t+20}px)`,s=`@media only screen and (max-width: ${t+20}px)`;return`
${e} {
  .u-row { width: ${t}px !important; }
  .u-row .u-col { vertical-align: top; }
${a.map(({value:d,className:c})=>`  .u-row .u-col-${c} { width: ${Math.round(t*d/100)}px !important; }`).join(`
`)}
}

${s} {
  .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
  .u-row { width: 100% !important; }
  .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
  .u-row .u-col > div { margin: 0 auto; }
  .no-stack .u-col { min-width: 0 !important; display: table-cell !important; }
${a.map(({value:d,className:c})=>`  .no-stack .u-col-${c} { width: ${d}% !important; }`).join(`
`)}
}`}const p=`
.u-row {
  display: flex;
  flex-wrap: nowrap;
  margin-left: 0;
  margin-right: 0;
}
.u-row .u-col {
  position: relative;
  width: 100%;
  padding-right: 0;
  padding-left: 0;
}`,l=a.map(({value:e,className:s})=>`.u-row .u-col.u-col-${s} { flex: 0 0 ${e}%; max-width: ${e}%; }`).join(`
`),u=`
@media only screen and (max-width: ${n}px) {
  .u-row { width: 100% !important; }
  .u-row .u-col {
    display: block !important;
    width: 100% !important;
    min-width: 320px !important;
    max-width: 100% !important;
  }
  .u-row .u-col > div { margin: 0 auto; }
  .no-stack .u-col {
    min-width: 0 !important;
    display: table-cell !important;
  }
${a.map(({value:e,className:s})=>`  .no-stack .u-col-${s} { width: ${e}% !important; }`).join(`
`)}
}`;return p+`
`+l+`
`+u}function Q(r,o=500){return M(r?.contentWidth,o)}function z(r,o,t,n,a,p="rows"){const u=($[n]||$.web)(r,o,t,{collection:p,variant:n}),e=Q(t),s=J(a,n,e);return s?`<style>${s}</style>${u}`:u}function X(r,o,t,n,a,p){if(!r)return"";let l="";return _.Children.toArray(r).forEach((e,s)=>{if(!_.isValidElement(e)){(typeof e=="string"||typeof e=="number")&&(l+=String(e));return}const d=e.type;if((d?.displayName==="Column"||d?.name==="Column")&&typeof e.type=="function"){const m=e.type({...e.props,index:s,cells:o,bodyValues:t,rowValues:n,mode:a,_config:p});m?.props?.dangerouslySetInnerHTML?.__html&&(l+=m.props.dangerouslySetInnerHTML.__html)}else if(_.isValidElement(e)){const m=e.type?.displayName||e.type?.name||"Unknown";console.warn(`Row: <${m}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${m} /></Column></Row>`)}}),l}const P=r=>{const{layout:o,cells:t,children:n,mode:a,className:p,style:l,index:u=0,bodyValues:e={},collection:s="rows",_config:d,...c}=r,m=a??d?.mode??"web";let f=t||[1];o&&(D(o,_.Children.count(n)),f=o.cells);const w={...Y,...e},y=q(c,K,"Row"),i={...y,cells:f,_meta:{htmlID:T(d,"u_row"),htmlClassNames:"u_row",...y._meta||{}}},R=X(n,f,w,i,m,d);try{const g=z(R,i,w,m,f,s);return x.jsx("div",{dangerouslySetInnerHTML:{__html:g},className:p,style:l})}catch(g){return console.error("Row rendering failed:",g),x.jsx("div",{className:p,style:l,children:n})}};P.displayName="Row";P.__docgenInfo={description:"",methods:[],displayName:"Row",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},layout:{required:!1,tsType:{name:"ColumnLayout"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},collection:{required:!1,tsType:{name:"string"},description:""},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 48px", "20px 40px") or a number (px).'},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body"}}};const Z="10px",ee=O;function ne(r,o,t,n,a,p,l){return(v[l]||v.web)(r,o,t,n,a,p)}function oe(r,o,t,n){return(E[n]||E.web)(r,o,t,{})}const U=r=>{const{children:o,index:t=0,cells:n=[1],bodyValues:a={},rowValues:p={},mode:l,className:u,style:e,_config:s,...d}=r,c=l??s?.mode??"web",m=q(d,ee,"Column"),f={...m,_meta:{htmlID:T(s,"u_column"),htmlClassNames:"u_column",...m._meta||{}}};let w="";if(o)try{_.Children.toArray(o).forEach((i,R)=>{if(typeof i=="string"||typeof i=="number")w+=String(i);else if(_.isValidElement(i)&&typeof i.type=="function"){const g=i.type,C=(g[B]||g)({...i.props,_config:s,colIndex:t,cells:n,bodyValues:a,rowValues:p,columnValues:f});if(C&&typeof C=="object"&&C.props&&C.props.dangerouslySetInnerHTML){const h=C.props.dangerouslySetInnerHTML.__html,S=i.type,N=(S?.displayName||S?.name||"component").toLowerCase(),L=i.props,b=L.containerPadding??L.values?.containerPadding??Z,A={containerPadding:typeof b=="number"?`${b}px`:b,_meta:{htmlID:T(s,`u_content_${N}`),htmlClassNames:`u_content_${N}`}};w+=oe(h,A,a,c)}else if(C){const h=i.type?.displayName||i.type?.name||"Unknown";console.warn(`Column: <${h}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`)}}})}catch(y){console.error("Column: Failed to render children:",y),w=""}try{const y=ne(w,f,t,n,a,p,c);return x.jsx("div",{dangerouslySetInnerHTML:{__html:y},className:u,style:e})}catch(y){return console.error("Column rendering failed:",y),x.jsx("div",{className:u,style:e,children:o})}};U.displayName="Column";U.__docgenInfo={description:"",methods:[],displayName:"Column",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},index:{required:!1,tsType:{name:"number"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},rowValues:{required:!1,tsType:{name:"any"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 24px", "10px") or a number (px).'},borderRadius:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Corner radius — a number (→ px) or CSS string ("8px").'},border:{required:!1,tsType:{name:"signature",type:"object",raw:`{
  [K in keyof NonNullable<ColumnValues["border"]>]?: K extends \`\${string}Width\`
    ? SizeInput
    : NonNullable<ColumnValues["border"]>[K];
}`,signature:{properties:[{key:{name:"NonNullable",elements:[{name:'ColumnValues["border"]',raw:'ColumnValues["border"]'}],raw:'NonNullable<ColumnValues["border"]>',required:!1},value:{name:"unknown"}}]}},description:"Per-side border object (great for hairline dividers). Width fields accept\n a number/px string; reuse it as a factored-out const without `as const`."},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body/Row"}}};export{F as B,U as C,P as R};
