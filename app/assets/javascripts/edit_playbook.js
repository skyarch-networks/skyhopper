//
// Copyright (c) 2013-2019 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
const modal = require('./modal');

// ほかのコードから参照するため、変数をグローバルにしています
// eslint-disable-next-line no-var, no-undef
viewEditPlaybookForm = (() => (({ id }) => new Vue({
  el: '#editPlaybookForm',
  template: '#edit-playbook-form-template',

  data: {
    id,
    is_loading: true,
    roles: [],
    selected_roles: [],
    playbook_roles: [],
    selected_playbook_roles: [],
    extra_vars: '',
  },

  methods: {
    add() {
      this.selected_roles.forEach((role) => {
        if (this.playbook_roles.includes(role)) { return; }
        this.playbook_roles.push(role);
      });
    },

    del() {
      this.playbook_roles = this.playbook_roles.filter(role => (!this.selected_playbook_roles.includes(role)));
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

    load_with_ajax() {
      this.is_loading = true;
      $.ajax({
        url: `/dishes/${this.id}/edit`,
        method: 'GET',
        dataType: 'json',
        data: {
        },
      }).then(
        (params) => {
          this.roles = params.roles;
          this.playbook_roles = params.playbook_roles;
          this.extra_vars = params.extra_vars;
          this.is_loading = false;
        },
        modal.AlertForAjaxStdError(),
      );
    },
  },

  mounted() {
    this.$nextTick(function ready() {
      this.load_with_ajax();
    });
  },
})))();
