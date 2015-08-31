module.exports = function(value, option){
  if(option[0] ==='infrastructure'){
        return render_infrastructures(value);
  }else if(option[0] === 'project'){
        return render_projects(value);
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
    return t('infrastructures.launchtime');
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
  }else if (value === 'id') {
    return t ('common.actions');
  }else{
    return value;
  }
}
