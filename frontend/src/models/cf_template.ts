/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="../../ajax_set.d.ts" />
/// <reference path="infrastructure.ts" />

class CFTemplate {
  constructor(private infra: Infrastructure) {}

  static ajax = new AjaxSet.Resources('cf_templates');

  /**
   * @method new
   * @return {$.Promise}
   */
  new(): JQueryPromise<any> {
    var dfd = $.Deferred();

    (<any>CFTemplate.ajax).new_for_creating_stack({
      infrastructure_id: this.infra.id,
    }).done(this.resolveF(dfd))
      .fail(this.rejectF(dfd));

    return dfd.promise();
  }

  /**
   * @method show
   * @param {Number} id
   * @return {$.Promise}
   */
  show(id: number): JQueryPromise<any> {
    var dfd = $.Deferred();
    $.ajax({
      url: '/cf_templates/' + id,
      dataType: 'json',
    }).done(this.resolveF(dfd))
      .fail(this.rejectF(dfd));

    return dfd.promise();
  }

  /**
   * @method insert_cf_params
   * @param {Object} data
   * @return {$.Promise}
   */
  insert_cf_params(data: {
    name:   string;
    detail: string;
    value:  string;
    params: Array<any>; // XXX: Array だっけ?
  }): JQueryPromise<any> {
    var dfd = $.Deferred();

    var req = {cf_templates: {
      name:              data.name,
      detail:            data.detail,
      value:             data.value,
      params:            data.params,
      infrastructure_id: this.infra.id,
    }};

    (<any>CFTemplate.ajax).insert_cf_params(req)
      .done(this.resolveF(dfd))
      .fail(this.rejectF(dfd));

    return dfd.promise();
  }

  /**
   * @method create_and_send
   * @param {Object} cft
   * @param {String} cft.name Template name.
   * @param {String} cft.detail Template description.
   * @param {String} cft.value JSON template.
   * @param {Object} params
   *  Object key is parameter name.
   *  Object value is parameter value.
   * @return {$.Promise}
   */
  create_and_send(
    cft: {
      name:   string;
      detail: string;
      value:  string;
    },
    params: {
      [s: string]: string;
    }
  ): JQueryPromise<any> {
    var dfd = $.Deferred();

    var req = {cf_templates: {
      infrastructure_id: this.infra.id,
      name:              cft.name,
      detail:            cft.detail,
      value:             cft.value,
      cfparams:          params,
    }};

    (<any>CFTemplate.ajax).create_and_send(req)
      .done(this.resolveF(dfd))
      .fail(this.rejectF(dfd));

    return dfd.promise();
  }

  /**
   * @method history
   * @return {$.Promise}
   */
  history(): JQueryPromise<any> {
    var dfd = $.Deferred();

    (<any>CFTemplate.ajax).history({
      infrastructure_id: this.infra.id,
    }).done(this.resolveF(dfd))
      .fail(this.rejectF(dfd));

    return dfd.promise();
  }

  // TODO: DRY
  private resolveF(dfd: JQueryDeferred<any>) {
    return (data: any) => dfd.resolve(data);
  }

  private rejectF(dfd: JQueryDeferred<any>) {
    return (xhr: XMLHttpRequest) => dfd.reject(xhr.responseText);
  }
}

CFTemplate.ajax.add_collection('insert_cf_params', 'POST');
CFTemplate.ajax.add_collection('history', 'GET');
CFTemplate.ajax.add_collection('new_for_creating_stack', 'GET');
CFTemplate.ajax.add_collection('create_and_send', 'POST');
