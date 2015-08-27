/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../ast.ts" />

class VueMain extends Vue {
  private ast: ASTInterfaces.Describe[];
  private rubyCode:     string;
  private downloadHref: string;

  constructor(ast: ASTInterfaces.Describe[]) {
    this.ast = ast;
    super({
      el: '#main',
      data: {
        ast: this.ast,
      },
      methods: {
        addDescribe:    this.addDescribe,
        removeDescribe: this.removeDescribe,
        addIt:          this.addIt,
        addIts:         this.addIts,
        removeIt:       this.removeIt,
      },
      computed: {
        rubyCode:     this._rubyCode,
        downloadHref: this._downloadHref,
      },
    });
  }


  // methods
  addDescribe(): void {
    this.ast.push({resourceType: "a", name: "a", body: []});
  }

  removeDescribe(idx: number): void {
    (<any>this.ast).$remove(idx);
  }


  addIt(desc: ASTInterfaces.Describe): void {
    desc.body.push({
      type: 'it', // TODO: its
      should: true,
      matcher: {name: 'be_', args: [], chains: []},
    });
  }

  addIts(desc: ASTInterfaces.Describe): void {
    desc.body.push({
      type: 'its',
      name: "",
      should: true,
      matcher: {name: 'be_', args: [], chains: []},
    });
  }

  removeIt(desc: ASTInterfaces.Describe, idx: number): void {
    (<any>desc.body).$remove(idx);
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

const app = new VueMain([{
  // This is an example.
  resourceType: 'lxc',
  name: 'ct01',
  body: [
    {
      type: 'it',
      should: true,
      matcher: {name: 'exist', args: [], chains: []},
    },
    {
      type: 'it',
      should: true,
      matcher: {name: 'be_running', args: [], chains: []},
    }
  ],
}]);
