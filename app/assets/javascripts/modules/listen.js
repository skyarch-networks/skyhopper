//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

module.exports = function (value, key, index, lang) {
  switch (index) {
    case 'infrastructures':
      return render_infrastructures(value, key, lang);
    case 'projects':
      return render_projects(value, key, lang);
    case 'clients':
      return render_clients(value, key, lang);
    case 'serverspec':
      return render_serverspecs(value, key, lang);
    case 'dish':
      return render_dish(value, key, lang);
    case 'cf_template':
      return render_cf_templates(value, key, lang);
    case 'user_admin':
      return render_user_admin(value, key, lang);
    case 'serverspec_results':
      return render_serverspecs_results(value, key, lang);
    default:
      return value;
  }
};


function render_infrastructures(value, key, lang){
  if (key === 'status') {
    switch (value) {
      case 'CREATE_COMPLETE':
        return "<span class='text text-success'>"+value+"</span>";
      case 'DELETE_IN_PROGRESS':
        return "<span class='text text-danger'>"+value+"</span>";
      case 'CREATE_IN_PROGRESS':
        return "<span class='text text-info'>"+value+"</span>";
      default:
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
    if(key === 'role'){
      return value[0]+"&nbsp"+value[1];
    }else if (key === 'email') {
      return value[0]+"&nbsp"+value[1]+"&nbsp"+value[2];
    }else {
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
