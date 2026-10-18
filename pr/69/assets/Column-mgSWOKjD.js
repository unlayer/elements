import{j}from"./jsx-runtime-Dl8pgM6U.js";import{R as w}from"./iframe-B5uyzL71.js";import{S as an,T as sn,V as cn,y as ln,g as B,F as mn,R as E,w as Y,x as G,b as K,W as Q,d as dn,X as z,M as A,N as J,Y as X,Z as P,$ as un,f as pn,U as fn,p as wn,e as yn,a0 as hn,s as _n,a1 as V,a2 as W}from"./create-component-JwlSVGcq.js";const gn=Object.fromEntries(Object.entries(sn).filter(([n])=>!n.startsWith("popup"))),xn={...cn},Cn={...an},v=Symbol.for("@unlayer/react-elements/tailwind"),Un=Symbol.for("@unlayer/react-elements/tailwind-loader"),En=n=>!!n?.[v];function On(n,e,t,o){const r=mn();return B(()=>n[v](n,e,t,o,r))}function Z(n){const e=Array.isArray(n)?n.filter(o=>o!=null&&typeof o!="boolean"):[n],t=e.length===1&&w.isValidElement(e[0])?e[0]:void 0;if(t)return t.type?.[v]?t:typeof t.type=="string"?void 0:Z(t.props.children)}function Pn(n,e){const t=n.className?Z(n.children):void 0;if(!t)return n;const{children:o,mode:r,config:i,...c}=n,l=ln(t.props,()=>new Map);return l.has(n.className)||l.set(n.className,B(()=>t.type[v](t.props,e,void 0,c))),{...n,...l.get(n.className),className:void 0}}const q=new WeakMap;function nn(n,e,t,o){try{return o()}catch(r){if(r instanceof E||En(r))throw r;const i=new E(`${n} failed to render: ${String(r?.message??r)}`,n,Y(e)??t,r);throw e&&q.set(i,e),i}}const Vn=n=>n instanceof E?q.get(n):void 0,F=xn,$n=gn;function Tn(n){if(n.length===0)return[];const e=n.reduce((t,o)=>t+o,0);return e<=0?[]:n.map(t=>{const o=Math.round(t/e*100*100)/100,r=`${o}`.replace(/\./g,"p");return{value:o,className:r}})}function Nn(n,e,t=600,o=480){const r=Tn(n);if(e==="email"){const m=`@media only screen and (min-width: ${t+20}px)`,a=`@media only screen and (max-width: ${t+20}px)`;return`
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
`),l=e==="document"?"":`
@media (max-width: ${o}px) {
  .u_row .container { max-width: 100% !important; }
  .u-row:not(.no-stack) { flex-wrap: wrap; }
  .u-row:not(.no-stack) .u-col {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
}`;return i+`
`+c+`
`+l}function vn(n,e=500){return un(n?.contentWidth,e)}function bn(n,e,t,o,r,i="rows"){const l=(P[o]||P.web)(n,e,t,{collection:i,variant:o}),m=vn(t),a=Nn(r,o,m);return a?`<style>${a}</style>${l}`:l}function In(n,e,t,o,r,i){if(!n)return"";let c="";const l=w.Children.toArray(n);let m=0;return l.forEach(a=>{if(!w.isValidElement(a)){(typeof a=="string"||typeof a=="number")&&(c+=X(a,"Row"));return}const d=a.type;if((d?.displayName==="Column"||d?.name==="Column")&&typeof a.type=="function"){const p=a.type({...a.props,index:m++,cells:e,bodyValues:t,rowValues:o,mode:r,_config:i});p?.props?.dangerouslySetInnerHTML?.__html&&(c+=p.props.dangerouslySetInnerHTML.__html)}else if(w.isValidElement(a)){const p=a.type?.displayName||a.type?.name||"Unknown";console.warn(`Row: <${p}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${p} /></Column></Row>`)}}),c}function Ln(n){const{layout:e,cells:t,children:o,mode:r,className:i,style:c,index:l=0,bodyValues:m={},collection:a="rows",_config:d,_record:f,...p}=n,g=r??d?.mode??"web",$=w.Children.toArray(o).filter(h=>w.isValidElement(h)&&/^Column$/.test(h.type?.displayName||h.type?.name||"")).length,y=e?.cells??t??Array(Math.max(1,$)).fill(1),T={...$n,...m},s=K(p,F,"Row");Q(f,s.backgroundImage?{...s}:s),dn(s,F.backgroundImage);const u={...s,cells:y,_meta:z({htmlID:A(d,"u_row"),htmlClassNames:"u_row",...s._meta||{}})},x=In(o,y,T,u,g,d),b=J(bn(x,u,T,g,y,a),/<div[^>]*class="u-row[ "][^>]*>/,c,i,p);return j.jsx("div",{dangerouslySetInnerHTML:{__html:b}})}const tn=n=>nn("Row",n._record,"Row",()=>Ln(n));tn.displayName="Row";tn[G]=!0;const Rn=Cn;function Sn(n,e,t,o,r,i,c){return(W[c]||W.web)(n,e,t,o,r,i)}function An(n,e,t,o){return(V[o]||V.web)(n,e,t,{})}const en=n=>nn("Column",n._record,`Column ${(n.index??0)+1}`,()=>Dn(n));function Dn(n){const{children:e,index:t=0,cells:o=[1],bodyValues:r={},rowValues:i={},mode:c,className:l,style:m,_config:a,_record:d,...f}=n,p=c??a?.mode??"web",g=K(f,Rn,"Column");Q(d,g);const $={...g,_meta:z({htmlID:A(a,"u_column"),htmlClassNames:"u_column",...g._meta||{}})};let y="";for(const s of w.Children.toArray(e)){if(typeof s=="string"||typeof s=="number"){y+=X(s,"Column");continue}if(!w.isValidElement(s)||typeof s.type!="function"||pn(s.props._record))continue;const u=s.type,x=u[fn],b=u[wn]||u,h=x?.metaName??(u.displayName||u.name||"component").toLowerCase(),D=A(a,`u_content_${h}`);let I;try{I=b({...s.props,_config:a,_metaHtmlId:D,colIndex:t,cells:o,bodyValues:r,rowValues:i,columnValues:$})}catch(C){const U=a?.__ids;U&&U[`u_content_${h}`]--;const O=s.props._record,S=x?.name??(u.displayName||u.name||"Block");yn(C instanceof E?C:new E(`${S} failed to render: ${String(C?.message??C)}`,S,Y(O)??`Column ${t+1} › ${S}`,C),O);continue}const M=I?.props?.dangerouslySetInnerHTML;if(!M){I&&console.warn(`Column: <${u.displayName||u.name||"Unknown"}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`);continue}const H=M.__html;if(!H&&x?.omitEmptyOutput)continue;const _=s.props,L=_.containerPadding??_.values?.containerPadding??hn,on=typeof L=="number"?`${L}px`:L,N=x?.contentType==="custom"?{}:_,R=_.values?._override,rn={containerPadding:on,_override:{...R,mobile:{...R?.mobile,...N.hideOnMobile!==void 0?{hideMobile:N.hideOnMobile}:{}},desktop:{...R?.desktop,...N.hideOnDesktop!==void 0?{hideDesktop:N.hideOnDesktop}:{}}},_meta:{htmlID:D,htmlClassNames:`u_content_${h}`,..._.values?._meta?.htmlID?{htmlID:_n(_.values._meta.htmlID)}:{}}},k=An(H,rn,r,p);y+=_.skipInText?k.replace(/<[a-z]+/,'$& data-skip-in-text="true"'):k}const T=J(Sn(y,$,t,o,r,i,p),/<div[^>]*class="u-col[ "][^>]*>/,m,l,f);return j.jsx("div",{dangerouslySetInnerHTML:{__html:T}})}en.displayName="Column";en[G]=!0;export{gn as B,en as C,tn as R,v as T,xn as a,Cn as b,Un as c,Vn as d,On as e,En as i,Pn as r};
