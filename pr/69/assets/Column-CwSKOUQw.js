import{j as F}from"./jsx-runtime-CyHbbZ_K.js";import{R as w}from"./iframe-BPzZTbNv.js";import{T as cn,V as ln,W as mn,z as B,X as Y,g as G,G as dn,R as E,w as K,y as Q,b as z,Y as J,d as un,Z as X,N as A,Q as Z,$ as q,a0 as P,a1 as pn,f as fn,U as wn,p as yn,e as hn,a2 as _n,s as gn,a3 as V,a4 as W}from"./create-component-Bxg_40X-.js";const xn=Object.fromEntries(Object.entries(ln).filter(([n])=>!n.startsWith("popup"))),Cn={...mn},En={...cn},v=Symbol.for("@unlayer/react-elements/tailwind"),Pn=Symbol.for("@unlayer/react-elements/tailwind-loader"),Tn=n=>!!n?.[v];function Vn(n,e,t,o){const r=dn(),s=Y();return G(()=>n[v](n,e,t,o,r,s))}function nn(n){const e=Array.isArray(n)?n.filter(o=>o!=null&&typeof o!="boolean"):[n],t=e.length===1&&w.isValidElement(e[0])?e[0]:void 0;if(t)return t.type?.[v]?t:typeof t.type=="string"?void 0:nn(t.props.children)}function Wn(n,e){const t=n.className?nn(n.children):void 0;if(!t)return n;const{children:o,mode:r,config:s,...c}=n,l=B(t.props,()=>new Map),m=Y();return l.has(n.className)||l.set(n.className,G(()=>t.type[v](t.props,e,void 0,c,void 0,m))),{...n,...l.get(n.className),className:void 0}}const $n={},tn=()=>B($n,()=>new WeakMap);function en(n,e,t,o){try{return o()}catch(r){if(r instanceof E||Tn(r))throw r;const s=new E(`${n} failed to render: ${String(r?.message??r)}`,n,K(e)??t,r);throw e&&tn().set(s,e),s}}const jn=n=>n instanceof E?tn().get(n):void 0,j=Cn,Nn=xn;function vn(n){if(n.length===0)return[];const e=n.reduce((t,o)=>t+o,0);return e<=0?[]:n.map(t=>{const o=Math.round(t/e*100*100)/100,r=`${o}`.replace(/\./g,"p");return{value:o,className:r}})}function bn(n,e,t=600,o=480){const r=vn(n);if(e==="email"){const m=`@media only screen and (min-width: ${t+20}px)`,a=`@media only screen and (max-width: ${t+20}px)`;return`
${m} {
  .u-row { width: ${t}px !important; }
  .u-row .u-col { vertical-align: top; }
${r.map(({value:d,className:f})=>`  .u-row .u-col-${f} { width: ${Math.round(t*d/100)}px !important; }`).join(`
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
`),l=e==="document"?"":`
@media (max-width: ${o}px) {
  .u_row .container { max-width: 100% !important; }
  .u-row:not(.no-stack) { flex-wrap: wrap; }
  .u-row:not(.no-stack) .u-col {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
}`;return s+`
`+c+`
`+l}function In(n,e=500){return pn(n?.contentWidth,e)}function Rn(n,e,t,o,r,s="rows"){const l=(P[o]||P.web)(n,e,t,{collection:s,variant:o}),m=In(t),a=bn(r,o,m);return a?`<style>${a}</style>${l}`:l}function Ln(n,e,t,o,r,s){if(!n)return"";let c="";const l=w.Children.toArray(n);let m=0;return l.forEach(a=>{if(!w.isValidElement(a)){(typeof a=="string"||typeof a=="number")&&(c+=q(a,"Row"));return}const d=a.type;if((d?.displayName==="Column"||d?.name==="Column")&&typeof a.type=="function"){const p=a.type({...a.props,index:m++,cells:e,bodyValues:t,rowValues:o,mode:r,_config:s});p?.props?.dangerouslySetInnerHTML?.__html&&(c+=p.props.dangerouslySetInnerHTML.__html)}else if(w.isValidElement(a)){const p=a.type?.displayName||a.type?.name||"Unknown";console.warn(`Row: <${p}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${p} /></Column></Row>`)}}),c}function Sn(n){const{layout:e,cells:t,children:o,mode:r,className:s,style:c,index:l=0,bodyValues:m={},collection:a="rows",_config:d,_record:f,...p}=n,g=r??d?.mode??"web",T=w.Children.toArray(o).filter(h=>w.isValidElement(h)&&/^Column$/.test(h.type?.displayName||h.type?.name||"")).length,y=e?.cells??t??Array(Math.max(1,T)).fill(1),$={...Nn,...m},i=z(p,j,"Row");J(f,i.backgroundImage?{...i}:i),un(i,j.backgroundImage);const u={...i,cells:y,_meta:X({htmlID:A(d,"u_row"),htmlClassNames:"u_row",...i._meta||{}})},x=Ln(o,y,$,u,g,d),b=Z(Rn(x,u,$,g,y,a),/<div[^>]*class="u-row[ "][^>]*>/,c,s,p);return F.jsx("div",{dangerouslySetInnerHTML:{__html:b}})}const on=n=>en("Row",n._record,"Row",()=>Sn(n));on.displayName="Row";on[Q]=!0;const An=En;function Dn(n,e,t,o,r,s,c){return(W[c]||W.web)(n,e,t,o,r,s)}function Mn(n,e,t,o){return(V[o]||V.web)(n,e,t,{})}const rn=n=>en("Column",n._record,`Column ${(n.index??0)+1}`,()=>Hn(n));function Hn(n){const{children:e,index:t=0,cells:o=[1],bodyValues:r={},rowValues:s={},mode:c,className:l,style:m,_config:a,_record:d,...f}=n,p=c??a?.mode??"web",g=z(f,An,"Column");J(d,g);const T={...g,_meta:X({htmlID:A(a,"u_column"),htmlClassNames:"u_column",...g._meta||{}})};let y="";for(const i of w.Children.toArray(e)){if(typeof i=="string"||typeof i=="number"){y+=q(i,"Column");continue}if(!w.isValidElement(i)||typeof i.type!="function"||fn(i.props._record))continue;const u=i.type,x=u[wn],b=u[yn]||u,h=x?.metaName??(u.displayName||u.name||"component").toLowerCase(),D=A(a,`u_content_${h}`);let I;try{I=b({...i.props,_config:a,_metaHtmlId:D,colIndex:t,cells:o,bodyValues:r,rowValues:s,columnValues:T})}catch(C){const O=a?.__ids;O&&O[`u_content_${h}`]--;const U=i.props._record,S=x?.name??(u.displayName||u.name||"Block");hn(C instanceof E?C:new E(`${S} failed to render: ${String(C?.message??C)}`,S,K(U)??`Column ${t+1} › ${S}`,C),U);continue}const M=I?.props?.dangerouslySetInnerHTML;if(!M){I&&console.warn(`Column: <${u.displayName||u.name||"Unknown"}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`);continue}const H=M.__html;if(!H&&x?.omitEmptyOutput)continue;const _=i.props,R=_.containerPadding??_.values?.containerPadding??_n,an=typeof R=="number"?`${R}px`:R,N=x?.contentType==="custom"?{}:_,L=_.values?._override,sn={containerPadding:an,_override:{...L,mobile:{...L?.mobile,...N.hideOnMobile!==void 0?{hideMobile:N.hideOnMobile}:{}},desktop:{...L?.desktop,...N.hideOnDesktop!==void 0?{hideDesktop:N.hideOnDesktop}:{}}},_meta:{htmlID:D,htmlClassNames:`u_content_${h}`,..._.values?._meta?.htmlID?{htmlID:gn(_.values._meta.htmlID)}:{}}},k=Mn(H,sn,r,p);y+=_.skipInText?k.replace(/<[a-z]+/,'$& data-skip-in-text="true"'):k}const $=Z(Dn(y,T,t,o,r,s,p),/<div[^>]*class="u-col[ "][^>]*>/,m,l,f);return F.jsx("div",{dangerouslySetInnerHTML:{__html:$}})}rn.displayName="Column";rn[Q]=!0;export{xn as B,rn as C,on as R,v as T,Cn as a,En as b,Pn as c,jn as d,Vn as e,Tn as i,Wn as r};
