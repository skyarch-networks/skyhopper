var Infrastructure = require('models/infrastructure').default;
var EC2Instance    = require('models/ec2_instance').default;

var helpers = require('infrastructures/helper.js');
var alert_success        = helpers.alert_success;
var alert_danger         = helpers.alert_danger;

module.exports = Vue.extend({
  template: '#edit-ansible-playbook-tabpane-template',

  props: {
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data: function () {return {
    loading:           false,
    selected_roles:   null,
    playbook_roles:   null,
    selected_playbook_roles:   null,
    roles:             null,
    extra_vers:       null,
  };},

  methods: {
    update: function () {
      var self = this;
      self.loading = true;
      self.ec2.update_ansible_playbook(self.playbook_roles, self.extra_vers)
        .done(alert_success(self.show_ec2))
        .fail(alert_danger(self.show_ec2));
    },

    show_ec2: function () { this.$parent.show_ec2(this.physical_id); },

    add_role: function () {
      var self = this;
      _.forEach(self.selected_roles, function (role) {
        self._add(role);
      });
    },

    _add: function (run) {
      if (_.include(this.playbook_roles, run)) { return; }
      this.playbook_roles.push(run);
    },

    del: function () {
      this.playbook_roles = _.difference(this.playbook_roles, this.selected_playbook_roles);
    },

    up: function () {
      var self = this;
      _.forEach(this.selected_playbook_roles, function (v) {
        var idx = _.indexOf(self.playbook_roles, v);
        self._swap(idx, idx-1);
      });
    },

    down: function () {
      var self = this;
      // XXX: 複数個選択した時にうまく動いてない気がする
      _(self.selected_playbook_roles).reverse().forEach(function (v) {
        var idx = _.indexOf(self.playbook_roles, v);
        self._swap(idx, idx+1);
      }).value();
    },

    _swap: function (from, to) {
      var m = this.playbook_roles.length -1;
      if (from < 0 || m < from || to < 0 || m < to) {
        return;
      }
      var r = _.clone(this.playbook_roles);
      r[to]   = this.playbook_roles[from];
      r[from] = this.playbook_roles[to];
      this.playbook_roles = r;
    }
  },

  computed: {
    physical_id:     function () { return this.$parent.tabpaneGroupID; },
    ec2:             function () { return new EC2Instance(new Infrastructure(this.infra_id), this.physical_id); },
  },
  created: function () {
    var self = this;
    console.log(self);

    self.ec2.edit_ansible_playbook().done(function (data) {
      self.playbook_roles   = data.playbook_roles;
      self.roles     = data.roles;
      self.extra_vers     = data.extra_vers;
      self.$parent.loading = false;
    }).fail(alert_danger(self.show_ec2));
  }
});
