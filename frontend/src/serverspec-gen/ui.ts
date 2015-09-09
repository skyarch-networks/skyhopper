/// <reference path="../../declares.d.ts" />
/// <reference path="./ast.ts" />

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





  // Computeds

  _rubyCode(): string {
    const ast = new AST.Top(this.ast);
    return ast.to_ruby();
  }

  _downloadHref(): string {
    return `data:application/octet-stream,${encodeURIComponent(this.rubyCode)}`;
  }
}


// TODO: Split files

const ResourcePanel = Vue.extend({
  template: '#resource-panel-template',
  el: () => { return document.createElement('div'); },
  props: {
    desc: {
      type: Object,
      twoWay: true,
      required: true,
    },
    idx: {
      type: Number,
      required: true,
    },
  },
  methods: {
    addIt: function () {
      this.desc.body.push({
        type: 'it',
        should: true,
        matcher: {name: 'be_', args: [], chains: []},
      });
    },

    addIts: function () {
      this.desc.body.push({
        type: 'its',
        name: "",
        should: true,
        matcher: {name: 'be_', args: [], chains: []},
      });
    },

    removeIt: function(idx: number) {
      console.log(idx);
      this.desc.body.$remove(idx);
    },
  },
  ready: function() {
    console.log(this);
  }
});

Vue.component("resource-panel", ResourcePanel);



const ItPanel = Vue.extend({
  template: '#it-panel-template',
  el: () => {return document.createElement('div'); },
  props: {
    it: {
      type: Object,
      twoWay: true,
      required: true,
    },
    idx: {
      type: Number,
      required: true,
    }
  },
  ready: function() {
    console.log(this);
  },
});

Vue.component("it-panel", ItPanel);

const app = new VueMain([]);
