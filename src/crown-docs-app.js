import {Element as PolymerElement} from "../node_modules/@polymer/polymer/polymer-element.js";

export class CrownDocsApp extends PolymerElement {
  
  static get template() {
    return `<div>Docs for [[location]]</div>`
  }

  constructor() {
    super();
    this.location = 'The Living Room';
  }

  // properties, observers, etc. are identical to 2.x
  static get properties() {
    name: {
      Type: String
    }
  }
}

customElements.define('crown-docs-app', CrownDocsApp);