import{j as T}from"./jsx-runtime-BOiB2KaS.js";import{R as g}from"./iframe-C9JHGIEW.js";import{T as k,S as M,A as H,r as V,m as P,o as N,J as L,w as B,e as O,U as $,y as A,K as I}from"./create-component-COmyy0g2.js";const j=k,{popupPosition:pe,popupDisplayDelay:de,popupWidth:me,popupHeight:ue,popupBackgroundColor:ce,popupBackgroundImage:ye,popupOverlay_backgroundColor:fe,popupCloseButton_position:we,popupCloseButton_backgroundColor:_e,popupCloseButton_iconColor:ge,popupCloseButton_borderRadius:Ce,popupCloseButton_margin:he,popupCloseButton_action:be,...F}=j,W=F,K={...M},Y={...H},G=K,J=W;function Q(r){if(r.length===0)return[];const n=r.reduce((o,e)=>o+e,0);return n<=0?[]:r.map(o=>{const e=Math.round(o/n*100*100)/100,a=`${e}`.replace(/\./g,"p");return{value:e,className:a}})}function z(r,n,o=600,e=480){const a=Q(r);if(n==="email"){const t=`@media only screen and (min-width: ${o+20}px)`,s=`@media only screen and (max-width: ${o+20}px)`;return`
${t} {
  .u-row { width: ${o}px !important; }
  .u-row .u-col { vertical-align: top; }
${a.map(({value:d,className:f})=>`  .u-row .u-col-${f} { width: ${Math.round(o*d/100)}px !important; }`).join(`
`)}
}

${s} {
  .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
  .u-row { width: 100% !important; }
  .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
  .u-row .u-col > div { margin: 0 auto; }
  .u-row.no-stack .u-col { min-width: 0 !important; display: table-cell !important; }
${a.map(({value:d,className:f})=>`  .u-row.no-stack .u-col-${f} { width: ${d}% !important; }`).join(`
`)}
}`}const i=`
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
}`,l=a.map(({value:t,className:s})=>`.u-row .u-col.u-col-${s} { flex: 0 0 ${t}%; max-width: ${t}%; }`).join(`
`),y=n==="document"?"":`
@media (max-width: ${e}px) {
  .u_row .container { max-width: 100% !important; }
  .u-row:not(.no-stack) { flex-wrap: wrap; }
  .u-row:not(.no-stack) .u-col {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
}`;return i+`
`+l+`
`+y}function X(r,n=500){return B(r?.contentWidth,n)}function Z(r,n,o,e,a,i="rows"){const y=(L[e]||L.web)(r,n,o,{collection:i,variant:e}),t=X(o),s=z(a,e,t);return s?`<style>${s}</style>${y}`:y}function ee(r,n,o,e,a,i){if(!r)return"";let l="";return g.Children.toArray(r).forEach((t,s)=>{if(!g.isValidElement(t)){(typeof t=="string"||typeof t=="number")&&(l+=String(t));return}const d=t.type;if((d?.displayName==="Column"||d?.name==="Column")&&typeof t.type=="function"){const u=t.type({...t.props,index:s,cells:n,bodyValues:o,rowValues:e,mode:a,_config:i});u?.props?.dangerouslySetInnerHTML?.__html&&(l+=u.props.dangerouslySetInnerHTML.__html)}else if(g.isValidElement(t)){const u=t.type?.displayName||t.type?.name||"Unknown";console.warn(`Row: <${u}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${u} /></Column></Row>`)}}),l}const q=r=>{const{layout:n,cells:o,children:e,mode:a,className:i,style:l,index:y=0,bodyValues:t={},collection:s="rows",_config:d,...f}=r,u=a??d?.mode??"web";let w;if(n)V(n,g.Children.count(e)),w=n.cells;else if(o)w=o;else{const m=g.Children.toArray(e).filter(b=>g.isValidElement(b)&&/^Column$/.test(b.type?.displayName||b.type?.name||"")).length;w=Array(Math.max(1,m)).fill(1)}const C={...J,...t},_=P(f,G,"Row"),p={..._,cells:w,_meta:{htmlID:N(d,"u_row"),htmlClassNames:"u_row",..._._meta||{}}},R=ee(e,w,C,p,u,d);try{const m=Z(R,p,C,u,w,s);return T.jsx("div",{dangerouslySetInnerHTML:{__html:m},className:i,style:l})}catch(m){return console.error("Row rendering failed:",m),T.jsx("div",{className:i,style:l,children:e})}};q.displayName="Row";q.__docgenInfo={description:"",methods:[],displayName:"Row",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},layout:{required:!1,tsType:{name:"ColumnLayout"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},collection:{required:!1,tsType:{name:"string"},description:""},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 48px", "20px 40px") or a number (px).'},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body"}}};const ne="10px",oe=Y;function te(r,n,o,e,a,i,l){return(I[l]||I.web)(r,n,o,e,a,i)}function re(r,n,o,e){return(A[e]||A.web)(r,n,o,{})}const D=r=>{const{children:n,index:o=0,cells:e=[1],bodyValues:a={},rowValues:i={},mode:l,className:y,style:t,_config:s,...d}=r,f=l??s?.mode??"web",u=P(d,oe,"Column"),w={...u,_meta:{htmlID:N(s,"u_column"),htmlClassNames:"u_column",...u._meta||{}}};let C="";if(n)try{g.Children.toArray(n).forEach((p,R)=>{if(typeof p=="string"||typeof p=="number")C+=String(p);else if(g.isValidElement(p)&&typeof p.type=="function"){const m=p.type,b=m[O]||m,v=m?.[$]?.metaName??(m?.displayName||m?.name||"component").toLowerCase(),E=N(s,`u_content_${v}`),h=b({...p.props,_config:s,_metaHtmlId:E,colIndex:o,cells:e,bodyValues:a,rowValues:i,columnValues:w});if(h&&typeof h=="object"&&h.props&&h.props.dangerouslySetInnerHTML){const x=h.props.dangerouslySetInnerHTML.__html;if(!x&&m?.[$]?.omitEmptyOutput)return;const c=p.props,S=c.containerPadding??c.values?.containerPadding??ne,U={containerPadding:typeof S=="number"?`${S}px`:S,_override:{...c.values?._override,mobile:{...c.values?._override?.mobile,...c.hideOnMobile!==void 0?{hideMobile:c.hideOnMobile}:{}},desktop:{...c.values?._override?.desktop,...c.hideOnDesktop!==void 0?{hideDesktop:c.hideOnDesktop}:{}}},_meta:{htmlID:E,htmlClassNames:`u_content_${v}`,...c.values?._meta?.htmlID?{htmlID:c.values._meta.htmlID}:{}}};C+=re(x,U,a,f)}else if(h){const x=p.type?.displayName||p.type?.name||"Unknown";console.warn(`Column: <${x}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`)}}})}catch(_){console.error("Column: Failed to render children:",_),C=""}try{const _=te(C,w,o,e,a,i,f);return T.jsx("div",{dangerouslySetInnerHTML:{__html:_},className:y,style:t})}catch(_){return console.error("Column rendering failed:",_),T.jsx("div",{className:y,style:t,children:n})}};D.displayName="Column";D.__docgenInfo={description:"",methods:[],displayName:"Column",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},index:{required:!1,tsType:{name:"number"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},rowValues:{required:!1,tsType:{name:"any"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 24px", "10px") or a number (px).'},borderRadius:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Corner radius — a number (→ px) or CSS string ("8px").'},border:{required:!1,tsType:{name:"signature",type:"object",raw:`{
  [K in keyof NonNullable<ColumnValues["border"]>]?: K extends \`\${string}Width\`
    ? SizeInput
    : NonNullable<ColumnValues["border"]>[K];
}`,signature:{properties:[{key:{name:"NonNullable",elements:[{name:'ColumnValues["border"]',raw:'ColumnValues["border"]'}],raw:'NonNullable<ColumnValues["border"]>',required:!1},value:{name:"unknown"}}]}},description:"Per-side border object (great for hairline dividers). Width fields accept\n a number/px string; reuse it as a factored-out const without `as const`."},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body/Row"}}};export{W as B,D as C,q as R,K as a,Y as b};
