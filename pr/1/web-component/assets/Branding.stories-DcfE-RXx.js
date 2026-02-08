class u extends HTMLElement{constructor(){super(),this._variant="default",this._size="medium",this._className="",this._style="",this.attachShadow({mode:"open"})}static get observedAttributes(){return["variant","size","class","style"]}connectedCallback(){this.render()}attributeChangedCallback(e,s,n){if(s!==n){switch(e){case"variant":this._variant=n;break;case"size":this._size=n;break;case"class":this._className=n;break;case"style":this._style=n;break}this.render()}}get variant(){return this._variant}set variant(e){this._variant=e,this.setAttribute("variant",e||"default")}get size(){return this._size}set size(e){this._size=e,this.setAttribute("size",e||"medium")}get className(){return this._className}set className(e){this._className=e,this.setAttribute("class",e)}get inlineStyle(){return this._style}set inlineStyle(e){this._style=e,this.setAttribute("style",e)}getClasses(){const e="unlayer-branding",s={default:"unlayer-branding--default",minimal:"unlayer-branding--minimal",full:"unlayer-branding--full"},n={small:"unlayer-branding--small",medium:"unlayer-branding--medium",large:"unlayer-branding--large"};return[e,s[this._variant||"default"],n[this._size||"medium"],this._className].filter(Boolean).join(" ")}renderContent(){switch(this._variant){case"minimal":return"<span>Made with Unlayer</span>";case"full":return"<span>Made with</span><strong> Unlayer</strong>";default:return"<span>Made with </span><strong>Unlayer</strong>"}}render(){if(!this.shadowRoot)return;const e=this.getClasses(),s=this.renderContent(),n=this._style?` style="${this._style}"`:"";this.shadowRoot.innerHTML=`
      <style>
        .unlayer-branding {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .unlayer-branding--small {
          font-size: 0.875rem;
        }

        .unlayer-branding--medium {
          font-size: 1rem;
        }

        .unlayer-branding--large {
          font-size: 1.125rem;
        }

        .unlayer-branding strong {
          font-weight: 600;
        }
      </style>
      <div class="${e}"${n}>
        ${s}
      </div>
    `}}customElements.define("unlayer-branding",u);customElements.get("unlayer-branding")||customElements.define("unlayer-branding",u);const g={title:"Components/Branding",component:"unlayer-branding",parameters:{layout:"centered",docs:{description:{component:'A branding component that displays "Made with Unlayer" in various styles and sizes.'}}},argTypes:{variant:{control:{type:"select"},options:["default","minimal","full"],description:"The visual variant of the branding"},size:{control:{type:"select"},options:["small","medium","large"],description:"The size of the branding component"},className:{control:{type:"text"},description:"Custom CSS class name"},inlineStyle:{control:{type:"text"},description:"Custom CSS styles"}},tags:["autodocs"]},t={args:{}},r={args:{variant:"minimal"}},i={args:{variant:"full"}},l={args:{size:"small"}},o={args:{size:"large"}},c={args:{className:"custom-branding",inlineStyle:"color: #007bff; font-size: 18px; font-weight: bold;"}},d={render:()=>{const a=document.createElement("div");return a.style.cssText="display: flex; flex-direction: column; gap: 20px; align-items: center;",["default","minimal","full"].forEach(s=>{const n=document.createElement("unlayer-branding");n.variant=s,a.appendChild(n)}),a}},m={render:()=>{const a=document.createElement("div");return a.style.cssText="display: flex; flex-direction: column; gap: 20px; align-items: center;",["small","medium","large"].forEach(s=>{const n=document.createElement("unlayer-branding");n.size=s,a.appendChild(n)}),a}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {}
}`,...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'minimal'
  }
}`,...r.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'full'
  }
}`,...i.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'small'
  }
}`,...l.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'large'
  }
}`,...o.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    className: 'custom-branding',
    inlineStyle: 'color: #007bff; font-size: 18px; font-weight: bold;'
  }
}`,...c.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; flex-direction: column; gap: 20px; align-items: center;';
    const variants = ['default', 'minimal', 'full'] as const;
    variants.forEach(variant => {
      const branding = document.createElement('unlayer-branding') as Branding;
      branding.variant = variant;
      container.appendChild(branding);
    });
    return container;
  }
}`,...d.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; flex-direction: column; gap: 20px; align-items: center;';
    const sizes = ['small', 'medium', 'large'] as const;
    sizes.forEach(size => {
      const branding = document.createElement('unlayer-branding') as Branding;
      branding.size = size;
      container.appendChild(branding);
    });
    return container;
  }
}`,...m.parameters?.docs?.source}}};const p=["Default","Minimal","Full","Small","Large","CustomStyling","AllVariants","AllSizes"];export{m as AllSizes,d as AllVariants,c as CustomStyling,t as Default,i as Full,o as Large,r as Minimal,l as Small,p as __namedExportsOrder,g as default};
