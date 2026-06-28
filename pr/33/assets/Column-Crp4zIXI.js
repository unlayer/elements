import{j as b}from"./jsx-runtime-Dr_0w0Oy.js";import{R as _}from"./iframe-trk0x_Cb.js";import{w as I,x as V,v as k,o as D,m as q,j as T,J as $,U as M,q as E,K as v}from"./create-component-D2PtwBvG.js";const B=I,{popupPosition:ie,popupDisplayDelay:pe,popupWidth:le,popupHeight:me,popupBackgroundColor:de,popupBackgroundImage:ue,popupOverlay_backgroundColor:ce,popupCloseButton_position:ye,popupCloseButton_backgroundColor:fe,popupCloseButton_iconColor:we,popupCloseButton_borderRadius:ge,popupCloseButton_margin:Ce,popupCloseButton_action:_e,...H}=B,j=H,F={...V},W={...k},O=F,K=j;function Y(r){if(r.length===0)return[];const t=r.reduce((e,n)=>e+n,0);return t<=0?[]:r.map(e=>{const n=Math.round(e/t*100*100)/100,a=`${n}`.replace(/\./g,"p");return{value:n,className:a}})}function G(r,t,e=600,n=620){const a=Y(r);if(t==="email"){const o=`@media only screen and (min-width: ${e+20}px)`,s=`@media only screen and (max-width: ${e+20}px)`;return`
${o} {
  .u-row { width: ${e}px !important; }
  .u-row .u-col { vertical-align: top; }
${a.map(({value:m,className:c})=>`  .u-row .u-col-${c} { width: ${Math.round(e*m/100)}px !important; }`).join(`
`)}
}

${s} {
  .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
  .u-row { width: 100% !important; }
  .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
  .u-row .u-col > div { margin: 0 auto; }
  .no-stack .u-col { min-width: 0 !important; display: table-cell !important; }
${a.map(({value:m,className:c})=>`  .no-stack .u-col-${c} { width: ${m}% !important; }`).join(`
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
}`,l=a.map(({value:o,className:s})=>`.u-row .u-col.u-col-${s} { flex: 0 0 ${o}%; max-width: ${o}%; }`).join(`
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
${a.map(({value:o,className:s})=>`  .no-stack .u-col-${s} { width: ${o}% !important; }`).join(`
`)}
}`;return p+`
`+l+`
`+u}function J(r,t=500){const e=r?.contentWidth;if(typeof e=="number"&&Number.isFinite(e))return e;if(typeof e=="string"){const n=parseInt(e,10);if(Number.isFinite(n))return n}return t}function Q(r,t,e,n,a,p="rows"){const u=($[n]||$.web)(r,t,e,{collection:p,variant:n}),o=J(e),s=G(a,n,o);return s?`<style>${s}</style>${u}`:u}function z(r,t,e,n,a,p){if(!r)return"";let l="";return _.Children.toArray(r).forEach((o,s)=>{if(!_.isValidElement(o)){(typeof o=="string"||typeof o=="number")&&(l+=String(o));return}const m=o.type;if((m?.displayName==="Column"||m?.name==="Column")&&typeof o.type=="function"){const d=o.type({...o.props,index:s,cells:t,bodyValues:e,rowValues:n,mode:a,_config:p});d?.props?.dangerouslySetInnerHTML?.__html&&(l+=d.props.dangerouslySetInnerHTML.__html)}else if(_.isValidElement(o)){const d=o.type?.displayName||o.type?.name||"Unknown";console.warn(`Row: <${d}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${d} /></Column></Row>`)}}),l}const P=r=>{const{layout:t,cells:e,children:n,mode:a,className:p,style:l,index:u=0,bodyValues:o={},collection:s="rows",_config:m,...c}=r,d=a??m?.mode??"web";let f=e||[1];t&&(D(t,_.Children.count(n)),f=t.cells);const w={...K,...o},y=q(c,O,"Row"),i={...y,cells:f,_meta:{htmlID:T(m,"u_row"),htmlClassNames:"u_row",...y._meta||{}}},R=z(n,f,w,i,d,m);try{const g=Q(R,i,w,d,f,s);return b.jsx("div",{dangerouslySetInnerHTML:{__html:g},className:p,style:l})}catch(g){return console.error("Row rendering failed:",g),b.jsx("div",{className:p,style:l,children:n})}};P.displayName="Row";P.__docgenInfo={description:"",methods:[],displayName:"Row",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},layout:{required:!1,tsType:{name:"ColumnLayout"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},collection:{required:!1,tsType:{name:"string"},description:""},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 48px", "20px 40px") or a number (px).'},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body"}}};const X="10px",Z=W;function ee(r,t,e,n,a,p,l){return(v[l]||v.web)(r,t,e,n,a,p)}function ne(r,t,e,n){return(E[n]||E.web)(r,t,e,{})}const U=r=>{const{children:t,index:e=0,cells:n=[1],bodyValues:a={},rowValues:p={},mode:l,className:u,style:o,_config:s,...m}=r,c=l??s?.mode??"web",d=q(m,Z,"Column"),f={...d,_meta:{htmlID:T(s,"u_column"),htmlClassNames:"u_column",...d._meta||{}}};let w="";if(t)try{_.Children.toArray(t).forEach((i,R)=>{if(typeof i=="string"||typeof i=="number")w+=String(i);else if(_.isValidElement(i)&&typeof i.type=="function"){const g=i.type,C=(g[M]||g)({...i.props,_config:s,colIndex:e,cells:n,bodyValues:a,rowValues:p,columnValues:f});if(C&&typeof C=="object"&&C.props&&C.props.dangerouslySetInnerHTML){const x=C.props.dangerouslySetInnerHTML.__html,S=i.type,N=(S?.displayName||S?.name||"component").toLowerCase(),L=i.props,h=L.containerPadding??L.values?.containerPadding??X,A={containerPadding:typeof h=="number"?`${h}px`:h,_meta:{htmlID:T(s,`u_content_${N}`),htmlClassNames:`u_content_${N}`}};w+=ne(x,A,a,c)}else if(C){const x=i.type?.displayName||i.type?.name||"Unknown";console.warn(`Column: <${x}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`)}}})}catch(y){console.error("Column: Failed to render children:",y),w=""}try{const y=ee(w,f,e,n,a,p,c);return b.jsx("div",{dangerouslySetInnerHTML:{__html:y},className:u,style:o})}catch(y){return console.error("Column rendering failed:",y),b.jsx("div",{className:u,style:o,children:t})}};U.displayName="Column";U.__docgenInfo={description:"",methods:[],displayName:"Column",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},index:{required:!1,tsType:{name:"number"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},rowValues:{required:!1,tsType:{name:"any"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 24px", "10px") or a number (px).'},borderRadius:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Corner radius — a number (→ px) or CSS string ("8px").'},border:{required:!1,tsType:{name:"signature",type:"object",raw:`{
  [K in keyof NonNullable<ColumnValues["border"]>]?: K extends \`\${string}Width\`
    ? SizeInput
    : NonNullable<ColumnValues["border"]>[K];
}`,signature:{properties:[{key:{name:"NonNullable",elements:[{name:'ColumnValues["border"]',raw:'ColumnValues["border"]'}],raw:'NonNullable<ColumnValues["border"]>',required:!1},value:{name:"unknown"}}]}},description:"Per-side border object (great for hairline dividers). Width fields accept\n a number/px string; reuse it as a factored-out const without `as const`."},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body/Row"}}};export{j as B,U as C,P as R};
