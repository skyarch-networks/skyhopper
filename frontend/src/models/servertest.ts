//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

/// <reference path="../../declares.d.ts" />

import ModelBase from './base';

export default class Servertest extends ModelBase {
  constructor(public infra_id: number) {super(); }

  static ajax = new AjaxSet.Resources('servertests');

  create(fname: string, value: string, category: string): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      Servertest.ajax.create({
        servertest: {
          name:              fname,
          value:             value,
          infrastructure_id: this.infra_id,
          category:          category, // Default for serverspec Generator
        }
      })
    );
  }

  /**
   * @method generate_awspec
   * @return {$.Promise}
   */

  generate_awspec(): JQueryPromise<any> {
    const dfd = $.Deferred();
    (<any>Servertest.ajax).generate_awspec({infrastructure_id: this.infra_id})
      .done(this.wait_change_status(
          this.infra_id,
          dfd,
          'awspec-generate'
        ))
      .fail(this.rejectF(dfd));

    return dfd.promise();
  }
}

Servertest.ajax.add_collection('generate_awspec', 'GET');
