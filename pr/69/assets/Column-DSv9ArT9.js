import{j as F}from"./jsx-runtime-zKttModj.js";import{R as w}from"./iframe-9hsHLM1G.js";import{L as rn,T as an,S as sn,v as cn,R as E,w as B,q as Y,b as G,M as K,d as ln,N as Q,G as A,J,Q as q,V as P,W as mn,f as dn,U as un,l as pn,e as fn,X as wn,s as yn,Y as V,Z as W}from"./create-component-DfsKJKLS.js";const hn=Object.fromEntries(Object.entries(an).filter(([n])=>!n.startsWith("popup"))),_n={...sn},xn={...rn},v=Symbol.for("@unlayer/react-elements/tailwind"),Hn=Symbol.for("@unlayer/react-elements/tailwind-loader"),gn=n=>!!n?.[v],kn=(n,t,e,o)=>n[v](n,t,e,o);function z(n){const t=Array.isArray(n)?n.filter(o=>o!=null&&typeof o!="boolean"):[n],e=t.length===1&&w.isValidElement(t[0])?t[0]:void 0;if(e)return e.type?.[v]?e:typeof e.type=="string"?void 0:z(e.props.children)}function Un(n,t){const e=n.className?z(n.children):void 0;if(!e)return n;const{children:o,mode:r,config:i,...c}=n,l=cn(e.props,()=>new Map);return l.has(n.className)||l.set(n.className,e.type[v](e.props,t,void 0,c)),{...n,...l.get(n.className),className:void 0}}const X=new WeakMap;function Z(n,t,e,o){try{return o()}catch(r){if(r instanceof E||gn(r))throw r;const i=new E(`${n} failed to render: ${String(r?.message??r)}`,n,B(t)??e,r);throw t&&X.set(i,t),i}}const On=n=>n instanceof E?X.get(n):void 0,j=_n,Cn=hn;function En(n){if(n.length===0)return[];const t=n.reduce((e,o)=>e+o,0);return t<=0?[]:n.map(e=>{const o=Math.round(e/t*100*100)/100,r=`${o}`.replace(/\./g,"p");return{value:o,className:r}})}function $n(n,t,e=600,o=480){const r=En(n);if(t==="email"){const m=`@media only screen and (min-width: ${e+20}px)`,a=`@media only screen and (max-width: ${e+20}px)`;return`
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
}`,c=r.map(({value:m,className:a})=>`.u-row .u-col.u-col-${a} { flex: 0 0 ${m}%; max-width: ${m}%; }`).join(`
`),l=t==="document"?"":`
@media (max-width: ${o}px) {
  .u_row .container { max-width: 100% !important; }
  .u-row:not(.no-stack) { flex-wrap: wrap; }
  .u-row:not(.no-stack) .u-col {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
}`;return i+`
`+c+`
`+l}function Nn(n,t=500){return mn(n?.contentWidth,t)}function Tn(n,t,e,o,r,i="rows"){const l=(P[o]||P.web)(n,t,e,{collection:i,variant:o}),m=Nn(e),a=$n(r,o,m);return a?`<style>${a}</style>${l}`:l}function vn(n,t,e,o,r,i){if(!n)return"";let c="";const l=w.Children.toArray(n);let m=0;return l.forEach(a=>{if(!w.isValidElement(a)){(typeof a=="string"||typeof a=="number")&&(c+=q(a,"Row"));return}const d=a.type;if((d?.displayName==="Column"||d?.name==="Column")&&typeof a.type=="function"){const p=a.type({...a.props,index:m++,cells:t,bodyValues:e,rowValues:o,mode:r,_config:i});p?.props?.dangerouslySetInnerHTML?.__html&&(c+=p.props.dangerouslySetInnerHTML.__html)}else if(w.isValidElement(a)){const p=a.type?.displayName||a.type?.name||"Unknown";console.warn(`Row: <${p}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${p} /></Column></Row>`)}}),c}function bn(n){const{layout:t,cells:e,children:o,mode:r,className:i,style:c,index:l=0,bodyValues:m={},collection:a="rows",_config:d,_record:f,...p}=n,x=r??d?.mode??"web",$=w.Children.toArray(o).filter(h=>w.isValidElement(h)&&/^Column$/.test(h.type?.displayName||h.type?.name||"")).length,y=t?.cells??e??Array(Math.max(1,$)).fill(1),N={...Cn,...m},s=G(p,j,"Row");K(f,s.backgroundImage?{...s}:s),ln(s,j.backgroundImage);const u={...s,cells:y,_meta:Q({htmlID:A(d,"u_row"),htmlClassNames:"u_row",...s._meta||{}})},g=vn(o,y,N,u,x,d),b=J(Tn(g,u,N,x,y,a),/<div[^>]*class="u-row[ "][^>]*>/,c,i,p);return F.jsx("div",{dangerouslySetInnerHTML:{__html:b}})}const nn=n=>Z("Row",n._record,"Row",()=>bn(n));nn.displayName="Row";nn[Y]=!0;const In=xn;function Ln(n,t,e,o,r,i,c){return(W[c]||W.web)(n,t,e,o,r,i)}function Rn(n,t,e,o){return(V[o]||V.web)(n,t,e,{})}const en=n=>Z("Column",n._record,`Column ${(n.index??0)+1}`,()=>Sn(n));function Sn(n){const{children:t,index:e=0,cells:o=[1],bodyValues:r={},rowValues:i={},mode:c,className:l,style:m,_config:a,_record:d,...f}=n,p=c??a?.mode??"web",x=G(f,In,"Column");K(d,x);const $={...x,_meta:Q({htmlID:A(a,"u_column"),htmlClassNames:"u_column",...x._meta||{}})};let y="";for(const s of w.Children.toArray(t)){if(typeof s=="string"||typeof s=="number"){y+=q(s,"Column");continue}if(!w.isValidElement(s)||typeof s.type!="function"||dn(s.props._record))continue;const u=s.type,g=u[un],b=u[pn]||u,h=g?.metaName??(u.displayName||u.name||"component").toLowerCase(),D=A(a,`u_content_${h}`);let I;try{I=b({...s.props,_config:a,_metaHtmlId:D,colIndex:e,cells:o,bodyValues:r,rowValues:i,columnValues:$})}catch(C){const U=a?.__ids;U&&U[`u_content_${h}`]--;const O=s.props._record,S=g?.name??(u.displayName||u.name||"Block");fn(C instanceof E?C:new E(`${S} failed to render: ${String(C?.message??C)}`,S,B(O)??`Column ${e+1} › ${S}`,C),O);continue}const M=I?.props?.dangerouslySetInnerHTML;if(!M){I&&console.warn(`Column: <${u.displayName||u.name||"Unknown"}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`);continue}const H=M.__html;if(!H&&g?.omitEmptyOutput)continue;const _=s.props,L=_.containerPadding??_.values?.containerPadding??wn,tn=typeof L=="number"?`${L}px`:L,T=g?.contentType==="custom"?{}:_,R=_.values?._override,on={containerPadding:tn,_override:{...R,mobile:{...R?.mobile,...T.hideOnMobile!==void 0?{hideMobile:T.hideOnMobile}:{}},desktop:{...R?.desktop,...T.hideOnDesktop!==void 0?{hideDesktop:T.hideOnDesktop}:{}}},_meta:{htmlID:D,htmlClassNames:`u_content_${h}`,..._.values?._meta?.htmlID?{htmlID:yn(_.values._meta.htmlID)}:{}}},k=Rn(H,on,r,p);y+=_.skipInText?k.replace(/<[a-z]+/,'$& data-skip-in-text="true"'):k}const N=J(Ln(y,$,e,o,r,i,p),/<div[^>]*class="u-col[ "][^>]*>/,m,l,f);return F.jsx("div",{dangerouslySetInnerHTML:{__html:N}})}en.displayName="Column";en[Y]=!0;export{hn as B,en as C,nn as R,v as T,_n as a,xn as b,Hn as c,On as d,kn as e,gn as i,Un as r};
