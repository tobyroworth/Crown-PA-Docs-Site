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
.tree::before {
  content: '▶ ';
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
<div class="item title" path='[[menuPath]]' on-click='openUp'>[[_heading(menuPath)]]</div>
<iron-selector selected='[[fullPath]]' attr-for-selected='path' on-iron-select='openDocs'>
  <template id="tree" is="dom-repeat" items="{{tree}}" filter='_filterTree'>
    <div path="[[item.path]]" type="[[item.type]]" class$="item [[item.type]]">[[_leaf(item.path)]]</div>
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
      menuPath: {
        type: String,
        observer: '_menuPathChanged'
      },
      fullPath: {
        type: String
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
    
    this._pathChanged(this.path);
    
    let event = new CustomEvent('tree-loaded');
    this.dispatchEvent(event);
  }
  
  openUp(e) {
    
    let path = e.target.path;
    
    path = path.replace(/\/$/, '');
    
    path = path.substr(0, path.lastIndexOf('/'));
    
    this.menuPath = path;
  }
  
  openDocs(e) {
    if (e.detail.item.type === 'blob') {
      let event = new CustomEvent('open-doc', {detail: {path: this._cleanPath(e.detail.item.path)}});
      this.dispatchEvent(event);
    }
    if (e.detail.item.type === 'tree') {
      this.menuPath = e.detail.item.path;
    }
  }
  
  getFullPath(path) {
    
    let regPath = new RegExp(path.replace(/_/g, ' '));
    
    let pathItem = this.tree.find((item) => {
      return regPath.test(item.path);
    });
    
    return pathItem.path;
  }
  
  _siteChanged(user, repo) {
    
    this.github.user = user;
    this.github.repo = repo;
    
    this.getTree();
  }
  
  _pathChanged(path) {
    if (path) {
      if (this.tree.length > 0) {
        this.fullPath = this.getFullPath(path);
        if (/\.md$/.exec(this.fullPath)) {
          this.menuPath = this.fullPath.substr(0, this.fullPath.lastIndexOf('/'));
        } else {
          this.menuPath = this.fullPath;
        }
      }
    }
  }
  
  _menuPathChanged(path) {
    if (path) {
      this.$.tree.render();
    }
  }
  
  _heading(path) {
    if (!path || path === "" || path === this.site.rootPath) {
      return "Contents";
    } else {
      let leaf = this._leaf(path);
      return `▲ ${leaf}`;
    }
  }
  
  _filterTree(item) {
    
    if (!this.menuPath) {
      return true;
    }
    
    let path = this.menuPath.replace(/_/g, ' ');
    
    let branchTest = new RegExp(`${path}/([^/])+$`);
    
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