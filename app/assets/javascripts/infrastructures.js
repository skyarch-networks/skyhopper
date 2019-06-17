//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

const queryString = require('query-string').parse(window.location.search);
const Infrastructure = require('./models/infrastructure').default;
const modal = require('./modal');
const datepicker = require('./modules/datepicker');
const vace = require('./modules/vue-ace');
require('brace/mode/json');
require('brace/mode/yaml');
require('brace/theme/github');
const show = require('./infrastructures/show_infra.js');
const newVM = require('./modules/newVM');

// Vue component
const stackEventsTable = require('./infrastructures/stack-events-table.js');
const addModifyTabpane = require('./infrastructures/add-modify-tabpane.js');
const insertCfParams = require('./infrastructures/insert-cf-params.js');
const addEc2Tabpane = require('./infrastructures/add-ec2-tabpane.js');
const cfHistoryTabpane = require('./infrastructures/cf-history-tabpane.js');
const infraLogsTabpane = require('./infrastructures/infra-logs-tabpane.js');
const monitoringTabpane = require('./infrastructures/monitoring-tabpane.js');
const editMonitoringTabpane = require('./infrastructures/edit-monitoring-tabpane.js');
const rdsTabpane = require('./infrastructures/rds-tabpane.js');
const elbTabpane = require('./infrastructures/elb-tabpane.js');
const s3Tabpane = require('./infrastructures/s3-tabpane.js');
const viewRulesTabpane = require('./infrastructures/view-rules-tabpane.js');
const securityGroupsTabpane = require('./infrastructures/security-groups-tabpane.js');
const ec2Tabpane = require('./infrastructures/ec2-tabpane.js');
const servertestResultsTabpane = require('./infrastructures/servertest-results-tabpane.js');
const serverspecTabpane = require('./infrastructures/serverspec-tabpane.js');
const operationSchedTabpane = require('./infrastructures/operation-sched-tabpane.js');
const editAnsiblePlaybookTabpane = require('./infrastructures/edit-ansible-playbook-tabpane.js');
const demoGrid = require('./demo-grid.js');

{
  // ================================================================
  // infrastructures
  // ================================================================

  // browserify functions for vue filters functionality
  // var infraindex = require('./modules/loadindex');

  Vue.use(datepicker, queryString.lang);

  Vue.component('stack-events-table', stackEventsTable);
  Vue.component('add-modify-tabpane', addModifyTabpane);
  Vue.component('insert-cf-params', insertCfParams);
  Vue.component('add-ec2-tabpane', addEc2Tabpane);
  Vue.component('cf-history-tabpane', cfHistoryTabpane);
  Vue.component('infra-logs-tabpane', infraLogsTabpane);
  Vue.component('monitoring-tabpane', monitoringTabpane);
  Vue.component('edit-monitoring-tabpane', editMonitoringTabpane);
  Vue.component('rds-tabpane', rdsTabpane);
  Vue.component('elb-tabpane', elbTabpane);
  Vue.component('s3-tabpane', s3Tabpane);
  Vue.component('view-rules-tabpane', viewRulesTabpane);
  Vue.component('security-groups-tabpane', securityGroupsTabpane);
  Vue.component('ec2-tabpane', ec2Tabpane);
  Vue.component('servertest-results-tabpane', servertestResultsTabpane);
  Vue.component('serverspec-tabpane', serverspecTabpane);
  Vue.component('operation-sched-tabpane', operationSchedTabpane);
  Vue.component('edit-ansible-playbook-tabpane', editAnsiblePlaybookTabpane);
  Vue.component('demo-grid', demoGrid);

  const showInfraInitialize = show.initialize;
  const showInfra = show.show_infra;
  const { SHOW_INFRA_ID } = show;
  const reloadInfraIndexPage = show.reload_infra_index_page;

  const detach = (infraId) => {
    modal.Confirm(t('infrastructures.infrastructure'), t('infrastructures.msg.detach_stack_confirm'), 'danger').done(() => {
      const infra = new Infrastructure(infraId);
      const l = new Loader();
      l.text = 'Loading...';
      l.$mount(SHOW_INFRA_ID);
      infra.detach().done((msg) => {
        modal.Alert(t('infrastructures.infrastructure'), msg).done(() => {
          reloadInfraIndexPage();
        });
      }).fail(modal.AlertForAjaxStdError()).always(l.$destroy);
    });
  };

  const deleteStack = (infraId) => {
    modal.Confirm(t('infrastructures.infrastructure'), t('infrastructures.msg.delete_stack_confirm'), 'danger').done(() => {
      const infra = new Infrastructure(infraId);
      const l = new Loader();
      l.text = 'Loading...';
      l.$mount(SHOW_INFRA_ID);
      infra.delete_stack().done((msg) => {
        modal.Alert(t('infrastructures.infrastructure'), msg).done(() => {
          showInfra(infraId);
        });
        // TODO: reload
      }).fail(modal.AlertForAjaxStdError(() => {
        showInfra(infraId);
      })).always(l.$destroy);
    });
  };


  // for infrastructures#new
  const newEc2Key = () => {
    const regionInput = $('#infrastructure_region');
    const region = regionInput.val();
    const projectId = $('#infrastructure_project_id').val();
    let nameFile;
    modal.Confirm(
      t('infrastructures.infrastructure'),
      t('ec2_private_keys.confirm.create'),
    ).then(
      () => modal.Prompt(t('infrastructures.infrastructure'), t('app_settings.keypair_name')),
    ).then((name) => {
      if (!name) {
        modal.Alert(t('infrastructures.infrastructure'), t('ec2_private_keys.msg.please_name'), 'danger');
        return;
      }

      nameFile = name;
      return $.ajax({
        url: '/ec2_private_keys',
        type: 'POST',
        data: {
          name,
          region,
          projectId,
        },
      });
    }).done((key) => {
      const { value } = key;
      const textarea = $('#keypair_value');
      const keypairName = $('#keypair_name');
      textarea.val(value);
      keypairName.val(nameFile);
      textarea.attr('readonly', true);
      keypairName.attr('readonly', true);
      regionInput.attr('readonly', true);

      // download file.
      const file = new File([value], `${nameFile}.pem`);
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
    const infrastructureUrl = queryString.project_id ? `&project_id=${queryString.project_id}` : '';
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
          url: `infrastructures?lang=${queryString.lang}${infrastructureUrl}`,
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
        leave(el) {
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
          deleteStack(this.picked.id);
          this.reload();
        },
        show_infra(itemId) {
          this.show_infra_and_rewrite_url(itemId, '');
        },
        show_sched() {
          this.show_infra_and_rewrite_url(this.picked.id, 'show_sched');
          this.reload();
        },
        show_infra_and_rewrite_url(infraId, infraOepnTab) {
          const prevInfraId = this.$route.params.infra_id;
          this.infra_initial_tab = infraOepnTab;
          router.push({
            name: 'infra',
            params: {
              infra_id: infraId,
            },
            query: queryString,
          });
          this.infra_initial_tab = '';
          if (String(prevInfraId) === String(infraId)) {
            this.$refs.infrastructure.reset(infraOepnTab);
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
        this.$nextTick(function ready() {
          showInfraInitialize(this.show_infra_and_rewrite_url);
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
    new Vue({
      el: '#KeypairFormGroup',
      data: {
        input_type: 'input',
      },
    });
  }


  $(document).on('click', '.create_ec2_key', (e) => {
    e.preventDefault();
    newEc2Key();
  });
}
