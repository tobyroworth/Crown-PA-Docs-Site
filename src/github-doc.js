import {Element as PolymerElement} from "../node_modules/@polymer/polymer/polymer-element.js";

import GithubAPI from "./github-api.js";

const template = `
<style>
  :host {
    display: block;
  }
  #spinner {
    width: 100%;
    height: 100vh;
  
    background-color: limegreen;
    opacity: 0;
    transition: opacity 0.3s;
    
    position: absolute;
  }
  #spinner.spin {
    opacity: 0.3;
    animation-delay: 0.3s;
    animation-duration: 1.5s;
    animation-name: fadeIn;
    animation-iteration-count: infinite;
    animation-direction: alternate;
    animation-fill-mode: both;
    animation-timing-function: ease-in-out;
  }
  @keyframes fadeIn {
    from {
      opacity: 0.3
    }
    50% {
      opacity: 0.6
    }
    to {
      opacity: 0.3
    }
  }
</style>
<div id="spinner"></div>
<div id="docs"></div>
`;

export class GithubDoc extends PolymerElement {
  
  static get template() {
    return template;
  }

  constructor() {
    super();
    
    this.github = new GithubAPI();
  }

  static get properties() {
    return {
      site: {
        type: Object,
        value: () => {
          return {};
        }
      },
      path: {
        type: String
      }
    };
  }
  
  static get observers() {
    return [
      'githubChanged(site.user, site.repo, path)'
    ];
  }
  
  githubChanged(user, repo, path) {
    if (user && repo && path) {
      this.github.user = user;
      this.github.repo = repo;
      this.openDoc(path);
    }
  }
  
  async openDoc(p) {
    this.$.spinner.classList.add('spin');
    let path = p;
    path = path.replace(/_/g, ' ');
    path = `${this.site.rootPath}${path}.md`;
    let url = this.github.getContentsURL(path);
    let response = await this.github.getFromGithub(url, 'HTML');
    this.$.docs.innerHTML = response;
    
    this.$.docs.querySelectorAll('img').forEach((img) => {
      img.src = `https://raw.githubusercontent.com/${this.site.user}/${this.site.repo}/master${new URL(img.src).pathname}`;
    });
    
    this.$.spinner.classList.remove('spin');
  }
}

customElements.define('github-doc', GithubDoc);