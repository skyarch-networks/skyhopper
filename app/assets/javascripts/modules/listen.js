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


  function render_infrastructures(value, key, lang) {
    const SUCCESS_STATUSES = [
      'CREATE_COMPLETE', 'UPDATE_COMPLETE', 'DELETE_COMPLETE',
    ];
    const DANGER_STATUSES = [
      'CREATE_FAILED', 'ROLLBACK_IN_PROGRESS', 'ROLLBACK_FAILED', 'ROLLBACK_COMPLETE',
      'DELETE_FAILED', 'UPDATE_ROLLBACK_IN_PROGRESS', 'UPDATE_ROLLBACK_FAILED',
      'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS', 'UPDATE_ROLLBACK_COMPLETE',
      'DELETE_IN_PROGRESS',
    ];
    const INFO_STATUSES = [
      'CREATE_IN_PROGRESS', 'UPDATE_IN_PROGRESS', 'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
    ];
    if (key === 'status') {
      if (SUCCESS_STATUSES.includes(value)) {
        return `<span class='text text-success'>${value}</span>`;
      }
      if (DANGER_STATUSES.includes(value)) {
        return `<span class='text text-danger'>${value}</span>`;
      }
      if (INFO_STATUSES.includes(value)) {
        return `<span class='text text-info'>${value}</span>`;
      }
      return "<span class='text text-default'> NO_STACK_INFO </span>";
    } if (key === 'stack_name') {
      return '';
    }
    return value;
  }

  function render_clients(value, key, lang) {
    if (key === 'code') {
      return `${value[0]} <span class='label label-success'>${value[1]} ${t('clients.projects')}</span>`;
    }
    return value;
  }

  function render_projects(value, key, lang) {
    if (key === 'code') {
      return `${value[0]} <span class='label label-success'>${value[1]} ${t('projects.infras')}</span>`;
    }
    return value;
  }

  function render_serverspecs(value, key, lang) {
    return (key !== 'serverspec_name') ? value : '';
  }

  function render_cf_templates(value, key, lang) {
    return (key !== 'cf_subject') ? value : '';
  }

  function render_dish(value, key, lang) {
    if (key === 'status') {
      let label = null;
      if (value === 'SUCCESS') {
        label = 'label-success';
      } else if (value === 'FAILURE') {
        label = 'label-danger';
      } else if (value === 'CREATING' || value === 'BOOTSTRAPPING' || value === 'APPLYING' || value === 'SERVERSPEC') {
        label = 'label-info';
      } else {
        label = 'label-warning';
        value = 'NOT YET';
      }
      return `<span class='label ${label}'>${value}</span>`;
    } if (key === 'dish_name') {
      return '';
    }
    return value;
  }

  function render_user_admin(value, key, lang) {
    if (key === 'role') {
      return `${value[0]}&nbsp${value[1]}`;
    } if (key === 'email') {
      return `${value[0]}&nbsp${value[1]}&nbsp${value[2]}`;
    }
    return value;
  }

  function render_servertests_results(value, key) {
    switch (key) {
      case 'status':
        if (value === 'success') {
          return `<span class='label label-success'>${value}</span>`;
        } if (value === 'failed' || value === 'error') {
          return `<span class='label label-danger'>${value}</span>`;
        } if (value === 'pending') {
          return `<span class='label label-warning'>${value}</span>`;
        } return value;
        break;
      case 'servertest':
        var names = value.servertests.map(val => val.name);
        if (value.auto_generated === true) {
          names.push('auto generated');
        } else if (value.auto_generated === null) {
          names.push('(auto generated servertest may have been executed)');
        }
        return names.join(', ');
      case 'category':
        var category = [];
        value.forEach((argument) => {
          if (!category.includes(argument.category)) category.push(argument.category);
        });

        return (value.length > 0) ? category : 'serverspec';

      case 'message':
        if (value.servertest_result_details.length <= 0 && value.auto_generated_servertest === false) {
          return `<span class='text text-success'> serverspec for ${value.physical_id} is successfully finished. </span>`;
        }
        var head = `<td>Serverspec for ${value.physical_id} <a href='#' data-toggle='collapse' data-target='#logbody-${value.id}' class='accordion-toggle popovermore'> ... <span class='glyphicon glyphicon-zoom-in'></span></a></td>`;
        var body = '';
        if (value.message) {
          body = `${"<div class='col-sm-12'>"
            + "<td class='hidden-row'>"
            + "  <div class='accordion-body collapse' id='logbody-"}${value.id}'>`
            + `    <pre style='margin: 5px'>${value.message}</pre>`
            + '  </div>'
            + '</td>'
            + '</div>';
        }
        return head + body;
        break;
      default:
        return value;
    }
  }
}());
