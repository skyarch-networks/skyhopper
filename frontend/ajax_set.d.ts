/// <reference path="typings/tsd.d.ts" />

declare module AjaxSet {
  class Base {
    add_endpoint(endpoint: string): void;
  }

  class RailsBase extends Base {
    add_member(action: string, type: string): void;
    add_collection(action: string, type: string): void;
  }

  class Resources extends RailsBase {
    constructor(name: string, param?: string);

    index(arg: any): JQueryDeferred<any>;
    show(arg: any): JQueryDeferred<any>;
    new(arg: any): JQueryDeferred<any>;
    create(arg: any): JQueryDeferred<any>;
    edit(arg: any): JQueryDeferred<any>;
    update(arg: any): JQueryDeferred<any>;
    destroy(arg: any): JQueryDeferred<any>;
  }

  class Resource extends RailsBase {
    constructor(name: string);

    show(arg: any): JQueryDeferred<any>;
    new(arg: any): JQueryDeferred<any>;
    create(arg: any): JQueryDeferred<any>;
    edit(arg: any): JQueryDeferred<any>;
    update(arg: any): JQueryDeferred<any>;
    destroy(arg: any): JQueryDeferred<any>;
  }
}
