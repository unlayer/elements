import{j as h}from"./jsx-runtime-CG3iJa7w.js";import{R as C}from"./iframe-BDBWa6zR.js";import{w as P,x as q,v as D,i as M,m as N,J as b,U as B,l as L,K as E}from"./create-component-BATyVUxj.js";const H=P,{popupPosition:re,popupDisplayDelay:ae,popupWidth:se,popupHeight:ie,popupBackgroundColor:pe,popupBackgroundImage:le,popupOverlay_backgroundColor:ce,popupCloseButton_position:me,popupCloseButton_backgroundColor:de,popupCloseButton_iconColor:ue,popupCloseButton_borderRadius:ye,popupCloseButton_margin:fe,popupCloseButton_action:we,...I}=H,V=I,k={...q},j={...D},F=k,O=V;function Y(r){if(r.length===0)return[];const t=r.reduce((o,n)=>o+n,0);return t<=0?[]:r.map(o=>{const n=Math.round(o/t*100*100)/100,a=`${n}`.replace(/\./g,"p");return{value:n,className:a}})}function K(r,t,o=600,n=620){const a=Y(r);if(t==="email"){const e=`@media only screen and (min-width: ${o+20}px)`,l=`@media only screen and (max-width: ${o+20}px)`;return`
${e} {
  .u-row { width: ${o}px !important; }
  .u-row .u-col { vertical-align: top; }
${a.map(({value:m,className:u})=>`  .u-row .u-col-${u} { width: ${Math.round(o*m/100)}px !important; }`).join(`
`)}
}

${l} {
  .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
  .u-row { width: 100% !important; }
  .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
  .u-row .u-col > div { margin: 0 auto; }
  .no-stack .u-col { min-width: 0 !important; display: table-cell !important; }
${a.map(({value:m,className:u})=>`  .no-stack .u-col-${u} { width: ${m}% !important; }`).join(`
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
}`,i=a.map(({value:e,className:l})=>`.u-row .u-col.u-col-${l} { flex: 0 0 ${e}%; max-width: ${e}%; }`).join(`
`),c=`
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
${a.map(({value:e,className:l})=>`  .no-stack .u-col-${l} { width: ${e}% !important; }`).join(`
`)}
}`;return p+`
`+i+`
`+c}function W(r,t,o,n,a,p="rows"){const c=(b[n]||b.web)(r,t,o,{collection:p,variant:n}),e=K(a,n);return e?`<style>${e}</style>${c}`:c}function G(r,t,o,n,a,p){if(!r)return"";let i="";return C.Children.toArray(r).forEach((e,l)=>{if(!C.isValidElement(e)){(typeof e=="string"||typeof e=="number")&&(i+=String(e));return}const m=e.type;if((m?.displayName==="Column"||m?.name==="Column")&&typeof e.type=="function"){const d=e.type({...e.props,index:l,cells:t,bodyValues:o,rowValues:n,mode:a,_config:p});d?.props?.dangerouslySetInnerHTML?.__html&&(i+=d.props.dangerouslySetInnerHTML.__html)}else if(C.isValidElement(e)){const d=e.type?.displayName||e.type?.name||"Unknown";console.warn(`Row: <${d}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${d} /></Column></Row>`)}}),i}const v=r=>{const{layout:t,cells:o,children:n,mode:a,className:p,style:i,index:c=0,bodyValues:e={},collection:l="rows",_config:m,...u}=r,d=a??m?.mode??"web";let w=o||[1];t&&(M(t,C.Children.count(n)),w=t.cells);const f={...O,...e},y=N(u,F,"Row"),s={...y,cells:w,_meta:{htmlID:`u_row_${c+1}`,htmlClassNames:"u_row",...y._meta||{}}},T=G(n,w,f,s,d,m);try{const _=W(T,s,f,d,w,l);return h.jsx("div",{dangerouslySetInnerHTML:{__html:_},className:p,style:i})}catch(_){return console.error("Row rendering failed:",_),h.jsx("div",{className:p,style:i,children:n})}};v.displayName="Row";v.__docgenInfo={description:"",methods:[],displayName:"Row",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},layout:{required:!1,tsType:{name:"ColumnLayout"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},collection:{required:!1,tsType:{name:"string"},description:""},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body"}},composes:["SemanticProps"]};const J="10px",Q=j;function z(r,t,o,n,a,p,i){return(E[i]||E.web)(r,t,o,n,a,p)}function X(r,t,o,n){return(L[n]||L.web)(r,t,o,{})}const U=r=>{const{children:t,index:o=0,cells:n=[1],bodyValues:a={},rowValues:p={},mode:i,className:c,style:e,_config:l,...m}=r,u=i??l?.mode??"web",d=N(m,Q,"Column"),w={...d,_meta:{htmlID:`u_column_${o+1}`,htmlClassNames:"u_column",...d._meta||{}}};let f="";if(t)try{C.Children.toArray(t).forEach((s,T)=>{if(typeof s=="string"||typeof s=="number")f+=String(s);else if(C.isValidElement(s)&&typeof s.type=="function"){const _=s.type,g=(_[B]||_)({...s.props,_config:l});if(g&&typeof g=="object"&&g.props&&g.props.dangerouslySetInnerHTML){const x=g.props.dangerouslySetInnerHTML.__html,R=s.type,S=(R?.displayName||R?.name||"component").toLowerCase(),$=s.props,A={containerPadding:$.containerPadding??$.values?.containerPadding??J,_meta:{htmlID:`u_content_${S}_${T+1}`,htmlClassNames:`u_content_${S}`}};f+=X(x,A,a,u)}else if(g){const x=s.type?.displayName||s.type?.name||"Unknown";console.warn(`Column: <${x}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`)}}})}catch(y){console.error("Column: Failed to render children:",y),f=""}try{const y=z(f,w,o,n,a,p,u);return h.jsx("div",{dangerouslySetInnerHTML:{__html:y},className:c,style:e})}catch(y){return console.error("Column rendering failed:",y),h.jsx("div",{className:c,style:e,children:t})}};U.displayName="Column";U.__docgenInfo={description:"",methods:[],displayName:"Column",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},index:{required:!1,tsType:{name:"number"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},rowValues:{required:!1,tsType:{name:"any"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body/Row"}},composes:["SemanticProps"]};export{V as B,U as C,v as R};
