//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

module.exports = function(value, index){
  switch (index) {
    case 'infrastructures':
      return render_infrastructures(value);
    case 'projects':
      return render_projects(value);
    case 'clients':
      return render_clients(value);
    case 'servertests':
      return render_servertests(value);
    case 'dishes':
      return render_dish(value);
    case 'cf_templates':
      return render_cf_templates(value);
    case 'user_admin':
      return render_user_admin(value);
    case 'servertest_results':
      return render_servertests_results(value);
    case 'operation_sched':
      return render_ops_sched(value);
    default:
      return value;
    }
};

function render_infrastructures(value){
  switch (value) {
    case 'stack_name':
      return t('infrastructures.stackname');
    case 'region':
      return t('infrastructures.region');
    case 'created_at':
      return t('infrastructures.creation_time');
    case 'status':
      return t('infrastructures.status');
    case 'keypairname':
      return t('infrastructures.keypair');
    default:
      return value;
  }
}

function render_projects(value){
  switch (value) {
    case 'code':
      return t ('projects.code');
    case 'name':
      return t ('projects.name');
    case 'access_key':
      return t ('projects.access_key');
    default:
      return value;
  }

}

function render_clients(value){
  switch (value) {
    case 'code':
      return t ('clients.code');
    case 'name':
      return t ('clients.name');
    default:
      return value;
  }
}

function render_servertests(value){
  switch (value) {
    case 'description':
      return t ('servertests.description');
    case 'servertest_name':
      return t ('servertests.name');
    case 'category':
      return t ('servertests.category');
    default:
      return value;
  }
}

function render_dish(value){
  switch (value) {
    case 'dish_name':
      return t ('dishes.name');
    case 'detail':
      return t ('dishes.detail');
    case 'status':
      return t ('dishes.validation_status');
    default:
      return value;
  }
}

function render_cf_templates(value){
  switch (value) {
    case 'cf_subject':
      return t ('cf_templates.subject');
    case 'details':
      return t ('cf_templates.details');
    default:
      return value;
  }
}

function render_user_admin(value){
  switch (value) {
    case 'role':
      return t('users.role');
    case 'email':
      return t('users.email');
    case 'last_sign_in_at':
      return t('users.last_signed_in_at');
    default:
      return value;
  }
}

function render_servertests_results(value){
  switch (value) {
    case 'servertest':
      return t('servertests.servertests');
    case 'resource':
      return t('servertests.generator.resources');
    case 'message':
      return t('cf_templates.details');
    case 'status':
      return t ('infrastructures.status');
    case 'created_at':
      return t ('servertests.created_at');
    default:
      return value;
  }
}

function render_ops_sched(value){
  switch (value) {
    case 'physical_id':
      return "Physical ID";
    case 'screen_name':
      return t('operation_scheduler.screen_name');
    case 'id':
      return t ('common.actions');
    default:
      return value;

  }
}
