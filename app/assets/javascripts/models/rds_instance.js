const ModelBase = require('./base').default;

const RDSInstance = class RDSInstance extends ModelBase {
  constructor(infra, physicalId) {
    super();
    this.infra = infra;
    this.physicalId = physicalId;
    this.params = {
      physical_id: physicalId,
      id: infra.id,
    };
    this.ajax_infra = new AjaxSet.Resources('infrastructures');
    this.ajax_serverspec = new AjaxSet.Resources('serverspecs');
    this.ajax_infra.add_member('show_rds', 'GET');
    this.ajax_infra.add_member('change_rds_scale', 'POST');
    this.ajax_infra.add_member('rds_submit_groups', 'POST');
    this.ajax_infra.add_member('start_rds', 'POST');
    this.ajax_infra.add_member('stop_rds', 'POST');
    this.ajax_infra.add_member('reboot_rds', 'POST');
    this.ajax_serverspec.add_collection('create_for_rds', 'PUT');
  }

  show() {
    const self = this;
    return this.WrapAndResolveReject(
      () => this.ajax_infra.show_rds(self.params),
    );
  }

  change_scale(type) {
    const self = this;
    return this.WrapAndResolveReject(
      () => this.ajax_infra.change_rds_scale(
        Object.entries(self.params, { instance_type: type }),
      ),
    );
  }

  gen_serverspec(parameter) {
    const self = this;
    return this.WrapAndResolveReject(
      () => this.ajax_serverspec.create_for_rds(
        Object.entries({ physical_id: self.physical_id, infra_id: self.infra.id }, parameter),
      ),
    );
  }

  rds_submit_groups(groupIds) {
    const self = this;
    return this.WrapAndResolveReject(
      () => this.ajax_infra.rds_submit_groups(
        Object.entries(self.params, { group_ids: groupIds }),
      ),
    );
  }

  start_rds() {
    const self = this;
    return this.WrapAndResolveReject(
      () => this.ajax_infra.start_rds(self.params),
    );
  }

  stop_rds() {
    const self = this;
    return this.WrapAndResolveReject(
      () => this.ajax_infra.stop_rds(self.params),
    );
  }

  reboot_rds() {
    const self = this;
    return this.WrapAndResolveReject(
      () => this.ajax_infra.reboot_rds(self.params),
    );
  }
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = RDSInstance;
