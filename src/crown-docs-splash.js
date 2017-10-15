import {Element as PolymerElement} from "../node_modules/@polymer/polymer/polymer-element.js";


const template = `
<style>
  :host {
    margin: 0;
    padding: 0;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background-color: whitesmoke;
    display: grid;
    grid-template-columns: 50% 50%;
    grid-template-rows: 50% 50%;
    grid-gap: 24px;
  }
  :host ::slotted(.grow) {
    z-index: 2;
    animation-duration: 0.5s;
    animation-name: grow;
    animation-fill-mode: both;
    animation-timing-function: ease-in-out;
  }
</style>
<slot id="sites" name="sites"></slot>
`;

export class CrownDocsSplash extends PolymerElement {
  
  static get template() {
    return template;
  }

  constructor() {
    super();
  }
  
  connectedCallback() {
    super.connectedCallback();
  
    this.$.sites.assignedNodes().forEach((el) => {
      el.addEventListener("click", this.openSite);
    })
  }
  
  

  static get properties() {
    return {
      location: {
        type: String
      }
    };
  }
  
  openSite(e) {
    e.target.classList.add("grow");
    // let event = new CustomEvent('open-site', {bubbles: true, detail: {repo: e.target.getAttribute('repo'), user: e.target.getAttribute('user')}});
    // this.dispatchEvent(event);
    
    window.history.pushState({}, null, `/docs/${e.target.getAttribute('user')}/${e.target.getAttribute('repo')}`);
    window.dispatchEvent(new CustomEvent('location-changed'));
  }
}

customElements.define('crown-docs-splash', CrownDocsSplash);