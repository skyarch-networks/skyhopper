//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

/// <reference path="../../declares.d.ts" />

import ModelBase from './base';

export default class Dish extends ModelBase {
  constructor(public id: string) {super(); }

  static ajax = new AjaxSet.Resources('dishes');


  runlist(id: number): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>Dish.ajax).runlist({id: id})
    );
  }
}
Dish.ajax.add_member('runlist', 'GET');
