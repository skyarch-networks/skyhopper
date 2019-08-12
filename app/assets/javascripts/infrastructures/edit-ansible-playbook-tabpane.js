const Infrastructure = require('../models/infrastructure').default;
const EC2Instance = require('../models/ec2_instance').default;
const helpers = require('../infrastructures/helper.js');

const alertSuccess = helpers.alert_success;
const alertDanger = helpers.alert_danger;

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
        alertDanger()(`extra-vars is invalid: ${ex.message}`);
        return;
      }

      self.loading = true;
      self.ec2.update_ansible_playbook(self.playbook_roles, self.extra_vars)
        .done(alertSuccess(self.show_ec2))
        .fail(alertDanger(self.show_ec2));
    },

    show_ec2() { this.$parent.show_ec2(this.physical_id); },

    add_role() {
      this.selected_roles.forEach((role) => { this._add(role); });
    },

    _add(run) {
      if (this.playbook_roles.includes(run)) { return; }
      this.playbook_roles.push(run);
    },

    del() {
      this.playbook_roles = this.playbook_roles.filter(role => !this.selected_playbook_roles.includes(role));
    },

    up() {
      this.selected_playbook_roles.forEach((v) => {
        const idx = this.playbook_roles.indexOf(v);
        this._swap(idx, idx - 1);
      });
    },

    down() {
      // reverse()は破壊的操作なので、concat()でクローンしている
      this.selected_playbook_roles.concat().reverse().forEach((v) => {
        const idx = this.playbook_roles.indexOf(v);
        this._swap(idx, idx + 1);
      });
    },

    _swap(from, to) {
      const m = this.playbook_roles.length - 1;
      if (from < 0 || m < from || to < 0 || m < to) {
        return;
      }
      const r = this.playbook_roles.concat();
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

    self.ec2.edit_ansible_playbook().done((data) => {
      self.playbook_roles = data.playbook_roles;
      self.roles = data.roles;
      self.extra_vars = data.extra_vars;
      self.$parent.loading = false;
    }).fail(alertDanger(self.show_ec2));
  },
});
