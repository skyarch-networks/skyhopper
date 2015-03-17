var EC2Instance = function (infra, physical_id) {
  "use strict";

  var self = this;



  var ajax_node = new AjaxSet.Resources('nodes');
  ajax_node.add_member('cook', 'PUT');
  ajax_node.add_member('yum_update', 'PUT');
  ajax_node.add_member('run_bootstrap', 'GET');
  ajax_node.add_member('apply_dish', 'POST');
  ajax_node.add_member('edit_attributes', 'GET');
  ajax_node.add_member('update_attributes', 'PUT');
  ajax_node.add_collection('recipes', 'GET');

  var ajax_ec2 = new AjaxSet.Resources('ec2_instances');
  ajax_ec2.add_member('change_scale', 'POST');
  ajax_ec2.add_member("start", "POST");
  ajax_ec2.add_member("stop", "POST");
  ajax_ec2.add_member("reboot", "POST");
  ajax_ec2.add_member('serverspec_status', 'GET');
  ajax_ec2.add_member('register_to_elb', 'POST');
  ajax_ec2.add_member('deregister_from_elb', 'POST');

  var ajax_serverspec = new AjaxSet.Resources('serverspecs');
  ajax_serverspec.add_collection('select', 'GET');
  ajax_serverspec.add_collection("run", "POST");


  var rejectXHR = function (dfd) {
    return function (xhr) {
      dfd.reject(xhr.responseText);
    };
  };

  var params = {id: physical_id, infra_id: infra.id};


  this.show = function () {
    var dfd = $.Deferred();

    ajax_node.show(params).done(function (data, status, xhr) {
      dfd.resolve(data);
    }).fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.update = function (runlist) {
    var dfd = $.Deferred();

    ajax_node.update(
      _.merge(params, {runlist: runlist})
    ).done(function (data) {
      dfd.resolve(data);
    }).fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.bootstrap = function () {
    var dfd = $.Deferred();

    ajax_node.run_bootstrap(params).done(function (data, status, xhr) {
      var ws = ws_connector('bootstrap', physical_id);
      ws.onmessage = function (msg) {
        ws.close();

        var data = JSON.parse(msg.data);
        if (data.status) {
          dfd.resolve(data.message);
        } else {
          dfd.reject(data.message);
        }
      };
    }).fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.watch_cook = function (dfd) {
    var ws = ws_connector('cooks', physical_id);
    ws.onmessage = function (msg) {
      var data = JSON.parse(msg.data).v;
      if (typeof(data) === 'boolean') {
        // cook 終了
        // data が true ならば正常終了、false ならば異常終了
        ws.close();
        dfd.resolve(data);
      } else {
        dfd.notify('update', data + "\n");
      }
    };
    return dfd;
  };

  var _cook = function (method_name, dish_id) {
    var p = params;
    if (dish_id) {
      p = _.merge(p, {dish_id: dish_id});
    }

    var dfd = $.Deferred();

    ajax_node[method_name](p).done(function (data) {
      dfd.notify('start', data);
      self.watch_cook(dfd);
    }).fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.cook = function () {
    return _cook('cook');
  };

  this.yum_update = function (security, exec) {
    var extra_params = {
      security: "security",
      exec: "check"
    };
    if (!security) {
      extra_params.security = "all";
    }
    if (exec) {
      extra_params.exec = "exec";
    }
    var p = _.merge(params, extra_params);

    var dfd = $.Deferred();

    ajax_node.yum_update(p).done(function (data) {
      dfd.notify('start', data);
      self.watch_cook(dfd);
    }).fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.apply_dish = function (dish_id) {
    return _cook('apply_dish', dish_id);
  };

  this.edit = function () {
    var dfd = $.Deferred();

    ajax_node.edit(params).done(function (data) {
      dfd.resolve(data);
    }).fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.edit_attributes = function () {
    var dfd = $.Deferred();
    ajax_node.edit_attributes(params).done(function (data) {
      _.forEach(data, function (val, key) {
        if (val.type === 'Boolean') {
          val.input_type = 'checkbox';
        } else {
          val.input_type = 'text';
        }
      });
      dfd.resolve(data);
    }).fail(rejectXHR(dfd));
    return dfd.promise();
  };

  this.update_attributes = function (attributes) {
    var dfd = $.Deferred();
    var req = {};
    _.forEach(attributes, function (v, key) {
      req[key] = v.value;
    });

    ajax_node.update_attributes(
      _.merge(params, {attributes: JSON.stringify(req)})
    ).done(function (msg) {
      dfd.resolve(msg);
    }).fail(rejectXHR(dfd));
    return dfd.promise();
  };

  this.recipes = function (cookbook) {
    var dfd = $.Deferred();

    ajax_node.recipes({
      cookbook: cookbook,
    }).done(function (data) {
      dfd.resolve(data);
    }).fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.select_serverspec = function () {
    var dfd = $.Deferred();

    ajax_serverspec.select({
      physical_id: physical_id,
      infra_id:    infra.id,
    }).done(function (data) {
      _.forEach(data.globals, function (s) {
        s.checked = _.include(data.selected_ids, s.id);
      });
      _.forEach(data.individuals, function (s) {
        s.checked = false;
      });
      dfd.resolve(data);
    }).fail(rejectXHR(dfd));
    return dfd.promise();
  };

  this.run_serverspec = function (specs, auto) {
    var dfd = $.Deferred();
    var ids = _(specs).filter(function (v) {
      return v.checked;
    }).pluck('id').value();

    if (auto) {
      ids.push(-1);
    }

    ajax_serverspec.run({
      physical_id: physical_id,
      infra_id: infra.id,
      serverspec_ids: ids,
    }).done(function (msg) {
      dfd.resolve(msg);
    }).fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.change_scale = function (type) {
    var dfd = $.Deferred();

    ajax_ec2.change_scale(_.merge(params, {instance_type: type}))
      .done(dfd.resolve)
      .fail(rejectXHR(dfd));

    return dfd.promise();
  };


  // ec2 のステータス変更をWebSocketで待ち受けて、dfdをrejectかresolveする function を返す
  // ==== Args
  // [dfd] Deferred
  // [physical_id] String
  // ==== Return
  // function()
  var wait_change_status = function (dfd) {
    return function () {
      var ws = ws_connector('ec2_status', physical_id);
      ws.onmessage = function (msg) {
        var d = JSON.parse(msg.data);
        if (d.error) {
          dfd.reject(d.error);
        } else {
          dfd.resolve(d.msg);
        }
        ws.close();
      };
    };
  };

  this.start_ec2 = function () {
    var dfd = $.Deferred();

    ajax_ec2.start(params)
      .done(wait_change_status(dfd))
      .fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.stop_ec2 = function () {
    var dfd = $.Deferred();

    ajax_ec2.stop(params)
      .done(wait_change_status(dfd))
      .fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.reboot_ec2 = function () {
    var dfd = $.Deferred();
    ajax_ec2.reboot(params)
      .fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.serverspec_status = function () {
    var dfd = $.Deferred();

    ajax_ec2.serverspec_status(params)
      .done(function (data) {
        dfd.resolve(data.status);
      })
      .fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.register = function (elb_name) {
    var dfd = $.Deferred();

    ajax_ec2.register_to_elb(_.merge(params, {elb_name: elb_name}))
      .done(dfd.resolve)
      .fail(rejectXHR(dfd));

    return dfd.promise();
  };

  this.deregister = function (elb_name) {
    var dfd = $.Deferred();

    ajax_ec2.deregister_from_elb(_.merge(params, {elb_name: elb_name}))
      .done(dfd.resolve)
      .fail(rejectXHR(dfd));

    return dfd.promise();
  };
};
