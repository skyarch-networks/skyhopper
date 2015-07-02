var Monitoring = function (infra) {
  "use strict";

  var self = this;



  var ajax_monitoring = new AjaxSet.Resources('monitorings');
  ajax_monitoring.add_member('create_host',  'POST');
  ajax_monitoring.add_member("show_cloudwatch_graph", "GET");
  ajax_monitoring.add_member("show_problems", "GET");
  ajax_monitoring.add_member("show_url_status", "GET");
  ajax_monitoring.add_collection("show_zabbix_graph", "GET");


  var rejectXHR = function (dfd) {
    return function (xhr) {
      dfd.reject(xhr.responseText);
    };
  };

  this.type = function (master) {
    if (master.name === 'URL') {
      return 'url';
    } else if (master.name === 'MySQL') {
      return 'mysql';
    } else if (master.name === 'PostgreSQL') {
      return 'postgresql';
    } else if (master.name === "HTTP" || master.name === "SMTP" || master.name === "BASICS") {
      return 'no_trigger';
    }
    return 'trigger';
  };


  // ------------------  ajax methods

  this.create_host = function () {
    var dfd = $.Deferred();

    ajax_monitoring.create_host({id: infra.id})
      .done(dfd.resolve)
      .fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.edit = function () {
    var dfd = $.Deferred();

    ajax_monitoring.edit({id: infra.id}).done(function (data) {
      _.forEach(data.master_monitorings, function (m) {
        var selected = !!_.find(data.selected_monitoring_ids, function (id) {
          return id === m.id;
        });
        m.checked = selected;

        var expr;
        if (self.type(m) === 'trigger') {
          expr = data.trigger_expressions[m.item];
          var v = parseInt(expr.replace(m.trigger_expression, '').replace(/[A-Z]/, ''));
          m.value = v;
        } else if (self.type(m) === 'mysql') {
          var re = /^mysql.login\[(.+)\]/;
          var key = _.findKey(data.trigger_expressions, function (_, key) {return re.test(key);});
          m.value = key.match(re)[1];
        }
      });
      if (!data.web_scenarios) {
        data.web_scenarios = [];
      }
      dfd.resolve(data);
    }).fail(function (xhr) {
      dfd.reject(xhr);
    });

    return dfd.promise();
  };

  this.show = function () {
    var dfd = $.Deferred();

    ajax_monitoring.show({id: infra.id})
      .done(dfd.resolve)
      .fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.update = function (master_monitorings, web_scenario) {
    var dfd = $.Deferred();

    var selected_monitorings = _.filter(master_monitorings, function (m) {
      return m.checked;
    });

    var exprs = [];
    var host_mysql = {};
    var host_postgresql = {};
    _.each(selected_monitorings, function (m) {
      if (self.type(m) === 'trigger') {
        exprs.push([m.id, m.value]);
      } else if (self.type(m) === 'mysql') {
        host_mysql.id   = m.id;
        host_mysql.host = m.value || null;
      } else if (self.type(m) === 'postgresql'){
        host_postgresql.id   = m.id;
        host_postgresql.host = m.value || null;
      }
    });

    var ids   = _.pluck(selected_monitorings, 'id');

    ajax_monitoring.update({
      id: infra.id,
      web_scenario:     JSON.stringify(web_scenario || []),
      monitoring_ids:   ids,
      expressions:      JSON.stringify(exprs),
      host_mysql:       JSON.stringify(host_mysql),
      host_postgresql:  JSON.stringify(host_postgresql)
    }).done(dfd.resolve)
      .fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.show_problems = function () {
    var dfd = $.Deferred();

    ajax_monitoring.show_problems({
      id: infra.id
    }).done(function (data) {
      dfd.resolve(data.reverse());
    }).fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.show_url = function () {
    var dfd = $.Deferred();

    ajax_monitoring.show_url_status({
      id: infra.id,
    }).done(dfd.resolve).fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.show_zabbix_graph = function (physical_id, item_key) {
    var dfd = $.Deferred();

    ajax_monitoring.show_zabbix_graph({
      physical_id: physical_id,
      item_key:    item_key,
      id:          infra.id,
    }).done(dfd.resolve).fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.show_cloudwatch_graph = function (physical_id) {
    var dfd = $.Deferred();

    ajax_monitoring.show_cloudwatch_graph({
      id: infra.id,
      physical_id: physical_id,
    }).done(dfd.resolve).fail(rejectXHR(dfd));

    return dfd.promise();
  };
};
