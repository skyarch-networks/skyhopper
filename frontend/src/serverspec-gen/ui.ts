/// <reference path="../../declares.d.ts" />

import ResourcePanel     from './resource-panel';
import ItPanel           from './it-panel';
import * as ASTInterface from './ast-interface';
import * as AST          from './ast';

class VueMain extends Vue {
  private ast: ASTInterface.Describe[];
  private rubyCode:     string;
  private downloadHref: string;

  constructor(ast: ASTInterface.Describe[]) {
    this.ast = ast;
    super({
      el: '#main',
      data: {
        ast: this.ast,
      },
      methods: {
        addDescribe:    this.addDescribe,
        removeDescribe: this.removeDescribe,
      },
      computed: {
        rubyCode:     this._rubyCode,
        downloadHref: this._downloadHref,
      },
      ready: () => { console.log(this); }
    });
  }


  // methods
  addDescribe(): void {
    this.ast.push({resourceType: "a", name: "a", body: []});
  }

  removeDescribe(idx: number): void {
    (<any>this.ast).$remove(idx);
  }


  // Computeds

  _rubyCode(): string {
    const ast = new AST.Top(this.ast);
    return ast.to_ruby();
  }

  _downloadHref(): string {
    return `data:application/octet-stream,${encodeURIComponent(this.rubyCode)}`;
  }
}

if (document.querySelector('#main')) {
  Vue.component("resource-panel", ResourcePanel);
  Vue.component("it-panel", ItPanel);
  const __ = new VueMain([]);
}
