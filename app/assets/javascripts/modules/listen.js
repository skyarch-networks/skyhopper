//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

module.exports = function (value, key, index, lang) {
  if(index === 'infrastructures'){
    return render_infrastructures(value, key, lang);
  }else if(index === 'projects'){
    return render_projects(value, key, lang);
  }else if (index === 'clients') {
    return render_clients(value, key, lang);
  }else if (index === 'serverspec') {
    return render_serverspecs(value, key, lang);
  }else if (index === 'dish') {
    return render_dish(value, key, lang);
  }else if (index === 'cf_templates') {
    return render_cf_templates(value, key, lang);
  }else if (index === 'user_admin') {
    return render_user_admin(value, key, lang);
  }else if (index === 'serverspec_results') {
    return render_serverspecs_results(value, key);
  }else{
    return value;
  }
};

function render_infrastructures(value, key, lang){
  if (key === 'status') {
    if(value === "CREATE_COMPLETE"){
      return "<span class='text text-success'>"+value+"</span>";
    }else if (value === 'DELETE_IN_PROGRESS') {
      return "<span class='text text-danger'>"+value+"</span>";
    }else if (value === 'CREATE_IN_PROGRESS') {
      return "<span class='text text-info'>"+value+"</span>";
    }else{
      return "<span class='text text-default'> NO_STACK_INFO </span>";
    }
  }else{
    return value;
  }
}

function render_clients(value, key, lang){
  if (key === 'code') {
    return value[0]+" <span class='label label-success'>"+value[1] +" "+ t ('clients.projects')+"</span>";
  }else{
    return value;
  }
}

function render_projects(value, key, lang){
  if (key === 'code') {
    return value[0]+" <span class='label label-success'>"+value[1] +" "+ t ('projects.infras')+"</span>";
  }else{
    return value;
  }
}

function render_serverspecs(value, key, lang){
    return value;
}

function render_cf_templates(value, key, lang){
    return value;
}

function render_dish(value, key, lang){
  if (key === 'status') {
    var label = null;
    if(value === 'SUCCESS'){
      label = 'label-success';
    }else if (value === 'FAILURE') {
      label = 'label-danger';
    }else if (value === 'CREATING' || value === 'BOOTSTRAPPING' || value === 'APPLYING' || value === 'SERVERSPEC') {
      label = 'label-info';
    }else {
      label = 'label-warning';
      value = 'NOT YET';
    }

    return "<span class='label "+label+"'>"+value+"</span>";
  }else{
    return value;
  }
}

function render_user_admin(value, key, lang){
  if (key === 'email') {
    var image = "<img class='img-rounded gravatar-icon' src='https://secure.gravatar.com/avatar/"+value[0]+"' alt='"+value[0]+"' width='24' height='24'>";
    var email = value[1];
    return image+" "+email;
  }else if (key === 'role') {
    var admin = (value[1] ? "<span class='label label-info'>admin</span>" : "");
    var master = (value[0] ? "<span class='label label-warning'>master</span>" : "");

    return master+"  "+admin;
  }else{
    return value;
  }
}

function render_serverspecs_results(value, key){
  if(key === 'status'){
    var ret;
    switch (value) {
      case 'success':
        ret = "<span class='label label-success'>"+value+"</span>";
        break;
      case 'failed':
        ret = "<span class='label label-danger'>"+value+"</span>";
        break;
      case 'pending':
        ret = "<span class='label label-warning'>"+value+"</span>";
        break;
    }
    return ret;
  }else if (key === 'serverspec') {
    if(value.length > 0){
      var values = [];
      $.each(value, function(index, value){
        values.push(" "+value.name);
      });
      return values;
    }else {
      return 'auto generated';
    }
  }else if (key === 'message') {
    if(value[3].length <= 0){
      return "<span class='text text-success'> serverspec for "+value[1]+" is successfully finished. </span>";
    }else{
      var head = "<td>Serverspec for "+value[1]+" <a href='#' data-toggle='collapse' data-target='#logbody-"+value[0]+"' class='accordion-toggle btn btn-xs btn-link popovermore'> ... <span class='glyphicon glyphicon-zoom-in'></span></a></td>";
      var body = '';
      if(value[2]){
          body = "<div class='col-sm-12'>" +
          "<td class='hidden-row'>" +
          "  <div class='accordion-body collapse' id='logbody-"+value[0]+"'>" +
          "    <pre style='margin: 5px'>"+value[2]+"</pre>" +
          "  </div>" +
          "</td>" +
        "</div>";
      }

      return head+body;
    }
  }else{
    return value;
  }
}
