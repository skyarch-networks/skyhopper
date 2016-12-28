//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
(function () {
  'use_strict';

  module.exports = function (value, key, index, lang) {

    switch (index) {
      case 'infrastructures':
        return render_infrastructures(value, key, lang);
      case 'projects':
        return render_projects(value, key, lang);
      case 'clients':
        return render_clients(value, key, lang);
      case 'serverspecs':
        return render_serverspecs(value, key, lang);
      case 'dishes':
        return render_dish(value, key, lang);
      case 'cf_templates':
        return render_cf_templates(value, key, lang);
      case 'user_admin':
        return render_user_admin(value, key, lang);
      case 'servertest_results':
        return render_servertests_results(value, key, lang);
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
          return "<span class='tetestext-info'>"+value+"</span>";
        default:
          return "<span class='text text-default'> NO_STACK_INFO </span>";
      }
    }else if (key === 'stack_name') {
      return '';
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
    return (key !== 'serverspec_name') ? value : '';
  }

  function render_cf_templates(value, key, lang){
      return (key !== 'cf_subject') ? value : '';
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
    }else if (key === 'dish_name') {
      return '';
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

  function render_servertests_results(value, key){
    switch (key) {
      case 'status':
        if(value == 'success') {
          return "<span class='label label-success'>"+value+"</span>";
        }else if (value == 'failed') {
          return "<span class='label label-danger'>"+value+"</span>";
        }else if (value == 'pending') {
          return "<span class='label label-warning'>"+value+"</span>";
        }else{ return value; }

      case 'servertest':
        return  (value.length > 0) ? value.map(function(val){ return val.name; }) : 'auto generated';
      case 'category':
        var category = [];
        value.forEach(function (argument) {
          if (!category.includes(argument.category))
            category.push(argument.category);
        });

        return (value.length > 0) ? category : 'serverspec';

      case 'message':
        if(value[3].length <= 0){
          return "<span class='text text-success'> serverspec for "+value[1]+" is successfully finished. </span>";
        }else{
          var head = "<td>Serverspec for "+value[1]+" <a href='#' data-toggle='collapse' data-target='#logbody-"+value[0]+"' class='accordion-toggle popovermore'> ... <span class='glyphicon glyphicon-zoom-in'></span></a></td>";
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
        }break;
      default:
        return value;
    }
}

})();

