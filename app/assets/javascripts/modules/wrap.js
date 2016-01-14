//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

module.exports = function(value, option){
  if(option[0] ==='infrastructure') {
    return render_infrastructures(value);
  }else if(option[0] === 'project') {
    return render_projects(value);
  }else if (option[0] === 'client') {
    return render_clients(value);
  }else if (option[0] === 'serverspec') {
    return render_serverspecs(value);
  }else if (option[0] === 'dish') {
    return render_dish(value);
  }else if (option[0] === 'cf_template') {
    return render_cf_templates(value);
  }else if (option[0] === 'user_admin') {
    return render_user_admin(value);
  }else if (option[0] === 'serverspec_results') {
    return render_serverspecs_results(value);
  }else if(option[0] === 'operation_sched'){
    return render_ops_sched(value);
  }else{
    return value;
  }
};

function render_infrastructures(value){
  if (value === 'stack_name'){
    return t('infrastructures.stackname');
  }else if(value === 'region'){
    return t('infrastructures.region');
  }else if(value === 'created_at'){
    return t('infrastructures.creation_time');
  }else if(value === 'id'){
    return t('common.actions');
  }else if(value === 'status'){
    return t('infrastructures.status');
  }else if(value === 'keypairname'){
    return t('infrastructures.keypair');
  }else{
    return value;
  }
}

function render_projects(value){
  if (value === 'code'){
    return t ('projects.code');
  }else if (value === 'name') {
    return t ('projects.name');
  }else if (value === 'cloud_provider') {
    return t ('projects.cloud_provider');
  }else if (value === 'access_key') {
    return t ('projects.access_key');
  }else if (value === 'nums') {
    return t ('projects.infras');
  }else if (value === 'id') {
    return t ('common.actions');
  }else{
    return value;
  }
}

function render_clients(value){
  if (value === 'code'){
    return t ('clients.code');
  }else if (value === 'name') {
    return t ('clients.name');
  }else if (value === 'nums') {
    return t ('clients.projects');
  }else if (value === 'id') {
    return t ('common.actions');
  }else{
    return value;
  }
}

function render_serverspecs(value){
  if (value === 'description'){
    return t ('serverspecs.description');
  }else if (value === 'name') {
    return t ('serverspecs.name');
  }else if (value === 'id') {
    return t ('common.actions');
  }else{
    return value;
  }
}

function render_dish(value){
  if (value === 'name'){
    return t ('dishes.name');
  }else if (value === 'detail') {
    return t ('dishes.detail');
  }else if (value === 'status') {
    return t ('dishes.validation_status');
  }else if (value === 'id') {
    return t ('common.actions');
  }else{
    return value;
  }
}

function render_cf_templates(value){
  if (value === 'subject'){
    return t ('cf_templates.subject');
  }else if (value === 'details') {
    return t ('cf_templates.details');
  }else if (value === 'id') {
    return t ('common.actions');
  }else{
    return value;
  }
}

function render_user_admin(value){
  if (value === 'role'){
    return t('users.role');
  }else if (value === 'email') {
    return t('users.email');
  }else if (value === 'last_sign_in_at') {
    return t('users.last_signed_in_at');
  }else if (value === 'id') {
    return t ('common.actions');
  }else{
    return value;
  }
}

function render_serverspecs_results(value){
  if (value === 'serverspec'){
    return t('serverspecs.serverspecs');
  }else if (value === 'resource') {
    return t('serverspecs.generator.resources');
  }else if (value === 'message') {
    return t('cf_templates.details');
  }else if (value === 'status') {
    return t ('infrastructures.status');
  }else if (value === 'created_at') {
    return t ('serverspecs.created_at');
  }else{
    return value;
  }
}

function render_ops_sched(value){
  if (value === 'physical_id'){
    return "Physical ID";
  }else if(value === 'screen_name'){
    return t('operation_scheduler.screen_name');
  }else if(value === 'id'){
    return t ('common.actions');
  }
}
