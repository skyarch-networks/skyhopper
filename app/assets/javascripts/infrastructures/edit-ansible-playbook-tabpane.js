const Infrastructure = require('models/infrastructure').default;
const EC2Instance = require('models/ec2_instance').default;

const helpers = require('infrastructures/helper.js');

const alert_success = helpers.alert_success;
const alert_danger = helpers.alert_danger;

module.exports = Vue.extend({
  template: '#edit-ansible-playbook-tabpane-template',

  props: {
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data() {
    return {
      loading: false,
      selected_roles: [],
      playbook_roles: null,
      selected_playbook_roles: [],
      roles: null,
      extra_vars: null,
    };
  },

  methods: {
    update() {
      const self = this;

      try {
        JSON.parse(self.extra_vars);
      } catch (ex) {
        alert_danger()(`extra-vars is invalid: ${ex.message}`);
        return;
      }

      self.loading = true;
      self.ec2.update_ansible_playbook(self.playbook_roles, self.extra_vars)
        .done(alert_success(self.show_ec2))
        .fail(alert_danger(self.show_ec2));
    },

    show_ec2() { this.$parent.show_ec2(this.physical_id); },

    add_role() {
      const self = this;
      _.forEach(self.selected_roles, (role) => {
        self._add(role);
      });
    },

    _add(run) {
      if (_.include(this.playbook_roles, run)) { return; }
      this.playbook_roles.push(run);
    },

    del() {
      this.playbook_roles = _.difference(this.playbook_roles, this.selected_playbook_roles);
    },

    up() {
      const self = this;
      _.forEach(this.selected_playbook_roles, (v) => {
        const idx = _.indexOf(self.playbook_roles, v);
        self._swap(idx, idx - 1);
      });
    },

    down() {
      const self = this;
      // XXX: 複数個選択した時にうまく動いてない気がする
      _(self.selected_playbook_roles).reverse().forEach((v) => {
        const idx = _.indexOf(self.playbook_roles, v);
        self._swap(idx, idx + 1);
      }).value();
    },

    _swap(from, to) {
      const m = this.playbook_roles.length - 1;
      if (from < 0 || m < from || to < 0 || m < to) {
        return;
      }
      const r = _.clone(this.playbook_roles);
      r[to] = this.playbook_roles[from];
      r[from] = this.playbook_roles[to];
      this.playbook_roles = r;
    },
  },

  computed: {
    physical_id() { return this.$parent.tabpaneGroupID; },
    ec2() { return new EC2Instance(new Infrastructure(this.infra_id), this.physical_id); },
  },
  created() {
    const self = this;
    console.log(self);

    self.ec2.edit_ansible_playbook().done((data) => {
      self.playbook_roles = data.playbook_roles;
      self.roles = data.roles;
      self.extra_vars = data.extra_vars;
      self.$parent.loading = false;
    }).fail(alert_danger(self.show_ec2));
  },
});
