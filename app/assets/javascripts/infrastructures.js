//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//


(function () {
  // ================================================================
  // infrastructures
  // ================================================================

  // browserify functions for vue filters functionality
  // var infraindex = require('./modules/loadindex');
  const queryString = require('query-string').parse(location.search);
  // browserify modules for Vue directives
  const Infrastructure = require('models/infrastructure').default;
  const modal = require('modal');

  Vue.use(require('./modules/datepicker'), queryString.lang);

  const vace = require('./modules/vue-ace');
  require('brace/mode/json');
  require('brace/mode/yaml');
  require('brace/theme/github');


  Vue.component('stack-events-table', require('infrastructures/stack-events-table.js'));
  Vue.component('add-modify-tabpane', require('infrastructures/add-modify-tabpane.js'));
  Vue.component('insert-cf-params', require('infrastructures/insert-cf-params.js'));
  Vue.component('add-ec2-tabpane', require('infrastructures/add-ec2-tabpane.js'));
  Vue.component('cf-history-tabpane', require('infrastructures/cf-history-tabpane.js'));
  Vue.component('infra-logs-tabpane', require('infrastructures/infra-logs-tabpane.js'));
  Vue.component('monitoring-tabpane', require('infrastructures/monitoring-tabpane.js'));
  Vue.component('edit-monitoring-tabpane', require('infrastructures/edit-monitoring-tabpane.js'));
  Vue.component('rds-tabpane', require('infrastructures/rds-tabpane.js'));
  Vue.component('elb-tabpane', require('infrastructures/elb-tabpane.js'));
  Vue.component('s3-tabpane', require('infrastructures/s3-tabpane.js'));
  Vue.component('view-rules-tabpane', require('infrastructures/view-rules-tabpane.js'));
  Vue.component('security-groups-tabpane', require('infrastructures/security-groups-tabpane.js'));
  Vue.component('ec2-tabpane', require('infrastructures/ec2-tabpane.js'));
  Vue.component('servertest-results-tabpane', require('infrastructures/servertest-results-tabpane.js'));
  Vue.component('serverspec-tabpane', require('infrastructures/serverspec-tabpane.js'));
  Vue.component('operation-sched-tabpane', require('infrastructures/operation-sched-tabpane.js'));
  Vue.component('edit-ansible-playbook-tabpane', require('infrastructures/edit-ansible-playbook-tabpane.js'));
  Vue.component('demo-grid', require('demo-grid.js'));


  const show = require('infrastructures/show_infra.js');
  const show_infra_initialize = show.initialize;
  const show_infra = show.show_infra;
  const SHOW_INFRA_ID = show.SHOW_INFRA_ID;
  const reload_infra_index_page = show.reload_infra_index_page;

  const detach = function (infra_id) {
    modal.Confirm(t('infrastructures.infrastructure'), t('infrastructures.msg.detach_stack_confirm'), 'danger').done(() => {
      const infra = new Infrastructure(infra_id);
      const l = new Loader();
      l.text = 'Loading...';
      l.$mount(SHOW_INFRA_ID);
      infra.detach().done((msg) => {
        modal.Alert(t('infrastructures.infrastructure'), msg).done(() => {
          reload_infra_index_page();
        });
      }).fail(modal.AlertForAjaxStdError()).always(l.$destroy);
    });
  };

  const delete_stack = function (infra_id) {
    modal.Confirm(t('infrastructures.infrastructure'), t('infrastructures.msg.delete_stack_confirm'), 'danger').done(() => {
      const infra = new Infrastructure(infra_id);
      const l = new Loader();
      l.text = 'Loading...';
      l.$mount(SHOW_INFRA_ID);
      infra.delete_stack().done((msg) => {
        modal.Alert(t('infrastructures.infrastructure'), msg).done(() => {
          show_infra(infra_id);
        });
        // TODO: reload
      }).fail(modal.AlertForAjaxStdError(() => {
        show_infra(infra_id);
      })).always(l.$destroy);
    });
  };


  // for infrastructures#new
  const new_ec2_key = function () {
    const region_input = $('#infrastructure_region');
    const region = region_input.val();
    const project_id = $('#infrastructure_project_id').val();
    let name_file;
    modal.Confirm(t('infrastructures.infrastructure'), t('ec2_private_keys.confirm.create')).then(() => modal.Prompt(t('infrastructures.infrastructure'), t('app_settings.keypair_name'))).then((name) => {
      if (!name) {
        modal.Alert(t('infrastructures.infrastructure'), t('ec2_private_keys.msg.please_name'), 'danger');
        return;
      }

      name_file = name;
      return $.ajax({
        url: '/ec2_private_keys',
        type: 'POST',
        data: {
          name,
          region,
          project_id,
        },
      });
    }).done((key) => {
      const value = key.value;
      const textarea = $('#keypair_value');
      const keypair_name = $('#keypair_name');
      textarea.val(value);
      keypair_name.val(name_file);
      textarea.attr('readonly', true);
      keypair_name.attr('readonly', true);
      region_input.attr('readonly', true);

      // download file.
      const file = new File([value], `${name_file}.pem`);
      const url = window.URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', file.name);
      document.body.appendChild(a);
      a.click();
    })
      .fail((xhr) => {
        modal.Alert(t('infrastructures.infrastructure'), xhr.responseText, 'danger');
      });
  };

  // ================================================================
  // event bindings
  // ================================================================

  if ($('#infrastructureApp').length) {
    const newVM = require('modules/newVM');


    const infrastructure_url = queryString.project_id ? `&project_id=${queryString.project_id}` : '';
    const index = {
      template: '#index-template',
      replace: true,
      data() {
        return {
          searchQuery: '',
          gridColumns: [],
          gridData: [],
          loading: true,
          is_empty: false,
          url: `infrastructures?lang=${queryString.lang}${infrastructure_url}`,
          picked: {
            button_delete_stack: null,
            edit_infrastructure_path: null,
            button_detach_stack: null,
          },
          index: 'infrastructures',
          infra_initial_tab: '',
        };
      },
      created() {
        if (queryString.project_id > 3) {
          this.gridColumns = ['stack_name', 'region', 'keypairname', 'created_at', 'status'];
        } else {
          this.gridColumns = ['stack_name', 'region', 'keypairname'];
        }

        moment.locale(queryString.lang);
      },
      methods: {
        leave(el, done) {
          $(el).fadeOut('normal');
        },
        can_edit() {
          return (this.picked.edit_infrastructure_path);
        },
        can_delete() {
          return (this.picked.button_delete_stack);
        },
        can_detach() {
          return (this.picked.button_detach_stack);
        },
        is_picked() {
          return (this.picked.id);
        },
        delete_stack() {
          delete_stack(this.picked.id);
          this.reload();
        },
        show_infra(item_id) {
          this.show_infra_and_rewrite_url(item_id, '');
        },
        show_sched() {
          this.show_infra_and_rewrite_url(this.picked.id, 'show_sched');
          this.reload();
        },
        show_infra_and_rewrite_url(infra_id, infra_oepn_tab) {
          const prev_infra_id = this.$route.params.infra_id;
          this.infra_initial_tab = infra_oepn_tab;
          router.push({
            name: 'infra',
            params: {
              infra_id,
            },
            query: queryString,
          });
          this.infra_initial_tab = '';
          if (String(prev_infra_id) === String(infra_id)) {
            this.$refs.infrastructure.reset(infra_oepn_tab);
          }
        },
        detach_infra() {
          detach(this.picked.id);
          this.reload();
        },
        reload() {
          this.loading = true;
          this.$refs.demogrid.load_ajax(this.url);
        },
      },
      mounted() {
        this.$nextTick(function () {
          show_infra_initialize(this.show_infra_and_rewrite_url);
        });
      },
    };

    const router = new VueRouter({
      mode: 'history',
      routes: [{
        path: '/infrastructures',
        component: index,
        children: [{
          path: '/infrastructures/infra/:infra_id',
          name: 'infra',
          component: newVM(),
        }],
      }],
    });

    new Vue({
      el: '#infrastructureApp',
      router,
    });
  }

  if ($('#KeypairFormGroup').length) {
    const keypair_form_group = new Vue({
      el: '#KeypairFormGroup',
      data: {
        input_type: 'input',
      },
    });
  }


  $(document).on('click', '.create_ec2_key', (e) => {
    e.preventDefault();
    new_ec2_key();
  });
}());
