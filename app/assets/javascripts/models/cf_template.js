/**
 * @class CFTemplate
 * @constructor
 */
var CFTemplate = function (infra) {
  'use strict';

  var ajax_cf_template = new AjaxSet.Resources('cf_templates');
  ajax_cf_template.add_collection('insert_cf_params', 'POST');
  ajax_cf_template.add_collection('history', 'GET');
  ajax_cf_template.add_collection('new_for_creating_stack', 'GET');
  ajax_cf_template.add_collection('create_and_send', 'POST');

  /**
   * @method new
   * @return {$.Promise}
   */
  this.new = function () {
    var dfd = $.Deferred();

    ajax_cf_template.new_for_creating_stack({
      infrastructure_id: infra.id
    }).done(function (data, status, xhr) {
      dfd.resolve(data);
    }).fail(function (xhr) {
      dfd.reject(xhr.responseText);
    });

    return dfd.promise();
  };

  /**
   * @method show
   * @param {Number} id
   * @return {$.Promise}
   */
  this.show = function (id) {
    var dfd = $.Deferred();

    $.ajax({
      url: '/cf_templates/' + id,
      dataType: "json",
    }).done(function (data, status, xhr) {
      dfd.resolve(data);
    }).fail(function (xhr) {
      dfd.reject(xhr.responseText);
    });
    return dfd.promise();
  };

  /**
   * @method insert_cf_params
   * @param {Object} data
   * @return {$.Promise}
   */
  this.insert_cf_params = function (data) {
    var dfd = $.Deferred();

    if (data.name === "") {
      dfd.reject(t('infrastructures.msg.empty_subject'));
    }

    var req = {cf_template: {
      name:              data.name,
      detail:            data.detail,
      value:             data.value,
      params:            data.params,
      infrastructure_id: infra.id,
    }};

    ajax_cf_template.insert_cf_params(req).done(function (data, status, xhr) {
      dfd.resolve(data);
    }).fail(function (xhr) {
      dfd.reject(xhr.responseText);
    });

    return dfd.promise();
  };

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
  this.create_and_send = function (cft, params) {
    var dfd = $.Deferred();

    ajax_cf_template.create_and_send({
      cf_template: {
        infrastructure_id: infra.id,
        name:              cft.name,
        detail:            cft.detail,
        value:             cft.value,
        cfparams:          params,
      }
    }).done(function (data, status, xhr) {
      dfd.resolve(data);
    }).fail(function (xhr) {
      dfd.reject(xhr.responseText);
    });

    return dfd.promise();
  };


  /**
   * @method history
   * @return {$.Promise}
   */
  this.history = function () {
    var dfd = $.Deferred();

    ajax_cf_template.history({
      infrastructure_id: infra.id
    }).done(function (data, status, xhr) {
      dfd.resolve(data);
    }).fail(function (xhr) {
      dfd.reject(xhr.responseText);
    });

    return dfd.promise();
  };

};
