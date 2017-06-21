var Infrastructure = require('models/infrastructure').default;
var EC2Instance    = require('models/ec2_instance').default;

var helpers = require('infrastructures/helper.js');
var alert_success        = helpers.alert_success;
var alert_danger         = helpers.alert_danger;

module.exports = Vue.extend({
  template: '#edit-runlist-tabpane-template',

  props: {
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data: function () {return {
    recipes:           {},
    selected_cookbook: null,
    selected_recipes:  null,
    selected_roles:    null,
    selected_runlist:  null,
    loading:           false,
    runlist:           null,
    cookbooks:         null,
    roles:             null,
  };},

  methods: {
    get_recipes: function () {
      var self = this;

      if (self.recipes[self.selected_cookbook]) { return; } // Avoid repeated call
      if (self.selected_cookbook === null) { return; } // ignore no selected cookbook

      self.ec2.recipes(self.selected_cookbook).done(function (data) {
        Vue.set(self.recipes, self.selected_cookbook, data);
      }).fail(alert_danger());
    },

    update: function () {
      var self = this;
      self.loading = true;
      self.ec2.update(self.runlist)
        .done(alert_success(self.show_ec2))
        .fail(alert_danger(self.show_ec2));
    },

    show_ec2: function () { this.$parent.show_ec2(this.physical_id); },

    add_recipe: function () {
      var self = this;
      _.forEach(self.selected_recipes, function (recipe) {
        var name = "recipe[" + self.selected_cookbook + "::" + recipe + "]";
        self._add(name);
      });
      return;
    },

    add_role: function () {
      var self = this;
      _.forEach(self.selected_roles, function (role) {
        var name = "role[" + role + "]";
        self._add(name);
      });
    },

    _add: function (run) {
      if (_.include(this.runlist, run)) { return; }
      this.runlist.push(run);
    },

    del: function () {
      this.runlist = _.difference(this.runlist, this.selected_runlist);
    },

    up: function () {
      var self = this;
      _.forEach(this.selected_runlist, function (v) {
        var idx = _.indexOf(self.runlist, v);
        self._swap(idx, idx-1);
      });
    },

    down: function () {
      var self = this;
      // XXX: 複数個選択した時にうまく動いてない気がする
      _(self.selected_runlist).reverse().forEach(function (v) {
        var idx = _.indexOf(self.runlist, v);
        self._swap(idx, idx+1);
      }).value();
    },

    _swap: function (from, to) {
      var m = this.runlist.length -1;
      if (from < 0 || m < from || to < 0 || m < to) {
        return;
      }
      var r = _.clone(this.runlist);
      r[to]   = this.runlist[from];
      r[from] = this.runlist[to];
      this.runlist = r;
    }
  },

  computed: {
    current_recipes: function () { return this.recipes[this.selected_cookbook] || []; },
    physical_id:     function () { return this.$parent.tabpaneGroupID; },
    ec2:             function () { return new EC2Instance(new Infrastructure(this.infra_id), this.physical_id); },
  },
  created: function () {
    var self = this;
    console.log(self);

    self.ec2.edit().done(function (data) {
      self.runlist   = data.runlist;
      self.cookbooks = data.cookbooks;
      self.roles     = data.roles;
      self.$parent.loading = false;
    }).fail(alert_danger(self.show_ec2));
  }
});
