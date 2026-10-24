import{j as G}from"./jsx-runtime-OIZ2ic1F.js";import{R as w}from"./iframe-Bxwmsr0x.js";import{V as ln,W as mn,X as dn,z as D,Y as M,g as H,J as un,R as E,w as Q,y as z,b as J,Z as X,d as pn,$ as Z,Q as A,a0 as fn,S as q,a1 as nn,a2 as F,a3 as wn,f as yn,U as hn,p as _n,e as gn,a4 as xn,s as Cn,a5 as B,a6 as Y}from"./create-component-CWt0EgOT.js";const En=Object.fromEntries(Object.entries(mn).filter(([n])=>!n.startsWith("popup"))),Tn={...dn},$n={...ln},T=Symbol.for("@unlayer/react-elements/tailwind"),Nn={},k=()=>D(Nn,()=>({})),jn=Symbol.for("@unlayer/react-elements/tailwind-loader"),vn=n=>!!n?.[T];function Fn(n,t,e,o){const r=un(),i=M(),c=k();return H(()=>n[T](n,t,e,o,r,i,c))}function Bn(n,t){const e=M(),o=k();H(()=>n[T].prepare?.({scope:n,records:t,compiled:e,render:o}))}function en(n){const t=Array.isArray(n)?n.filter(o=>o!=null&&typeof o!="boolean"):[n],e=t.length===1&&w.isValidElement(t[0])?t[0]:void 0;if(e)return e.type?.[T]?e:typeof e.type=="string"?void 0:en(e.props.children)}function Yn(n,t){const e=n.className?en(n.children):void 0;if(!e)return n;const{children:o,mode:r,config:i,...c}=n,l=D(e.props,()=>new Map),m=M(),a=k();return l.has(n.className)||l.set(n.className,H(()=>e.type[T](e.props,t,void 0,c,void 0,m,a))),{...n,...l.get(n.className),className:void 0}}const Rn={},tn=()=>D(Rn,()=>new WeakMap);function on(n,t,e,o){try{return o()}catch(r){if(r instanceof E||vn(r))throw r;const i=new E(`${n} failed to render: ${String(r?.message??r)}`,n,Q(t)??e,r);throw t&&tn().set(i,t),i}}const Kn=n=>n instanceof E?tn().get(n):void 0,K=Tn,bn=En;function In(n){if(n.length===0)return[];const t=n.reduce((e,o)=>e+o,0);return t<=0?[]:n.map(e=>{const o=Math.round(e/t*100*100)/100,r=`${o}`.replace(/\./g,"p");return{value:o,className:r}})}function Sn(n,t,e=600,o=480){const r=In(n);if(t==="email"){const m=`@media only screen and (min-width: ${e+20}px)`,a=`@media only screen and (max-width: ${e+20}px)`;return`
${m} {
  .u-row { width: ${e}px !important; }
  .u-row .u-col { vertical-align: top; }
${r.map(({value:u,className:f})=>`  .u-row .u-col-${f} { width: ${Math.round(e*u/100)}px !important; }`).join(`
`)}
}

${a} {
  .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
  .u-row { width: 100% !important; }
  .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
  .u-row .u-col > div { margin: 0 auto; }
  .u-row.no-stack .u-col { min-width: 0 !important; display: table-cell !important; }
${r.map(({value:u,className:f})=>`  .u-row.no-stack .u-col-${f} { width: ${u}% !important; }`).join(`
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
`+l}function Ln(n,t=500){return wn(n?.contentWidth,t)}function An(n,t,e,o,r,i="rows"){const l=(F[o]||F.web)(n,t,e,{collection:i,variant:o}),m=Ln(e),a=Sn(r,o,m);return a?`<style>${a}</style>${l}`:l}function Dn(n,t,e,o,r,i){if(!n)return"";let c="";const l=w.Children.toArray(n);let m=0;return l.forEach(a=>{if(!w.isValidElement(a)){(typeof a=="string"||typeof a=="number")&&(c+=nn(a,"Row"));return}const u=a.type;if((u?.displayName==="Column"||u?.name==="Column")&&typeof a.type=="function"){const p=a.type({...a.props,index:m++,cells:t,bodyValues:e,rowValues:o,mode:r,_config:i});p?.props?.dangerouslySetInnerHTML?.__html&&(c+=p.props.dangerouslySetInnerHTML.__html)}else if(w.isValidElement(a)){const p=a.type?.displayName||a.type?.name||"Unknown";console.warn(`Row: <${p}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${p} /></Column></Row>`)}}),c}function Mn(n){const{layout:t,cells:e,children:o,mode:r,className:i,style:c,index:l=0,bodyValues:m={},collection:a="rows",_config:u,_record:f,...p}=n,g=r??u?.mode??"web",$=w.Children.toArray(o).filter(h=>w.isValidElement(h)&&/^Column$/.test(h.type?.displayName||h.type?.name||"")).length,y=t?.cells??e??Array(Math.max(1,$)).fill(1),N={...bn,...m},s=J(p,K,"Row");X(f,s.backgroundImage?{...s}:s),pn(s,K.backgroundImage);const d={...s,cells:y,_meta:Z({htmlID:A(u,"u_row"),htmlClassNames:"u_row",...s._meta||{}})};s.anchor&&(d.anchor=fn(String(s.anchor),!0));const x=Dn(o,y,N,d,g,u),R=q(An(x,d,N,g,y,a),/<div[^>]*class="u-row[ "][^>]*>/,c,i,p);return G.jsx("div",{dangerouslySetInnerHTML:{__html:R}})}const rn=n=>on("Row",n._record,"Row",()=>Mn(n));rn.displayName="Row";rn[z]=!0;const Hn=$n;function kn(n,t,e,o,r,i,c){return(Y[c]||Y.web)(n,t,e,o,r,i)}function On(n,t,e,o){return(B[o]||B.web)(n,t,e,{})}const an=n=>on("Column",n._record,`Column ${(n.index??0)+1}`,()=>Un(n));function Un(n){const{children:t,index:e=0,cells:o=[1],bodyValues:r={},rowValues:i={},mode:c,className:l,style:m,_config:a,_record:u,...f}=n,p=c??a?.mode??"web",g=J(f,Hn,"Column");X(u,g);const $={...g,_meta:Z({htmlID:A(a,"u_column"),htmlClassNames:"u_column",...g._meta||{}})};let y="";for(const s of w.Children.toArray(t)){if(typeof s=="string"||typeof s=="number"){y+=nn(s,"Column");continue}if(!w.isValidElement(s)||typeof s.type!="function"||yn(s.props._record))continue;const d=s.type,x=d[hn],R=d[_n]||d,h=x?.metaName??(d.displayName||d.name||"component").toLowerCase(),O=A(a,`u_content_${h}`);let b;try{b=R({...s.props,_config:a,_metaHtmlId:O,colIndex:e,cells:o,bodyValues:r,rowValues:i,columnValues:$})}catch(C){const W=a?.__ids;W&&W[`u_content_${h}`]--;const j=s.props._record,L=x?.name??(d.displayName||d.name||"Block");gn(C instanceof E?C:new E(`${L} failed to render: ${String(C?.message??C)}`,L,Q(j)??`Column ${e+1} › ${L}`,C),j);continue}const U=b?.props?.dangerouslySetInnerHTML;if(!U){b&&console.warn(`Column: <${d.displayName||d.name||"Unknown"}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`);continue}const P=U.__html;if(!P&&x?.omitEmptyOutput)continue;const _=s.props,I=_.containerPadding??_.values?.containerPadding??xn,sn=typeof I=="number"?`${I}px`:I,v=x?.contentType==="custom"?{}:_,S=_.values?._override,cn={containerPadding:sn,_override:{...S,mobile:{...S?.mobile,...v.hideOnMobile!==void 0?{hideMobile:v.hideOnMobile}:{}},desktop:{...S?.desktop,...v.hideOnDesktop!==void 0?{hideDesktop:v.hideOnDesktop}:{}}},_meta:{htmlID:O,htmlClassNames:`u_content_${h}`,..._.values?._meta?.htmlID?{htmlID:Cn(_.values._meta.htmlID)}:{}}},V=On(P,cn,r,p);y+=_.skipInText?V.replace(/<[a-z]+/,'$& data-skip-in-text="true"'):V}const N=q(kn(y,$,e,o,r,i,p),/<div[^>]*class="u-col[ "][^>]*>/,m,l,f);return G.jsx("div",{dangerouslySetInnerHTML:{__html:N}})}an.displayName="Column";an[z]=!0;export{En as B,an as C,rn as R,T,Tn as a,$n as b,jn as c,Kn as d,Fn as e,vn as i,Bn as p,Yn as r};
