//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//


(function () {
  'use strict';

// ================================================================
// infrastructures
// ================================================================

//browserify functions for vue filters functionality
  //var infraindex = require('./modules/loadindex');
  var queryString = require('query-string').parse(location.search);
  //browserify modules for Vue directives
  var Infrastructure = require('models/infrastructure').default;
  var modal          = require('modal');

  Vue.use(require('./modules/datepicker'), queryString.lang);

  var vace = require('vue-ace');
  require('brace/mode/json');
  require('brace/mode/yaml');
  require('brace/theme/github');


  Vue.component('stack-events-table',         require('infrastructures/stack-events-table.js'));
  Vue.component('add-modify-tabpane',         require('infrastructures/add-modify-tabpane.js'));
  Vue.component('insert-cf-params',           require('infrastructures/insert-cf-params.js'));
  Vue.component('add-ec2-tabpane',            require('infrastructures/add-ec2-tabpane.js'));
  Vue.component('cf-history-tabpane',         require('infrastructures/cf-history-tabpane.js'));
  Vue.component('infra-logs-tabpane',         require('infrastructures/infra-logs-tabpane.js'));
  Vue.component('monitoring-tabpane',         require('infrastructures/monitoring-tabpane.js'));
  Vue.component('edit-monitoring-tabpane',    require('infrastructures/edit-monitoring-tabpane.js'));
  Vue.component('rds-tabpane',                require('infrastructures/rds-tabpane.js'));
  Vue.component('elb-tabpane',                require('infrastructures/elb-tabpane.js'));
  Vue.component('s3-tabpane',                 require('infrastructures/s3-tabpane.js'));
  Vue.component('view-rules-tabpane',         require('infrastructures/view-rules-tabpane.js'));
  Vue.component('security-groups-tabpane',    require('infrastructures/security-groups-tabpane.js'));
  Vue.component('ec2-tabpane',                require('infrastructures/ec2-tabpane.js'));
  Vue.component('servertest-results-tabpane', require('infrastructures/servertest-results-tabpane.js'));
  Vue.component('serverspec-tabpane',         require('infrastructures/serverspec-tabpane.js'));
  Vue.component('operation-sched-tabpane',    require('infrastructures/operation-sched-tabpane.js'));
  Vue.component('edit-ansible-playbook-tabpane',       require('infrastructures/edit-ansible-playbook-tabpane.js'));
  Vue.component('demo-grid',                  require('demo-grid.js'));



  var show = require('infrastructures/show_infra.js');
  var show_infra_initialize = show.initialize;
  var show_infra = show.show_infra;
  var SHOW_INFRA_ID = show.SHOW_INFRA_ID;
  var reload_infra_index_page = show.reload_infra_index_page;

  var detach = function (infra_id) {
    modal.Confirm(t('infrastructures.infrastructure'), t('infrastructures.msg.detach_stack_confirm'), 'danger').done(function () {
      var infra = new Infrastructure(infra_id);
      var l = new Loader();
      l.text = "Loading...";
      l.$mount(SHOW_INFRA_ID);
      infra.detach().done(function (msg) {
        modal.Alert(t('infrastructures.infrastructure'), msg).done(function () {
          reload_infra_index_page();
        });
      }).fail(modal.AlertForAjaxStdError()).always(l.$destroy);
    });
  };

  var delete_stack = function (infra_id) {
    modal.Confirm(t('infrastructures.infrastructure'), t('infrastructures.msg.delete_stack_confirm'), 'danger').done(function () {
      var infra = new Infrastructure(infra_id);
      var l = new Loader();
      l.text = "Loading...";
      l.$mount(SHOW_INFRA_ID);
      infra.delete_stack().done(function (msg) {
        modal.Alert(t('infrastructures.infrastructure'), msg).done(function () {
          show_infra(infra_id);
        });
        // TODO: reload
      }).fail(modal.AlertForAjaxStdError(function () {
        show_infra(infra_id);
      })).always(l.$destroy);
    });
  };


  // for infrastructures#new
  var new_ec2_key = function () {
    var region_input = $('#infrastructure_region');
    var region = region_input.val();
    var project_id = $('#infrastructure_project_id').val();
    var name_file;
    modal.Confirm(t('infrastructures.infrastructure'), t('ec2_private_keys.confirm.create')).then(function () {
      return modal.Prompt(t('infrastructures.infrastructure'), t('app_settings.keypair_name'));
    }).then(function (name) {
      if(!name){
        modal.Alert(t('infrastructures.infrastructure'), t('ec2_private_keys.msg.please_name'), 'danger');
        return;
      }

      name_file = name;
      return $.ajax({
        url: '/ec2_private_keys',
        type: 'POST',
        data: {
          name:       name,
          region:     region,
          project_id: project_id,
        },
      });
    }).done(function (key) {
      var value = key.value;
      var textarea = $('#keypair_value');
      var keypair_name = $('#keypair_name');
      textarea.val(value);
      keypair_name.val(name_file);
      textarea.attr('readonly', true);
      keypair_name.attr('readonly', true);
      region_input.attr('readonly', true);

      // download file.
      var file = new File([value], name_file + '.pem');
      var url = window.URL.createObjectURL(file);
      var a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', file.name);
      document.body.appendChild(a);
      a.click();
    }).fail(function (xhr) {
      modal.Alert(t('infrastructures.infrastructure'), xhr.responseText, 'danger');
    });
  };

// ================================================================
// event bindings
// ================================================================

  if ($('#infrastructureApp').length) {
    var newVM = require('modules/newVM');



    var infrastructure_url = queryString.project_id ? '&project_id=' + queryString.project_id : '';
    var index = {
      template: '#index-template',
      replace: true,
      data: function () {
        return {
          searchQuery: '',
          gridColumns: [],
          gridData: [],
          loading: true,
          is_empty: false,
          url: 'infrastructures?lang=' + queryString.lang + infrastructure_url,
          picked: {
            button_delete_stack: null,
            edit_infrastructure_path: null,
            button_detach_stack: null
          },
          index: 'infrastructures',
          infra_initial_tab: '',
        };
      },
      created: function () {
        if (queryString.project_id > 3)
          this.gridColumns = ['stack_name', 'region', 'keypairname', 'created_at', 'status'];
        else
          this.gridColumns = ['stack_name', 'region', 'keypairname'];

        moment.locale(queryString.lang);

      },
      methods: {
        leave: function (el, done) {
          $(el).fadeOut('normal');
        },
        can_edit: function () {
          return (this.picked.edit_infrastructure_path);
        },
        can_delete: function () {
          return (this.picked.button_delete_stack);
        },
        can_detach: function () {
          return (this.picked.button_detach_stack);
        },
        is_picked: function () {
          return (this.picked.id);
        },
        delete_stack: function () {
          delete_stack(this.picked.id);
          this.reload();
        },
        show_infra: function (item_id) {
          this.show_infra_and_rewrite_url(item_id, '');
        },
        show_sched: function () {
          this.show_infra_and_rewrite_url(this.picked.id, 'show_sched');
          this.reload();
        },
        show_infra_and_rewrite_url: function (infra_id, infra_oepn_tab) {
          var prev_infra_id = this.$route.params.infra_id;
          this.infra_initial_tab = infra_oepn_tab;
          router.push({
            name: 'infra',
            params: {
              infra_id: infra_id,
            },
            query: queryString,
          });
          this.infra_initial_tab = '';
          if (String(prev_infra_id) === String(infra_id)) {
            this.$refs.infrastructure.reset(infra_oepn_tab);
          }
        },
        detach_infra: function () {
          detach(this.picked.id);
          this.reload();
        },
        reload: function () {
          this.loading = true;
          this.$refs.demogrid.load_ajax(this.url);
        },
      },
      mounted: function () {
        this.$nextTick(function () {
          show_infra_initialize(this.show_infra_and_rewrite_url);
        })
      },
    };

    var router = new VueRouter({
      mode: 'history',
      routes: [{
        path: '/infrastructures',
        component: index,
        children: [{
          path :'/infrastructures/infra/:infra_id',
          name: 'infra',
          component: newVM()
        }]
      }]
    });

    new Vue({
      el: '#infrastructureApp',
      router: router
    })
  }

  if ($('#KeypairFormGroup').length){
    var keypair_form_group = new Vue({
      el: '#KeypairFormGroup',
      data: {
        input_type: 'input'
      },
    });
  }



  $(document).on('click', '.create_ec2_key', function (e) {
    e.preventDefault();
    new_ec2_key();
  });


})();
