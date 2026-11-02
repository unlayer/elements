import{R as H}from"./iframe-e9LJfmF5.js";import{B as K,_ as G,m as B,F as L,$ as O,a0 as S,x as X,a1 as V,a2 as Z,D as J,I as Q}from"./create-component-lU3NCx5w.js";import{B as A,a as N,b as R,w as k}from"./Column-De1VZ5JL.js";import{n as tt,K as nt}from"./normalize-CwLEk19p.js";const et={Button:["size","fontSize","lineHeight","textAlign","padding"],Image:["src","textAlign"],Heading:["fontSize","textAlign","lineHeight"],Paragraph:["fontSize","textAlign","lineHeight"],Menu:["fontSize","padding"],Divider:["width","textAlign"]};function T(t){const n=String(t).trim();return n&&!/[!\\"'\n\r]/.test(n)&&G(n)?n:void 0}function ot(t){return t.replace(/^-?\d|^-$|[^\w\u0080-\uffff-]/g,n=>/\d/.test(n.slice(-1))?`${n.slice(0,-1)}\\${n.slice(-1).charCodeAt(0).toString(16)} `:`\\${n}`)}function b(t){const n=parseFloat(String(t));if(!Number.isFinite(n))return;const e=parseFloat(n.toFixed(2));if(typeof t=="number"||String(t).endsWith("px"))return`${e}px`;if(String(t).endsWith("%"))return`${e}%`}function E(t,n,e,o,s){const r=K(t._meta?.htmlID);if(!r)return;const l=ot(r),p=n==="contents"?["containerPadding",...et[e]||[]]:n==="columns"?["padding","border"]:["padding"];for(const a of o==="document"?["desktop"]:["desktop","mobile"]){const m=t._override?.[a];if(m)for(const c of p){if(!(c in m))continue;const i=m[c],h=c.replace(/[A-Z]/g,d=>`-${d.toLowerCase()}`),g=n==="rows"?"row-":n==="columns"?"col-":"",f=d=>`#${l} .v-${g}${h===d?h:`${h}-${d}`}`,u=d=>(s[a]||=[]).push(d);if(c==="padding"||c==="containerPadding"){if(!(i||i===0)||T(i)===void 0)continue;const w=n==="rows"||o==="web"&&n==="contents"&&c==="containerPadding"?f("padding").replace(`#${l} `,`#${l}`):f("padding");if(u(`${w} { padding: ${T(i)} !important; }`),o==="email"&&n==="rows"){const x=String(i).trim().split(/\s+/),[$,y]=[x[0],x[2]||x[0]].map(C=>b(C)??T(C));$!==void 0&&y!==void 0&&u(`${w}--vertical { padding-top: ${$} !important; padding-bottom: ${y} !important; }`)}}else if(c==="border")i&&u(`${f("border")} { ${["Top","Left","Right","Bottom"].map(d=>{const w=T(i[`border${d}Width`]||"0px")??"0px";return`border-${d.toLowerCase()}: ${w} ${T(i[`border${d}Style`]||"solid")??"solid"} ${parseInt(w)>0&&T(i[`border${d}Color`])||"transparent"} !important;`}).join("")} }`);else if(c==="src"){if(!i)continue;const d={...t.src,...i},w=d.autoWidth===!1?b(d.maxWidth):void 0;u(`${f("width")} { width: ${w||"100%"} !important; }`),u(`${f("max-width")} { max-width: ${b(w||d.width||"100%")} !important; }`)}else if(c==="size"||c==="width"){if(!i)continue;u(`${f("width")} { width: ${b(i.width)&&!i.autoWidth?b(i.width):"auto"} !important; }`),u(`${f("max-width")} { max-width: 100% !important; }`)}else{if(!(i||c==="lineHeight"&&`${i}`=="0"))continue;const d=T(c==="fontSize"&&typeof i=="number"?`${i}px`:i);if(d===void 0)continue;u(`${f(h)} { ${h}: ${d} !important; }`)}}}}function it(t,n){return Object.entries(t).filter(([,e])=>e.length).map(([e,o])=>`${e==="mobile"?"@media (max-width: 480px)":`@media (min-width: ${n==="document"?1:481}px)`} { ${o.join(" ")} }`).join(`
`)}function st(t){if(t==="document")return"";const n=t==="email"?"max-height: 0px; overflow: hidden; ":"";return(t==="email"?`@media (min-width: 0px) { .hide-default__display-block { display: block !important; mso-hide: unset !important; } .hide-default__display-table { display: table !important; mso-hide: unset !important; } }
`:"")+`@media (max-width: 480px) { .hide-mobile { ${n}display: none !important; } }
@media (min-width: 481px) { .hide-desktop { ${n}display: none !important; } }`}function F(t,n=[]){const e=new Set(["children","mode","className","style","index","colIndex","cells","bodyValues","rowValues","_config","config","previewText","fonts","lang","layout","collection",...n]),o={};for(const[s,r]of Object.entries(t))!e.has(s)&&r!==void 0&&(o[s]=r);return o}function D(t,n){return t[n]=(t[n]||0)+1,t[n]}function _(t,n,e=0){return{...t,_meta:{htmlID:`${["row","column"].includes(n)?"u":"u_content"}_${n.toLowerCase()}_${e+1}`,htmlClassNames:`u_content_${n.toLowerCase()}`,...t._meta||{}}}}const j=t=>H.Children.toArray(t).filter(H.isValidElement);function P(t,n,e,o,s,r,l,p){if(!t)return;const a=[n,e,{displayMode:o,isViewer:!1,variant:null,type:"rows",headConfig:s}],m=t.css?.(...a);m&&r.push(m);const c=t.js?.(...a);c&&l.push(c);const i=t.tags?.(...a);i&&p.push(...i)}function rt(t,n,e,o,s,r,l,p,a){const m=t.type,c=m[X];if(!c){m?.[nt]&&D(s,`u_content_${(m.displayName||m.name||"component").toLowerCase()}`);return}const{name:i,defaultValues:h,propMapper:g}=c,{children:f,...u}=t.props,d=g({children:f,...u}),w=L(h,d),x=c.metaName??i.toLowerCase(),$=D(s,`u_content_${x}`),y=_(w,x,$-1);E(y,"contents",i,e,a);const C=c.head??S[i];P(C,y,n,e,o,r,l,p)}function at(t,n,e,o,s,r,l,p,a,m){const c=F(t.props),i=B(c,R,"Column"),h=D(r,"u_column"),g=_(L(R,i),"column",h-1);E(g,"columns","Column",o,m);const f=S.Column;P(f,g,n,o,s,l,p,a);const u=j(t.props.children);for(const d of u)rt(d,n,o,s,r,l,p,a,m)}function ct(t,n,e,o,s,r,l,p,a){const m=F(t.props,["layout"]),c=B(m,N,"Row"),i=D(s,"u_row"),h=_(L(N,c),"row",i-1);E(h,"rows","Row",e,a);const g=S.Row;P(g,h,n,e,o,r,l,p);const f=j(t.props.children);for(const u of f)O(u)==="Column"&&at(u,n,h,e,o,s,r,l,p,a)}function U(t,n){t=tt(t);const{displayMode:e}=n,o={hasFeature:n.headConfig?.hasFeature??(()=>!1),getInitialValues:n.headConfig?.getInitialValues??(()=>({}))},s=[],r=[],l=[],p={},a={},m=F(t.props),c=B(m,A,"Body"),i=_(L(A,c),"body",0),h=S.Body;P(h,i,i,e,o,s,r,l);const g=j(t.props.children);for(const d of g)O(d)==="Row"&&ct(d,i,e,o,p,s,r,l,a);s.unshift(st(e));const f=it(a,e);f&&s.push(f);const u=[...new Set(l.filter(Boolean))];return{css:s.filter(Boolean).join(`
`),js:r.filter(Boolean).join(`
`),tags:u}}function dt(t){const{dir:n,titleTag:e,tagLines:o,styleTag:s,scriptTag:r,fontLinks:l,body:p}=t,a=[e,o,s,r,l&&`<!--[if !mso]><!-->${l}<!--<![endif]-->`].filter(Boolean).join(`
  `);return`<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html${n}${t.lang||""} xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<!--[if gte mso 9]>
<xml>
  <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml>
<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
  ${a}
</head>
${p}
</html>
`}function lt(t){const{dir:n,titleTag:e,tagLines:o,styleTag:s,scriptTag:r,fontLinks:l,body:p}=t,a=[e,o,s,r,l].filter(Boolean).join(`
  `);return`<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html${n}${t.lang||""} xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  ${a}
</head>
${p}
</html>
`}function pt(t){const{dir:n,titleTag:e,tagLines:o,styleTag:s,scriptTag:r,fontLinks:l,body:p}=t,a=[e,l,o,s,r].filter(Boolean).join(`
    `);return`<!doctype html>
<html${n}${t.lang||""}>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${a}
  </head>
  <body>
${p}
  </body>
</html>
`}const M={Email:"email",Page:"web",Document:"document"};function I(t,n){const e=t.props,o=Z(e.textDirection??e.values?.textDirection);return{...J,...o!==void 0?{textDirection:o}:{},...n}}function W(t,n){const e=t.type?.displayName;return(e?M[e]:void 0)??t.props.mode??n.mode??"web"}function z(t,n,e="renderToHtml"){const o=I(t,n);try{const s=H.cloneElement(t,{config:o});return Q(s)}catch(s){const r=s instanceof Error?s.message:String(s);throw new Error(`[Unlayer] ${e} failed: ${r}
Tip: Ensure your tree uses Body > Row > Column > Item structure.`)}}function mt(t){const n=t.match(/^\s*<div[^>]*>([\s\S]*)<\/div>\s*$/);return n?n[1]:t}function v(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function xt(t,n){return k(()=>ut(t,n))}function q(t){return t.replace(/<\/(style)/gi,"<\\/$1")}function ut(t,n){const{title:e,lang:o,fonts:s=[],...r}={};t=V(t,"renderToHtml");const p=[...t.props?.fonts??[],...s].filter(($,y,C)=>$?.url&&C.findIndex(Y=>Y?.url===$.url)===y),a=o??t.props.lang,m=I(t,r),c=W(t,m),i=t.type?.displayName,h=i==="Body"||(i?i in M:!1),g=z(t,r),f=h?mt(g):g,{css:u,js:d,tags:w}=U(t,{displayMode:c,headConfig:m.headConfig}),x={lang:a?` lang="${v(String(a))}"`:"",dir:m.textDirection?` dir="${v(String(m.textDirection))}"`:"",titleTag:e?`<title>${v(e.trim())}</title>`:"",styleTag:u?`<style type="text/css">
${q(u)}
</style>`:"",scriptTag:d?`<script type="application/javascript">
${d}
<\/script>`:"",tagLines:w.join(`
`),fontLinks:p.filter($=>$?.url).map($=>`<link href="${v(String($.url))}" rel="stylesheet" type="text/css">`).join(""),body:f};return c==="email"?dt(x):c==="document"?lt(x):pt(x)}function yt(t,n){return k(()=>ft(t,n))}function ft(t,n){t=V(t,"renderToHtmlParts");const e=z(t,n,"renderToHtmlParts"),o=I(t,n),s=W(t,o),{css:r,js:l,tags:p}=U(t,{displayMode:s,headConfig:o.headConfig}),a=[];return r&&a.push(`<style>${q(r)}</style>`),l&&a.push(`<script>${l}<\/script>`),p.length>0&&a.push(...p),{head:a.join(`
`),body:e,css:r,js:l,tags:p}}export{xt as a,yt as r};
