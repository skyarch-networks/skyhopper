/// <reference path="../../declares.d.ts" />

export interface ServerspecInfo {
  [resource_name: string]: Resource;
}

export interface Resource {
  matchers: Matchers;
  its_targets: string[];
}

export interface Matchers {
  [matcher_name: string]: Matcher;
}

export interface Matcher {
  parameters: string[];
  chains:     string[];
}
