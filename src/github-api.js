export default class GithubAPI {

  constructor() {
    
    this.headers = new Headers();
    this.headers.append('Accept', 'application/vnd.github.v3+json');
    this.headers.append('Accept', 'application/vnd.github.v3.html');
  }
  
  async getMasterTree() {
    return await getBranchTree('master');
  }
  
  async getBranchTree(branch) {
    
    let url = getBranchURL(branch);
    
    let response = await getFromGithub(url);
    
    return await getTree(url.commit.sha);
  }
  
  async getTree(sha) {
    let url = getTreeURL(sha);
    
    return await getFromGithub(url);
  }
  
  async getFromGithub(url, type) {
    let init = {
      method: 'GET',
      headers: this.headers,
      mode: 'cors',
      cache: 'default'
    };
    
    let response = await fetch(url, init);
    switch (type) {
      case 'HTML':
        return await response.text();
      case 'JSON':
      default:
        return await response.json();
    }
  }
  
  static get root() {
    return 'https://api.github.com';
  }
  
  getBranchURL(branch) {
    return `${GithubAPI.root}/repos/${this.user}/${this.repo}/branches/${branch}`;
  }
  
  getContentsURL(path) {
    return `${GithubAPI.root}/repos/${this.user}/${this.repo}/contents/${path}`;
  }
  
  getTreeURL(sha) {
    return `${GithubAPI.root}/repos/${this.user}/${this.repo}/git/trees/${sha}?recursive=1`;
  }

}