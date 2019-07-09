const ModelBase = require('./base').default;

const Infrastructure = class Infrastructure extends ModelBase {
  constructor(id) {
    super();
    this.id = id;
    this.ajax_infra = new AjaxSet.Resources('infrastructures');
    this.ajax_resource = new AjaxSet.Resources('resources');
    this.ajax_infra.add_member('delete_stack', 'POST');
    this.ajax_infra.add_member('download_log', 'POST');
    this.ajax_infra.add_member('download_logs', 'POST');
    this.ajax_infra.add_member('save_schedule', 'POST');
    this.ajax_infra.add_member('stack_events', 'GET');
    this.ajax_infra.add_member('get_schedule', 'GET');
    this.ajax_infra.add_member('show_elb', 'GET');
  }

  show() {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_infra.show({ id: self.id }),
    );
  }

  detach() {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_infra.destroy({ id: self.id }),
    );
  }

  delete_stack() {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_infra.delete_stack({ id: self.id }),
    );
  }

  stack_events() {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_infra.stack_events({ id: self.id }),
    );
  }

  logs(_page, sortKey, order) {
    let page = _page;
    if (page === undefined) {
      page = 1;
    }
    const data = {
      infrastructure_id: this.id,
      page,
    };
    if (sortKey !== undefined) {
      data.sort_key = sortKey;
    }
    if (order !== undefined) {
      data.order = order;
    }
    return this.WrapAndResolveReject(
      () => $.ajax({
        url: '/infrastructure_logs',
        data,
      }),
    );
  }

  download_log(infrastructureLogId) {
    const url = `/infrastructure_logs/${infrastructureLogId}/download`;
    window.open(url, '_blank');
  }

  download_logs() {
    const url = `/infrastructure_logs/download_all?infrastructure_id=${this.id}`;
    window.open(url, '_blank');
  }

  get_schedule(physicalId) {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax_infra.get_schedule({
        infra_id: self.id,
        physical_id: physicalId,
      }),
    );
  }

  show_elb(physicalId) {
    const self = this;
    return this.WrapAndResolveReject(() => self.ajax_infra.show_elb({
      id: self.id,
      physical_id: physicalId,
    }));
  }

  save_schedule(physicalId, _selInstance) {
    const self = this;
    let selInstance = _selInstance;
    if (selInstance === undefined) {
      selInstance = [];
    }
    return this.WrapAndResolveReject(
      () => self.ajax_infra.save_schedule({
        physical_id: physicalId,
        selected_instance: selInstance,
      }),
    );
  }
};

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = Infrastructure;
