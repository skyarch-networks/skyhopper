//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

/// <reference path="../../declares.d.ts" />

import ModelBase from './base';

export default class Serverspec extends ModelBase {
  constructor() {super(); }

  static ajax = new AjaxSet.Resources('serverspecs');

  create(fname: string, value: string): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      Serverspec.ajax.create({
        serverspec: {
          name:  fname,
          value: value,
        }
      })
    );
  }
}
