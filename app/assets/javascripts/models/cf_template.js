const ModelBase = require('./base').default;

const CFTemplate = class CFTemplate extends ModelBase {
  constructor(infra) {
    super();
    this.infra = infra;
    this.ajax = new AjaxSet.Resources('cf_templates');
    this.ajax.add_collection('insert_cf_params', 'POST');
    this.ajax.add_collection('history', 'GET');
    this.ajax.add_collection('new_for_creating_stack', 'GET');
    this.ajax.add_collection('create_and_send', 'POST');
  }

  new() {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax.new_for_creating_stack({
        infrastructure_id: self.infra.id,
      }),
    );
  }

  show(id) {
    return this.WrapAndResolveReject(
      () => $.ajax({
        url: `/cf_templates/${id}`,
        dataType: 'json',
      }),
    );
  }

  insert_cf_params(data) {
    const self = this;
    return this.WrapAndResolveReject((dfd) => {
      if (data.name === '') {
        dfd.reject(t('infrastructures.msg.empty_subject'));
      }
      const req = {
        cf_template: {
          name: data.name,
          detail: data.detail,
          value: data.value,
          format: data.format,
          params: data.params,
          infrastructure_id: self.infra.id,
        },
      };
      return self.ajax.insert_cf_params(req);
    });
  }

  create_and_send(cft, params) {
    const self = this;
    return this.WrapAndResolveReject(() => {
      const req = {
        cf_template: {
          infrastructure_id: self.infra.id,
          name: cft.name,
          detail: cft.detail,
          value: cft.value,
          format: cft.format,
          cfparams: params,
        },
      };
      return self.ajax.create_and_send(req);
    });
  }

  history() {
    const self = this;
    return this.WrapAndResolveReject(
      () => self.ajax.history({ infrastructure_id: self.infra.id }),
    );
  }
};

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = CFTemplate;
