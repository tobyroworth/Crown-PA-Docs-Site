import {Element as PolymerElement} from "../node_modules/@polymer/polymer/polymer-element.js";

import "../node_modules/@polymer/polymer/lib/elements/dom-repeat.js";
import "../node_modules/@polymer/iron-selector/iron-selector.js";

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
  transition: transform 0.3s ease-in-out;
}
.blob:hover {
  transform: translateX(8px);
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
.iron-selected {
  color: limegreen;
}
.title {
  font-weight: bold;
  box-shadow: none;
  height: 64px;
}
</style>
<div class="item title">[[_heading(path)]]</div>
<iron-selector selected='[[path]]' attr-for-selected='path' on-iron-select='openDocs'>
  <template id="tree" is="dom-repeat" items="{{tree}}" filter='_filterTree'>
    <div path="[[_cleanPath(item.path)]]" type="[[item.type]]" class$="item [[item.type]]">[[_leaf(item.path)]]</div>
  </template>
</iron-selector>
`;

export class GithubDocsList extends PolymerElement {
  
  static get template() {
    return template;
  }

  constructor() {
    super();
    
    this.github = new GithubAPI();
  }
  
  connectedCallback() {
    super.connectedCallback();
    
    // this.getTree();
  }

  static get properties() {
    return {
      path: {
        type: String,
        observer: '_pathChanged'
      },
      tree: {
        type: Array,
        value: []
      },
      site: {
        type: Object,
        value: () => {
          return {};
        }
      }
    };
  }
  
  static get observers() {
    return [
      '_siteChanged(site.user, site.repo)'
    ];
  }
  
  async getTree() {
    
    if (!this.site) {
      return;
    }
    
    if (!this.site.user || !this.site.repo) {
      return;
    }
    
    let {tree} = await this.github.getMasterTree();
    
    let rootTest = new RegExp(`^${this.site.rootPath}/.*`);
    
    tree = tree.filter((item) => {
      return rootTest.test(item.path);
    });
    
    this.tree = tree;
    
    let event = new CustomEvent('tree-loaded');
    this.dispatchEvent(event);
  }
  
  openDocs(e) {
    if (e.detail.item.type === 'blob') {
      let event = new CustomEvent('open-doc', {detail: {path: e.detail.item.path}});
      this.dispatchEvent(event);
    }
    if (e.detail.item.type === 'tree') {
      let event = new CustomEvent('open-doc', {detail: {path: e.detail.item.path}});
      this.dispatchEvent(event);
    }
  }
  
  _siteChanged(user, repo) {
    
    this.github.user = user;
    this.github.repo = repo;
    
    this.getTree();
  }
  
  _pathChanged(path) {
    if (path) {
      this.$.tree.render();
    }
  }
  
  _heading(path) {
    if (!path || path === "") {
      return "Contents";
    } else {
      return this._leaf(`${this.site.rootPath}${path}`);
    }
  }
  
  _filterTree(item) {
    
    let path = this.path.replace(/_/g, ' ');
    
    let branchTest = new RegExp(`${this.site.rootPath}/*${path}/([^/])+$`);
    
    return branchTest.test(item.path);
  }
  
  _cleanPath(path) {
    let cleaner = new RegExp(`^${this.site.rootPath}(/*[^.]*)(?:.md)*`);
    let clean = cleaner.exec(path)[1];
    clean = clean.replace(/\s/g, '_');
    return clean;
  }
  
  _leaf(path) {
    let clean = this._cleanPath(path);
    let leaf = clean.split('/').pop();
    return leaf.replace(/_/g, ' ');
  }
}

customElements.define('github-docs-list', GithubDocsList);