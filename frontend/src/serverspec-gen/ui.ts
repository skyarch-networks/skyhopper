/// <reference path="../../declares.d.ts" />

import ResourcePanel     from './resource-panel';
import ItPanel           from './it-panel';
import Serverspec        from '../models/serverspec';
import * as ASTInterface from './ast-interface';
import * as AST          from './ast';

class VueMain extends Vue {
  private ast: ASTInterface.Describe[];
  private rubyCode:     string;

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
        save:         this.save,
      },
      computed: {
        rubyCode:     this._rubyCode,
      },
      ready: () => { console.log(this); }
    });
  }


  // methods
  addDescribe(): void {
    this.ast.push({resourceType: "command", name: "NAME", body: []});
  }

  removeDescribe(idx: number): void {
    (<any>this.ast).$remove(idx);
  }

  save(): void {
    bootstrap_prompt("Serverspec Generator", "filename").done((fname) => {
      const s = new Serverspec();
      s.create(fname, this.rubyCode).done(function (data) {
        bootstrap_alert(t('serverspecs.serverspec'), data);
      }).fail(modal_for_ajax_std_error());
    });
  }


  // Computeds

  _rubyCode(): string {
    const ast = new AST.Top(this.ast);
    return `require 'serverspec_helper'

${ast.to_ruby()}`;
  }
}

if (document.querySelector('#main')) {
  Vue.component("resource-panel", ResourcePanel);
  Vue.component("it-panel", ItPanel);
  const __ = new VueMain([]);
}
