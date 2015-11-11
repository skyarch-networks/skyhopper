/// <reference path="../../declares.d.ts" />

export interface Describe {
  resourceType: string;
  name: string;
  body: (It|Its)[];
}

export interface It {
  type: string;
  should: boolean;
  matcher: Matcher;
}

export interface Its extends It {
  name: string;
}

export interface Matcher {
  name: string;
  args: string[];
  chains: Chain[];
}

export interface Chain {
  name: string;
  arg:  string;
  use:  boolean;
}
