//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
(() => {
  'use_strict';

  function renderInfrastructures(value, key) {
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

  function renderClients(value, key) {
    if (key === 'code') {
      return `${value[0]} <span class='label label-success'>${value[1]} ${t('clients.projects')}</span>`;
    }
    return value;
  }

  function renderProjects(value, key) {
    if (key === 'code') {
      return `${value[0]} <span class='label label-success'>${value[1]} ${t('projects.infras')}</span>`;
    }
    return value;
  }

  function renderServerspecs(value, key) {
    return (key !== 'serverspec_name') ? value : '';
  }

  function renderCfTemplates(value, key) {
    return (key !== 'cf_subject') ? value : '';
  }

  function renderDish(_value, key) {
    let value = _value;
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
    }
    if (key === 'dish_name') {
      return '';
    }
    return value;
  }

  function renderUserAdmin(value, key) {
    if (key === 'role') {
      return `${value[0]}&nbsp${value[1]}`;
    } if (key === 'email') {
      return `${value[0]}&nbsp${value[1]}&nbsp${value[2]}`;
    }
    return value;
  }

  function renderServertestsResults(value, key) {
    switch (key) {
      case 'status':
        if (value === 'success') {
          return `<span class='label label-success'>${value}</span>`;
        } if (value === 'failed' || value === 'error') {
          return `<span class='label label-danger'>${value}</span>`;
        } if (value === 'pending') {
          return `<span class='label label-warning'>${value}</span>`;
        }
        return value;
      case 'servertest': {
        const names = value.servertests.map(val => val.name);
        if (value.auto_generated === true) {
          names.push('auto generated');
        } else if (value.auto_generated === null) {
          names.push('(auto generated servertest may have been executed)');
        }
        return names.join(', ');
      }
      case 'category': {
        const category = [];
        value.forEach((argument) => {
          if (!category.includes(argument.category)) category.push(argument.category);
        });

        return (value.length > 0) ? category : 'serverspec';
      }

      case 'message': {
        if (value.servertest_result_details.length <= 0 && value.auto_generated_servertest === false) {
          return `<span class='text text-success'> serverspec for ${value.physical_id} is successfully finished. </span>`;
        }
        // eslint-disable-next-line max-len
        const head = `<td>Serverspec for ${value.physical_id} <a href='#' data-toggle='collapse' data-target='#logbody-${value.id}' class='accordion-toggle popovermore'> ... <span class='glyphicon glyphicon-zoom-in'></span></a></td>`;
        let body = '';
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
      }
      default:
        return value;
    }
  }

  module.exports = (value, key, index, lang) => {
    switch (index) {
      case 'infrastructures':
        return renderInfrastructures(value, key, lang);
      case 'projects':
        return renderProjects(value, key, lang);
      case 'clients':
        return renderClients(value, key, lang);
      case 'serverspecs':
        return renderServerspecs(value, key, lang);
      case 'dishes':
        return renderDish(value, key, lang);
      case 'cf_templates':
        return renderCfTemplates(value, key, lang);
      case 'user_admin':
        return renderUserAdmin(value, key, lang);
      case 'servertest_results':
        return renderServertestsResults(value, key, lang);
      default:
        return value;
    }
  };
})();
