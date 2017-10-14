import {Element as PolymerElement} from "../node_modules/@polymer/polymer/polymer-element.js";

import "../node_modules/@polymer/polymer/lib/elements/dom-repeat.js";

import GithubAPI from "./github-api.js";

const template = `
<style>
:host {
  display: block;
  width: 100%;
  height: 100%;
  background-color: gainsboro;
}
.tree {
  color: white;
  background-color: limegreen;
  border-radius: 2px;
}
.blob {
  background-color: whitesmoke;
  border-radius: 2px;
}
.item {
  margin-left: 4px;
  margin-right: 4px;
  margin-bottom: 8px;
  padding-left: 16px;
  height: 48px;
  display: flex;
  flex-direction: row;
  align-items: center;
  box-shadow: 0px 1px 1px slategrey;
}
.title {
  font-weight: bold;
  box-shadow: none;
  height: 64px;
}
</style>
<div class="item title">Contents</div>
<template is="dom-repeat" items="{{tree}}">
  <div path="[[item.path]]" class$="item [[item.type]]" on-click='openDocs'>[[cleanPath(item.path)]]</div>
</template>
`;

export class GithubDocsList extends PolymerElement {
  
  static get template() {
    return template;
  }

  constructor() {
    super();
    
    this.github = new GithubAPI();
    // this.github.user = 'tobyroworth';
    // this.github.repo = 'LivingRoomPADocs';
  }
  
  connectedCallback() {
    super.connectedCallback();
    
    // this.getTree();
  }

  static get properties() {
    return {
      tree: {
        type: Array,
        value: []
      },
      user: {
        type: String,
        observer: 'userChanged'
      },
      repo: {
        type: String,
        observer: 'repoChanged'
      }
    };
  }
  
  userChanged(newVal) {
    this.github.user = newVal;
    this.getTree();
  }
  
  repoChanged(newVal) {
    this.github.repo = newVal;
    this.getTree();
  }
  
  async getTree() {
    if (!this.user || !this.repo) {
      return;
    }
    
    let {tree} = await this.github.getMasterTree();
    
    tree = tree.filter((item) => {
      return /^docs\/.*/.test(item.path);
    });
    
    this.tree = tree;
    
    let event = new CustomEvent('tree-loaded');
    this.dispatchEvent(event);
  }
  
  openDocs(e) {
    if (e.model.item.type === 'blob') {
      let event = new CustomEvent('open-doc', {detail: {path: e.model.item.path}});
      this.dispatchEvent(event);
    }
  }
  
  cleanPath(path) {
    let clean = /^docs\/([^\.]*)(?:\.md)*/.exec(path)[1];
    return clean.split('/').pop();
  }
}

customElements.define('github-docs-list', GithubDocsList);