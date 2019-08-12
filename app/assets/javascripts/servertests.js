//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
const queryString = require('query-string').parse(window.location.search);
const modal = require('./modal');
const Servertest = require('./models/servertest').default;
const vace = require('./modules/vue-ace');
require('brace/mode/ruby');
require('brace/theme/github');

Vue.use(vace, false, 'ruby', '25');

Vue.component('demo-grid', require('./demo-grid.js'));

const servertestUrl = queryString.infrastructure_id ? `infrastructure_id=${queryString.infrastructure_id}` : '';

if ($('#indexElement').length) {
  new Vue({
    el: '#indexElement',
    data: {
      searchQuery: '',
      gridColumns: ['servertest_name', 'description', 'category'],
      gridData: [],
      index: 'servertests',
      picked: {
        servertest_path: null,
        edit_servertest_path: null,
      },
      infra_id: queryString.infrastructure_id ? `&infrastructure_id=${queryString.infrastructure_id}` : '',
      sel_infra_id: '-1',
      url: `servertests?${servertestUrl}`,
      is_empty: false,
      loading: true,
      generating: false,
      awspec: {
        value: null,
        fname: null,
      },
    },
    methods: {
      can_edit() {
        return this.picked.edit_servertest_path === null;
      },
      can_delete() {
        return this.picked.servertest_path === null;
      },
      delete_entry() {
        const self = this;
        modal.Confirm(t('servertests.servertest'), t('servertests.msg.delete_servertest'), 'danger').done(() => {
          $.ajax({
            type: 'POST',
            url: self.picked.servertest_path,
            dataType: 'json',
            data: { _method: 'delete' },
            success() {
              window.location.reload();
            },
          }).fail(modal.AlertForAjaxStdError());
        });
      },
      reload() {
        this.loading = true;
        this.$children[0].load_ajax(this.url);
        this.picked = {
          servertest_path: null,
          edit_servertest_path: null,
        };
      },
      show_servertest(id) {
        $.ajax({
          url: `/servertests/${id}`,
          type: 'GET',
          success(data) {
            $('#value-information').html(data);
          },
        });
        document.getElementById('value').style.display = '';
      },
      generate() {
        const self = this;
        self.generating = true;

        const svt = new Servertest(self.sel_infra_id);
        svt.generate_awspec().done((data) => {
          self.awspec.value = data.generated;
          self.generating = false;
        }).fail(modal.AlertForAjaxStdError());
      },
      create_awspec() {
        const self = this;
        const params = self.awspec;
        self.generating = true;

        const svt = new Servertest(self.sel_infra_id);
        svt.create(params.fname, params.value, 'awspec').done((data) => {
          modal.Alert(t('servertests.servertest'), data, 'success').done(() => {
            window.location.href = `/servertests?infrastructure_id=${self.sel_infra_id}${window.location.search}`;
          });
        }).fail((msg) => {
          modal.Alert(t('servertests.servertest'), msg, 'danger');
          self.generating = false;
        });
      },
    },
    computed: {
      required_filed() {
        const { awspec } = this;
        return (awspec.value && awspec.fname);
      },
    },
    mounted() {
      this.$nextTick(function ready() {
        const self = this;
        self.loading = false;
      });
    },
  });
}

require('./serverspec-gen');
