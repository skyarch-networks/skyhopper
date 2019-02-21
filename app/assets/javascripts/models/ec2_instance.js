const ModelBase = require('./base').default;

const EC2Instance = class EC2Instance extends ModelBase {
  constructor(infra, physicalId) {
    super();
    this.infra = infra;
    this.physical_id = physicalId;
    this.params = { id: physicalId, infra_id: infra.id };
    this.ajax_node = new AjaxSet.Resources('nodes');
    this.ajax_ec2 = new AjaxSet.Resources('ec2_instances');
    this.ajax_servertest = new AjaxSet.Resources('servertests');
    this.ajax_elb = new AjaxSet.Resources('elb');
    this.ajax_node.add_member('cook', 'PUT');
    this.ajax_node.add_member('run_ansible_playbook', 'PUT');
    this.ajax_node.add_member('yum_update', 'PUT');
    this.ajax_node.add_member('run_bootstrap', 'GET');
    this.ajax_node.add_member('get_rules', 'GET');
    this.ajax_node.add_member('get_security_groups', 'GET');
    this.ajax_node.add_member('apply_dish', 'POST');
    this.ajax_node.add_member('submit_groups', 'POST');
    this.ajax_node.add_member('edit_attributes', 'GET');
    this.ajax_node.add_member('update_attributes', 'PUT');
    this.ajax_node.add_member('edit_ansible_playbook', 'GET');
    this.ajax_node.add_member('update_ansible_playbook', 'PUT');
    this.ajax_node.add_member('schedule_yum', 'POST');
    this.ajax_node.add_collection('recipes', 'GET');
    this.ajax_node.add_collection('create_group', 'POST');
    this.ajax_ec2.add_member('change_scale', 'POST');
    this.ajax_ec2.add_member('start', 'POST');
    this.ajax_ec2.add_member('stop', 'POST');
    this.ajax_ec2.add_member('reboot', 'POST');
    this.ajax_ec2.add_member('detach', 'POST');
    this.ajax_ec2.add_member('terminate', 'POST');
    this.ajax_ec2.add_member('serverspec_status', 'GET');
    this.ajax_ec2.add_member('register_to_elb', 'POST');
    this.ajax_ec2.add_member('deregister_from_elb', 'POST');
    this.ajax_ec2.add_member('elb_submit_groups', 'POST');
    this.ajax_ec2.add_member('attachable_volumes', 'GET');
    this.ajax_ec2.add_member('attach_volume', 'POST');
    this.ajax_ec2.add_member('detach_volume', 'POST');
    this.ajax_ec2.add_member('available_resources', 'GET');
    this.ajax_ec2.add_collection('create_volume', 'POST');
    this.ajax_servertest.add_collection('select', 'GET');
    this.ajax_servertest.add_collection('results', 'GET');
    this.ajax_servertest.add_collection('run_serverspec', 'POST');
    this.ajax_servertest.add_collection('schedule', 'POST');
    this.ajax_elb.add_collection('create_listener', 'POST');
    this.ajax_elb.add_collection('delete_listener', 'POST');
    this.ajax_elb.add_collection('update_listener', 'POST');
    this.ajax_elb.add_collection('upload_server_certificate', 'POST');
    this.ajax_elb.add_collection('delete_server_certificate', 'POST');
  }

  show() {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_node.show(self.params),
    );
  }

  update(runlist) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_node.update(Object.assign({}, self.params, { runlist })),
    );
  }

  bootstrap() {
    const self = this;
    const dfd = $.Deferred();
    self.ajax_node.run_bootstrap(this.params)
      .done(() => {
        const ws = ws_connector('bootstrap', self.physical_id);
        ws.onmessage = (msg) => {
          ws.close();
          const wsdata = JSON.parse(msg.data);
          if (wsdata.status) {
            dfd.resolve(wsdata.message);
          } else {
            dfd.reject(wsdata.message);
          }
        };
      })
      .fail(this.rejectF(dfd));
    return dfd.promise();
  }

  watch_cook(dfd) {
    const ws = ws_connector('cooks', this.physical_id);
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data).v;
      if (typeof (data) === 'boolean') {
        ws.close();
        dfd.resolve(data);
      } else {
        dfd.notify('update', data, '\n');
      }
    };
    return dfd;
  }

  _cook(methodName, params) {
    const self = this;
    const dfd = $.Deferred();
    self.ajax_node[methodName](params)
      .done((data) => {
        dfd.notify('start', data);
        self.watch_cook(dfd);
      })
      .fail(this.rejectF(dfd));
    return dfd.promise();
  }

  cook(params) {
    return this._cook('cook', Object.assign({}, this.params, params));
  }

  watch_run_ansible_playbook(dfd) {
    const ws = ws_connector('run-ansible-playbook', this.physical_id);
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data).v;
      if (typeof data === 'boolean') {
        ws.close();
        dfd.resolve(data);
      } else {
        dfd.notify('update', `${data}\n`);
      }
    };
    return dfd;
  }

  run_ansible_playbook() {
    const self = this;
    const dfd = $.Deferred();
    this.ajax_node.run_ansible_playbook(self.params)
      .done((data) => {
        dfd.notify('start', data);
        self.watch_run_ansible_playbook(dfd);
      })
      .fail(this.rejectF(dfd));
    return dfd.promise();
  }

  yum_update(security, exec) {
    const extraParams = {
      security: security ? 'security' : 'all',
      exec: exec ? 'exec' : 'check',
    };
    const params = Object.assign({}, this.params, extraParams);
    return this._cook('yum_update', params);
  }

  edit_ansible_playbook() {
    const self = this;
    return this.WrapAndResolveReject(
      () => this.ajax_node.edit_ansible_playbook(self.params),
    );
  }

  update_ansible_playbook(playbookRoles, extraVars) {
    const self = this;
    return this.WrapAndResolveReject(
      () => this.ajax_node.update_ansible_playbook(
        Object.assign({}, self.params, {
          playbook_roles: playbookRoles,
          extra_vars: extraVars,
        }),
      ),
    );
  }

  apply_dish(dishId) {
    const self = this;
    const params = Object.assign({}, this.params, dishId ? { dishId } : {});
    return this.WrapAndResolveReject(
      () => self.ajax_node.apply_dish(params),
    );
  }

  submit_groups(groupIds) {
    const self = this;
    const params = Object.assign({}, this.params, groupIds ? { groupIds } : {});
    return this.WrapAndResolveReject(
      () => self.ajax_node.submit_groups(params),
    );
  }

  create_group(groupParams) {
    const self = this;
    const params = Object.assign({}, this.params, groupParams ? { groupParams } : {});
    return this.WrapAndResolveReject(
      () => self.ajax_node.create_group(params),
    );
  }

  get_rules(groupIds) {
    const self = this;
    const params = Object.assign({}, this.params, groupIds ? { groupIds } : []);
    return this.WrapAndResolveReject(
      () => self.ajax_node.get_rules(params),
    );
  }

  get_security_groups() {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_node.get_security_groups(self.params),
    );
  }

  edit() {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_node.edit(self.params),
    );
  }

  edit_attributes() {
    const self = this;
    const dfd = $.Deferred();
    self.ajax_node.edit_attributes(this.params)
      .done((data) => {
        Object.entries(data).forEach((keyAndVal) => {
          const val = keyAndVal[1];
          val.input_type = val.type === 'Boolean' ? 'checkbox' : 'text';
        });
        dfd.resolve(data);
      })
      .fail(this.rejectF(dfd));
    return dfd.promise();
  }

  update_attributes() {
    const self = this;
    const req = {};
    Object.entries().forEach((v, key) => {
      req[key] = v.value;
    });
    return this.WrapAndResolveReject(
      () => self.ajax_node.update_attributes(Object.assign({}, self.params,
        { attributes: JSON.stringify(req) })),
    );
  }

  schedule_yum(schedule) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_node.schedule_yum(Object.assign({}, self.params, {
        physical_id: self.physical_id,
        infra_id: self.infra.id,
        schedule,
      })),
    );
  }

  attachable_volumes(availabilityZone) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_ec2.attachable_volumes(Object.assign({}, self.params, {
        availability_zone: availabilityZone,
      })),
    );
  }

  attach_volume(volumeId, deviceName) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_ec2.attach_volume(Object.assign({}, self.params, {
        volume_id: volumeId,
        device_name: deviceName,
      })),
    );
  }

  detach_volume(volumeId) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_ec2.detach_volume(Object.assign({}, self.params, {
        volume_id: volumeId,
      })),
    );
  }

  recipes(cookbook) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_node.recipes({ cookbook }),
    );
  }

  select_serverspec() {
    const self = this;
    const dfd = $.Deferred();
    self.ajax_servertest.select({
      physical_id: this.physical_id,
      infra_id: this.infra.id,
    }).done((data) => {
      data.globals.forEach((s) => {
        // eslint-disable-next-line no-param-reassign
        s.checked = Array.include(data.selected_ids, s.id);
      });
      data.individuals.forEach((s) => {
        // eslint-disable-next-line no-param-reassign
        s.checked = false;
      });
      dfd.resolve(data);
    }).fail(this.rejectF(dfd));
    return dfd.promise();
  }

  results_servertest() {
    const self = this;
    const dfd = $.Deferred();
    self.ajax_servertest.results({
      physical_id: this.physical_id,
      infra_id: this.infra.id,
    }).done((data) => {
      dfd.resolve(data);
    }).fail(this.rejectF(dfd));
    return dfd.promise();
  }

  run_serverspec(specs, auto) {
    const self = this;
    const ids = specs.filter(
      v => v.checked,
    ).map(v => v.id);
    if (auto) {
      ids.push(-1);
    }
    return this.WrapAndResolveReject(
      () => self.ajax_servertest.run_serverspec({
        physical_id: self.physical_id,
        infra_id: self.infra.id,
        servertest_ids: ids,
      }),
    );
  }

  schedule_serverspec(schedule) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_servertest.schedule({
        physical_id: self.physical_id,
        infra_id: self.infra.id,
        schedule,
      }),
    );
  }

  change_scale(type) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_ec2.change_scale(Object.assign({}, self.params, { instance_type: type })),
    );
  }

  wait_change_status_ec2(dfd) {
    const self = this;
    return () => {
      const ws = ws_connector('ec2_status', self.physical_id);
      ws.onmessage = (msg) => {
        const d = JSON.parse(msg.data);
        if (d.error) {
          dfd.reject(d.error.message);
        } else {
          dfd.resolve(d.msg);
        }
        ws.close();
      };
    };
  }

  available_resources() {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_ec2.available_resources({ infra_id: self.params.infra_id }),
    );
  }

  start_ec2() {
    const dfd = $.Deferred();
    this.ajax_ec2.start(this.params)
      .done(this.wait_change_status_ec2(dfd))
      .fail(this.rejectF(dfd));
    return dfd.promise();
  }

  stop_ec2() {
    const dfd = $.Deferred();
    this.ajax_ec2.stop(this.params)
      .done(this.wait_change_status_ec2(dfd))
      .fail(this.rejectF(dfd));
    return dfd.promise();
  }

  detach_ec2(zabbix, chef) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_ec2.detach(Object.assign({}, { zabbix, chef }, self.params)),
    );
  }

  terminate_ec2() {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_ec2.terminate(self.params),
    );
  }

  reboot_ec2() {
    const dfd = $.Deferred();
    this.ajax_ec2.reboot(this.params)
      .fail(this.rejectF(dfd));
    return dfd.promise();
  }

  serverspec_status() {
    const dfd = $.Deferred();
    this.ajax_ec2.serverspec_status(this.params)
      .done((data) => {
        dfd.resolve(data.status);
      }).fail(this.rejectF(dfd));
    return dfd.promise();
  }

  register(elbName) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_ec2.register_to_elb(Object.assign({}, self.params, { elb_name: elbName })),
    );
  }

  deregister(elbName) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_ec2.deregister_from_elb(
        Object.assign({}, self.params, { elb_name: elbName }),
      ),
    );
  }

  elb_submit_groups(groupIds, elbName) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_ec2.elb_submit_groups(
        Object.assign({}, self.params, { group_ids: groupIds, elb_name: elbName }),
      ),
    );
  }

  create_listener(
    elbName, protocol, loadBalancerPort, instanceProtocol, instancePort, sslCertificateId,
  ) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_elb.create_listener(Object.assign({}, self.params, {
        elb_name: elbName,
        elb_listener_protocol: protocol,
        elb_listener_load_balancer_port: loadBalancerPort,
        elb_listener_instance_protocol: instanceProtocol,
        elb_listener_instance_port: instancePort,
        elb_listener_ssl_certificate_id: sslCertificateId,
      })),
    );
  }

  delete_listener(elbName, loadBalancerPort) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_elb.delete_listener(
        Object.assign({}, self.params, {
          elb_name: elbName, elb_listener_load_balancer_port: loadBalancerPort,
        }),
      ),
    );
  }

  update_listener(
    elbName, protocol, oldLoadBalancerPort, loadBalancerPort,
    instanceProtocol, instancePort, sslCertificateId,
  ) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_elb.update_listener(Object.assign({}, self.params, {
        elb_name: elbName,
        elb_listener_protocol: protocol,
        elb_listener_old_load_balancer_port: oldLoadBalancerPort,
        elb_listener_load_balancer_port: loadBalancerPort,
        elb_listener_instance_protocol: instanceProtocol,
        elb_listener_instance_port: instancePort,
        elb_listener_ssl_certificate_id: sslCertificateId,
      })),
    );
  }

  upload_server_certificate(
    elbName, serverCertificateName, certificateBody, privateKey, certificateChain,
  ) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_elb.upload_server_certificate(Object.assign({}, self.params, {
        elb_name: elbName,
        ss_server_certificate_name: serverCertificateName,
        ss_certificate_body: certificateBody,
        ss_private_key: privateKey,
        ss_certificate_chain: certificateChain,
      })),
    );
  }

  delete_server_certificate(elbName, serverCertificateName) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_elb.delete_server_certificate(
        Object.assign(
          {}, self.params, {
            elb_name: elbName, ss_server_certificate_name: serverCertificateName,
          },
        ),
      ),
    );
  }

  create_volume(options) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_ec2.create_volume(Object.assign({}, self.params, options)),
    );
  }
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = EC2Instance;
