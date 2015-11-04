/// <reference path="../../declares.d.ts" />
/// <reference path="../../query-string.d.ts" />

import ResourcePanel     from './resource-panel';
import ItPanel           from './it-panel';
import Serverspec        from '../models/serverspec';
import * as Info         from './serverspec_info';
import * as ASTInterface from './ast-interface';
import * as AST          from './ast';

import {Prompt, Alert, AlertForAjaxStdError} from '../modal';

import * as qs from 'query-string';

// This is defined by rails in eruby.
declare const SERVERSPEC_INFO: Info.ServerspecInfo;


class VueMain extends Vue {
  private ast:  ASTInterface.Describe[];
  private info: Info.ServerspecInfo;

  private rubyCode:      string;

  constructor(ast: ASTInterface.Describe[], info: Info.ServerspecInfo) {
    this.ast  = ast;
    this.info = info;

    super({
      el: '#main',
      data: {
        ast: this.ast,
      },
      methods: {
        addDescribe:    this.addDescribe,
        removeDescribe: this.removeDescribe,
        save:           this.save,
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
    Prompt("Serverspec Generator", "filename").then((fname) => {
      const s = new Serverspec();
      const infra_id_str: string = qs.parse(location.search).infrastructure_id;
      const infra_id: number = infra_id_str ? parseInt(infra_id_str) : null;
      return s.create(fname, this.rubyCode, infra_id);
    }).then(
      data => Alert(t('serverspecs.serverspec'), data),
      AlertForAjaxStdError()
    ).then(() => {
      location.href = `/serverspecs${location.search}`;
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
  const __ = new VueMain([], SERVERSPEC_INFO);
}
