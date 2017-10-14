import {Element as PolymerElement} from "../node_modules/@polymer/polymer/polymer-element.js";

import "../node_modules/@polymer/app-layout/app-header-layout/app-header-layout.js";
import "../node_modules/@polymer/app-layout/app-header/app-header.js";
import "../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js";

import GithubAPI from "./github-api.js";

const template = `
<style>
  app-header {
    color: white;
    background-color: limegreen;
  }
  #docs {
    color: red;
  }
</style>
<app-header-layout>
  <app-header effects="waterfall">
    <app-toolbar>
      <div main-title>Docs for [[location]]</div>
    </app-toolbar>
  </app-header>
  <div id="docs"></div>
</app-header-layout>`;

export class CrownDocsApp extends PolymerElement {
  
  static get template() {
    return template;
  }

  constructor() {
    super();
    
    this.github = new GithubAPI();
    this.github.user = 'tobyroworth';
    this.github.repo = 'Crown-PA-Docs-Site';
  }
  
  ready() {
    super.ready();
    
    let url = this.github.getContentsURL('', 'dir');
    
    this.github.getFromGithub(url).then((response) => {
      this.github.getFromGithub(response[1].url, 'HTML').then((response) => {
        this.$.docs.innerHTML = response;
      });
    });
  }

  static get properties() {
    return {
      location: {
        type: String
      }
    };
  }
}

customElements.define('crown-docs-app', CrownDocsApp);