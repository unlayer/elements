import{j as K}from"./jsx-runtime-g3cn4rHW.js";import{R as w}from"./iframe-DmxZtpKg.js";import{T as ln,V as mn,W as dn,z as D,X as M,g as H,G as un,R as E,w as Q,y as z,b as J,Y as X,d as pn,Z,N as A,Q as q,$ as nn,a0 as F,a1 as fn,f as wn,U as yn,p as hn,e as _n,a2 as gn,s as xn,a3 as B,a4 as Y}from"./create-component-CJ45HcvX.js";const Cn=Object.fromEntries(Object.entries(mn).filter(([n])=>!n.startsWith("popup"))),En={...dn},Nn={...ln},N=Symbol.for("@unlayer/react-elements/tailwind"),Tn={},k=()=>D(Tn,()=>({})),Wn=Symbol.for("@unlayer/react-elements/tailwind-loader"),$n=n=>!!n?.[N];function jn(n,t,e,o){const r=un(),s=M(),c=k();return H(()=>n[N](n,t,e,o,r,s,c))}function Fn(n,t){const e=M(),o=k();H(()=>n[N].prepare?.({scope:n,records:t,compiled:e,render:o}))}function en(n){const t=Array.isArray(n)?n.filter(o=>o!=null&&typeof o!="boolean"):[n],e=t.length===1&&w.isValidElement(t[0])?t[0]:void 0;if(e)return e.type?.[N]?e:typeof e.type=="string"?void 0:en(e.props.children)}function Bn(n,t){const e=n.className?en(n.children):void 0;if(!e)return n;const{children:o,mode:r,config:s,...c}=n,l=D(e.props,()=>new Map),m=M(),a=k();return l.has(n.className)||l.set(n.className,H(()=>e.type[N](e.props,t,void 0,c,void 0,m,a))),{...n,...l.get(n.className),className:void 0}}const vn={},tn=()=>D(vn,()=>new WeakMap);function on(n,t,e,o){try{return o()}catch(r){if(r instanceof E||$n(r))throw r;const s=new E(`${n} failed to render: ${String(r?.message??r)}`,n,Q(t)??e,r);throw t&&tn().set(s,t),s}}const Yn=n=>n instanceof E?tn().get(n):void 0,G=En,Rn=Cn;function bn(n){if(n.length===0)return[];const t=n.reduce((e,o)=>e+o,0);return t<=0?[]:n.map(e=>{const o=Math.round(e/t*100*100)/100,r=`${o}`.replace(/\./g,"p");return{value:o,className:r}})}function In(n,t,e=600,o=480){const r=bn(n);if(t==="email"){const m=`@media only screen and (min-width: ${e+20}px)`,a=`@media only screen and (max-width: ${e+20}px)`;return`
${m} {
  .u-row { width: ${e}px !important; }
  .u-row .u-col { vertical-align: top; }
${r.map(({value:d,className:f})=>`  .u-row .u-col-${f} { width: ${Math.round(e*d/100)}px !important; }`).join(`
`)}
}

${a} {
  .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
  .u-row { width: 100% !important; }
  .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
  .u-row .u-col > div { margin: 0 auto; }
  .u-row.no-stack .u-col { min-width: 0 !important; display: table-cell !important; }
${r.map(({value:d,className:f})=>`  .u-row.no-stack .u-col-${f} { width: ${d}% !important; }`).join(`
`)}
}`}const s=`
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
}`,c=r.map(({value:m,className:a})=>`.u-row .u-col.u-col-${a} { flex: 0 0 ${m}%; max-width: ${m}%; }`).join(`
`),l=t==="document"?"":`
@media (max-width: ${o}px) {
  .u_row .container { max-width: 100% !important; }
  .u-row:not(.no-stack) { flex-wrap: wrap; }
  .u-row:not(.no-stack) .u-col {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
}`;return s+`
`+c+`
`+l}function Ln(n,t=500){return fn(n?.contentWidth,t)}function Sn(n,t,e,o,r,s="rows"){const l=(F[o]||F.web)(n,t,e,{collection:s,variant:o}),m=Ln(e),a=In(r,o,m);return a?`<style>${a}</style>${l}`:l}function An(n,t,e,o,r,s){if(!n)return"";let c="";const l=w.Children.toArray(n);let m=0;return l.forEach(a=>{if(!w.isValidElement(a)){(typeof a=="string"||typeof a=="number")&&(c+=nn(a,"Row"));return}const d=a.type;if((d?.displayName==="Column"||d?.name==="Column")&&typeof a.type=="function"){const p=a.type({...a.props,index:m++,cells:t,bodyValues:e,rowValues:o,mode:r,_config:s});p?.props?.dangerouslySetInnerHTML?.__html&&(c+=p.props.dangerouslySetInnerHTML.__html)}else if(w.isValidElement(a)){const p=a.type?.displayName||a.type?.name||"Unknown";console.warn(`Row: <${p}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${p} /></Column></Row>`)}}),c}function Dn(n){const{layout:t,cells:e,children:o,mode:r,className:s,style:c,index:l=0,bodyValues:m={},collection:a="rows",_config:d,_record:f,...p}=n,g=r??d?.mode??"web",T=w.Children.toArray(o).filter(h=>w.isValidElement(h)&&/^Column$/.test(h.type?.displayName||h.type?.name||"")).length,y=t?.cells??e??Array(Math.max(1,T)).fill(1),$={...Rn,...m},i=J(p,G,"Row");X(f,i.backgroundImage?{...i}:i),pn(i,G.backgroundImage);const u={...i,cells:y,_meta:Z({htmlID:A(d,"u_row"),htmlClassNames:"u_row",...i._meta||{}})},x=An(o,y,$,u,g,d),R=q(Sn(x,u,$,g,y,a),/<div[^>]*class="u-row[ "][^>]*>/,c,s,p);return K.jsx("div",{dangerouslySetInnerHTML:{__html:R}})}const rn=n=>on("Row",n._record,"Row",()=>Dn(n));rn.displayName="Row";rn[z]=!0;const Mn=Nn;function Hn(n,t,e,o,r,s,c){return(Y[c]||Y.web)(n,t,e,o,r,s)}function kn(n,t,e,o){return(B[o]||B.web)(n,t,e,{})}const an=n=>on("Column",n._record,`Column ${(n.index??0)+1}`,()=>On(n));function On(n){const{children:t,index:e=0,cells:o=[1],bodyValues:r={},rowValues:s={},mode:c,className:l,style:m,_config:a,_record:d,...f}=n,p=c??a?.mode??"web",g=J(f,Mn,"Column");X(d,g);const T={...g,_meta:Z({htmlID:A(a,"u_column"),htmlClassNames:"u_column",...g._meta||{}})};let y="";for(const i of w.Children.toArray(t)){if(typeof i=="string"||typeof i=="number"){y+=nn(i,"Column");continue}if(!w.isValidElement(i)||typeof i.type!="function"||wn(i.props._record))continue;const u=i.type,x=u[yn],R=u[hn]||u,h=x?.metaName??(u.displayName||u.name||"component").toLowerCase(),O=A(a,`u_content_${h}`);let b;try{b=R({...i.props,_config:a,_metaHtmlId:O,colIndex:e,cells:o,bodyValues:r,rowValues:s,columnValues:T})}catch(C){const W=a?.__ids;W&&W[`u_content_${h}`]--;const j=i.props._record,S=x?.name??(u.displayName||u.name||"Block");_n(C instanceof E?C:new E(`${S} failed to render: ${String(C?.message??C)}`,S,Q(j)??`Column ${e+1} › ${S}`,C),j);continue}const U=b?.props?.dangerouslySetInnerHTML;if(!U){b&&console.warn(`Column: <${u.displayName||u.name||"Unknown"}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`);continue}const P=U.__html;if(!P&&x?.omitEmptyOutput)continue;const _=i.props,I=_.containerPadding??_.values?.containerPadding??gn,sn=typeof I=="number"?`${I}px`:I,v=x?.contentType==="custom"?{}:_,L=_.values?._override,cn={containerPadding:sn,_override:{...L,mobile:{...L?.mobile,...v.hideOnMobile!==void 0?{hideMobile:v.hideOnMobile}:{}},desktop:{...L?.desktop,...v.hideOnDesktop!==void 0?{hideDesktop:v.hideOnDesktop}:{}}},_meta:{htmlID:O,htmlClassNames:`u_content_${h}`,..._.values?._meta?.htmlID?{htmlID:xn(_.values._meta.htmlID)}:{}}},V=kn(P,cn,r,p);y+=_.skipInText?V.replace(/<[a-z]+/,'$& data-skip-in-text="true"'):V}const $=q(Hn(y,T,e,o,r,s,p),/<div[^>]*class="u-col[ "][^>]*>/,m,l,f);return K.jsx("div",{dangerouslySetInnerHTML:{__html:$}})}an.displayName="Column";an[z]=!0;export{Cn as B,an as C,rn as R,N as T,En as a,Nn as b,Wn as c,Yn as d,jn as e,$n as i,Fn as p,Bn as r};
