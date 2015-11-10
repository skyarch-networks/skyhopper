/// <reference path="../../declares.d.ts" />

export interface ServerspecInfo {
  [resource_name: string]: Resource;
}

export interface Resource {
  matchers: string[];
  its_targets: string[];
}
