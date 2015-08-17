/// <reference path="../../declares.d.ts" />
/// <reference path="infrastructure.ts" />

class CFTemplate extends ModelBase {
  constructor(private infra: Infrastructure) {super(); }

  static ajax = new AjaxSet.Resources('cf_templates');

  /**
   * @method new
   * @return {$.Promise}
   */
  new(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>CFTemplate.ajax).new_for_creating_stack({
        infrastructure_id: this.infra.id,
      })
    );
  }

  /**
   * @method show
   * @param {Number} id
   * @return {$.Promise}
   */
  show(id: number): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      $.ajax({
        url: '/cf_templates/' + id,
        dataType: 'json',
      })
    );
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
    return this.WrapAndResolveReject((dfd) => {
      if (data.name === "") {
        dfd.reject(t('infrastructures.msg.empty_subject'));
      }

      const req = {cf_template: {
        name:              data.name,
        detail:            data.detail,
        value:             data.value,
        params:            data.params,
        infrastructure_id: this.infra.id,
      }};

      return (<any>CFTemplate.ajax).insert_cf_params(req);
    });
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
    return this.WrapAndResolveReject(() => {
      const req = {cf_template: {
        infrastructure_id: this.infra.id,
        name:              cft.name,
        detail:            cft.detail,
        value:             cft.value,
        cfparams:          params,
      }};

      return (<any>CFTemplate.ajax).create_and_send(req);
    });
  }

  /**
   * @method history
   * @return {$.Promise}
   */
  history(): JQueryPromise<any> {
    return this.WrapAndResolveReject(() =>
      (<any>CFTemplate.ajax).history({infrastructure_id: this.infra.id})
    );
  }
}

CFTemplate.ajax.add_collection('insert_cf_params', 'POST');
CFTemplate.ajax.add_collection('history', 'GET');
CFTemplate.ajax.add_collection('new_for_creating_stack', 'GET');
CFTemplate.ajax.add_collection('create_and_send', 'POST');
