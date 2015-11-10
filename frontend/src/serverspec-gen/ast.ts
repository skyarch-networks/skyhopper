/// <reference path="../../declares.d.ts" />

// [
//   {
//     resource_type: "type",
//     name: "name",
//     body: [
//       {
//         type: :it,
//         should: true,
//         matcher: {
//           name: 'have_interface',
//           args: ['foo'],
//           chains: [
//             {name: 'by', args: ['foo']},
//             {name: 'with', args: []}
//           ]
//         }
//       },
//       {
//         type: :its,
//         name: :sha256sum,
//         should: true,
//         matcher: {...}
//       }
//     ]
//   }
// ]

import * as ASTInterface from './ast-interface';

export class Top {
  private describes: Describe[];

  constructor(descs: ASTInterface.Describe[]) {
    this.describes = [];
    _.forEach(descs, (desc) => {
      this.describes.push(new Describe(desc));
    });
  }

  to_ruby(): string {
    return this.describes.map(x => x.to_ruby()).join("\n\n");
  }
}

export class Describe {
  private resourceType: string;
  private name: string;
  private body: (It|Its)[];

  constructor(desc: ASTInterface.Describe) {
    this.resourceType = desc.resourceType;
    this.name         = desc.name;
    this.body = [];
    _.forEach(desc.body, (b) => {
      if (b.type === 'it') {
        this.body.push(new It(b));
      } else if (b.type === 'its') {
        this.body.push(new Its(<ASTInterface.Its>b));
      }
    });
  }

  to_ruby(): string {
    const body = this.body.map(x => "  " + x.to_ruby()).join("\n");
    const args = this.name === "" ? "" : `('${this.name}')`;
    return `describe ${this.resourceType}${args} do
${body}
end`;
  }
}

export class It {
  protected should: boolean;
  protected matcher: Matcher;

  constructor(it: ASTInterface.It) {
    this.should = it.should;
    this.matcher = new Matcher(it.matcher);
  }

  to_ruby(): string {
    const should = this.should ? 'should' : 'should_not';
    return `it{${should} ${this.matcher.to_ruby()}}`;
  }
}

export class Its extends It {
  private name: string;
  constructor(its: ASTInterface.Its) {
    super(its);
    this.name = its.name;
  }

  to_ruby(): string {
    const should = this.should ? 'should' : 'should_not';
    return `its(${this.name}){${should} ${this.matcher.to_ruby()}}`;
  }
}

export class Matcher {
  private name: string;
  private args: string[];
  private chains: Chain[];

  constructor(m: ASTInterface.Matcher) {
    this.name = m.name;
    this.args = m.args;
    this.chains = [];
    _.forEach(m.chains, (c) => {
      this.chains.push(new Chain(c));
    });
  }

  to_ruby(): string {
    const args = this.args.length !== 0 ? '(' + this.args.map(x => `${x}`).join(", ") + ')' : '';  // XXX: DRY
    const chains = this.chains.map(c => c.to_ruby()).join('');
    return `${this.name}${args}${chains}`;
  }
}

export class Chain {
  private name: string;
  private args: string[];
  constructor(c: ASTInterface.Chain) {
    this.name = c.name;
    this.args = c.args;
  }

  to_ruby(): string {
    const args = this.args.map(x => `${x}`).join(", ");
    return `.${this.name}(${args})`;
  }
}
