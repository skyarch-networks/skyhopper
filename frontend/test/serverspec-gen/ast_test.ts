/// <reference path="../../typings/tsd.d.ts" />

import * as mocha from 'mocha';
import * as AST from '../../src/serverspec-gen/ast';

describe('AST', () => {
  describe('Describe', () => {
    describe('#to_ruby', () => {
      it('simple', () => {
        const d = new AST.Describe({
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
        });
        assert(d.to_ruby() ===
`describe lxc('ct01') do
  it{should exist}
  it{should be_running}
end`);
      });

      it('name is blank', () => {
        const d = new AST.Describe({
          resourceType: 'selinux',
          name: '',
          body: [],
        });
        assert(d.to_ruby() ===
`describe selinux do

end`
        );
      });
    });
  });

  describe('It', () => {
    describe('#to_ruby', () => {
      it('simple', () => {
        const i = new AST.It({
          type: 'it',
          should: true,
          matcher: {name: 'be_running', args: [], chains: []},
        });
        assert(i.to_ruby() === 'it{should be_running}');
      });

      it('not', () => {
        const i = new AST.It({
          type: 'it',
          should: false,
          matcher: {name: 'be_running', args: [], chains: []},
        });
        assert(i.to_ruby() === 'it{should_not be_running}');
      });
    });
  });

  describe('Its', () => {
    describe('#to_ruby', () => {
      it('simple', () => {
        const i = new AST.Its({
          type: 'its',
          name: ':value',
          should: true,
          matcher: {name: 'eq', args: ['1'], chains: []}
        });
        assert(i.to_ruby() === 'its(:value){should eq(1)}');
      });

      it('not', () => {
        const i = new AST.Its({
          type: 'its',
          name: ':value',
          should: false,
          matcher: {name: 'eq', args: ['1'], chains: []}
        });
        assert(i.to_ruby() === 'its(:value){should_not eq(1)}');
      });
    });
  });

  describe('Matcher', () => {
    describe('#to_ruby', () => {
      it('simple', () => {
        const m = new AST.Matcher({name: 'be_mounted', args: [], chains: []});
        assert(m.to_ruby() === 'be_mounted');
      });

      it('have args', () => {
        const m = new AST.Matcher({name: 'be_mounted', args: ["'foo'", "'bar'"], chains: []});
        assert(m.to_ruby() === "be_mounted('foo', 'bar')");
      });

      it('have chains', () => {
        const m = new AST.Matcher({
          name: 'have_rule',
          args: ['"-P INPUT ACCEPT"'],
          chains: [
            {name: 'with_table', arg: '"mangle"'},
            {name: 'with_chain', arg: '"INPUT"'},
          ],
        });
        assert(m.to_ruby() === 'have_rule("-P INPUT ACCEPT").with_table("mangle").with_chain("INPUT")');
      });
    });
  });

  describe('Chain', () => {
    describe('#to_ruby', () => {
      it('should expected ruby code fragment', () => {
        const chain = new AST.Chain({name: "by", arg: "'hoge'"});
        assert(chain.to_ruby() === ".by('hoge')");
      });
    });
  });
});
