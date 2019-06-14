//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
const modal = require('./modal');

(() => {
  /* structure of selectedResources
    selectedResources = {
      "###resource_name###": {resource_name: ###resource_name###, resource_type: ###resource_type###, instance_type: ###instance_type###},
      ...
    }
  */
  const selectedResources = {};
  const isEmptyForSelectedResources = () => !Object.keys(selectedResources).length;

  /*
     parameters = {
      ResourceA: ['Property1', 'Property2'],
      ResourceB: ['Property3', 'Property4']
     }
  */
  const parameters = {};

  const rowResourceSummary = (resourceName) => {
    let summary = '';
    if (selectedResources[resourceName]) summary += `${t('js.template_builder.inserted_properties')}:\n`;

    $.each(selectedResources[resourceName], (propertyType, val) => {
      if (propertyType !== 'resource_name' && propertyType !== 'resource_type') {
        if (typeof (val) === 'object') {
          summary += `\t${propertyType}: ${JSON.stringify(val)}, \n`;
        } else {
          summary += `\t${propertyType}: ${val}, \n`;
        }
      }
    });
    if (parameters[resourceName]) {
      summary += `${t('js.template_builder.to_be_parameterized')}:\n\t${parameters[resourceName]}`;
    }
    const tr = $('<tr>');
    const td = $('<td>').attr('colspan', 3).addClass('hidden-row');
    $('<pre>').text(summary).appendTo(td);
    td.appendTo(tr);
    return tr;
  };

  const rowResource = (resourceSummary) => {
    const tr = $('<tr>').attr('resource-name', resourceSummary.resource_name);
    $('<td>').text(resourceSummary.resource_name).appendTo(tr);
    $('<td>').text(resourceSummary.resource_type).appendTo(tr);
    $('<td>').html("<span class='glyphicon glyphicon-trash remove-resource'></span>").appendTo(tr);

    return tr;
  };

  const refreshSelectedResourcesList = () => {
    const listResources = $('#selected-resources').children('tbody');
    listResources.empty();

    $.each(selectedResources, (resourceName, resourceSummary) => {
      listResources.append(rowResource(resourceSummary)).append(rowResourceSummary(resourceName));
    });
  };

  const selectResource = (resourceType) => {
    $.ajax({
      url: '/template_builder/resource_properties',
      type: 'get',
      data: {
        resource_type: resourceType,
      },
      success(data) {
        $('#resource-properties').html(data);
      },
      error(data) {
        modal.Alert(t('template_builder.template_builder'), data.responseText, 'danger');
      },
    });
  };

  const addResource = function addResource(resourceName) {
    const resourceType = $('#resources_resources').val();

    const properties = {
      resource_name: resourceName,
      resource_type: resourceType,
    };

    const params = [];

    try {
      $.each($('.property-heading'), function propertyHeadingEachHandler() {
        const propertyType = $(this).attr('property-type');

        // continue
        if (!isEnableProperty(propertyType)) return true;
        if (isParameter(propertyType)) {
          params.push(propertyType);
          return true;
        }

        const propertyVal = propertyValue(propertyType);
        if (propertyVal === null) {
          throw new Error(t('js.template_builder.msg.property_missing'));
        } else {
          properties[propertyType] = propertyVal;
        }
        return undefined;
      });
    } catch (e) {
      modal.Alert(t('template_builder.template_builder'), e.message, 'danger');
      return false;
    }

    selectedResources[resourceName] = properties;
    parameters[resourceName] = params;

    refreshSelectedResourcesList();
    return undefined;
  };

  const removeResource = (resourceName) => {
    delete selectedResources[resourceName];

    refreshSelectedResourcesList();
  };

  // property入力

  // radio buttonの場合、enableならばtrueを返し、disableならばfalseを返す。
  // また、まだ選択されていなければnullを返す。
  // textboxの場合、内容が存在すればその内容を返し、存在しなければnullを返す。
  // TODO: nestedへの対応
  // とりあえずhidden_inputを使ってnestedかを判断
  const propertyValue = (propertyName) => {
    const property = $(`.property-value[property-type=${propertyName}]`);

    // radio
    if (property.attr('type') === 'radio') {
      const valRadio = $(`.property-value[property-type=${propertyName}]:checked`).val();
      if (typeof valRadio === 'undefined') {
        return null;
      }
      return (valRadio === 'enable');
    }
    // nested
    if (property.attr('data-type') === 'array') {
      if (nestedProperties[propertyName] && nestedProperties[propertyName].length > 0) {
        return nestedProperties[propertyName];
      }
      return null;
    }
    // text, select

    const val = property.val();
    if (val === '') {
      return null;
    }

    return val;
  };

  /* structure of nestedProperties
    nestedProperties = {
      "###propery_name###": ["hoge", "fuga", ...],
      "###propery_name###": [{hoge: "fuga"}, {...}, ...]
    }
  */
  const nestedProperties = {};

  const addArrayItem = function addArrayItem(propertyType) {
    if (!nestedProperties[propertyType]) { nestedProperties[propertyType] = []; }
    let arrayItem = {};
    $.each($(`input[array-item=true][property-type=${propertyType}]`), function inputEachHundler() {
      if ($(this).attr('hash-key')) {
        arrayItem[$(this).attr('hash-key')] = $(this).val();
      } else {
        arrayItem = $(this).val();
      }
    });
    // TODO: HashのArrayのときの重複チェックの方法を考える
    if ($.inArray(arrayItem, nestedProperties[propertyType]) < 0) {
      nestedProperties[propertyType].push(arrayItem);

      refreshTableOfArrayItems(propertyType);
      refreshColorOfPropertyTitles(propertyType);
    }
  };

  const removeArrayItem = (propertyType, num) => {
    nestedProperties[propertyType].splice(num, 1);

    refreshTableOfArrayItems(propertyType);
  };

  const rowArrayItem = (item, num) => {
    const tr = $('<tr>').attr('item-number', num);
    if (typeof (item) === 'object') {
      $.each(item, (k, v) => {
        $('<td>').text(v).appendTo(tr);
      });
    } else {
      $('<td>').text(item).appendTo(tr);
    }
    $('<td>').html("<span class='glyphicon glyphicon-trash remove-array-item'></span>").appendTo(tr);
    return tr;
  };

  const refreshTableOfArrayItems = (propertyType) => {
    const target = $(`table[property-type=${propertyType}]`).children('tbody');
    target.empty();

    $.each(nestedProperties[propertyType], (i) => {
      target.append(rowArrayItem(nestedProperties[propertyType][i], i));
    });

    refreshColorOfPropertyTitles(propertyType);
  };

  const isRequiredProperty = propertyType => ($(`.enable-property[property-type=${propertyType}]`).size() === 0);

  const isEnableProperty = (propertyType) => {
    if (isRequiredProperty(propertyType)) {
      return true;
    }
    return $(`.enable-property[property-type=${propertyType}]`).prop('checked');
  };

  const isParameter = propertyType => $(`.is_parameter[property-type=${propertyType}]`).prop('checked');

  const accordionHeadingResetClass = target => target.removeClass('panel-primary panel-success panel-info panel-warning panel-danger panel-default');

  const refreshColorOfPropertyTitles = (propertyType) => {
    const targetAccordionHeading = $(`.accordion-toggle[property-type=${propertyType}]`).closest('.panel');
    accordionHeadingResetClass(targetAccordionHeading);

    if (isParameter(propertyType)) {
      targetAccordionHeading.addClass('panel-success');
    } else if (isEnableProperty(propertyType)) {
      // required prop or no_required enabled prop
      if (propertyValue(propertyType) === null) {
        targetAccordionHeading.addClass('panel-danger');
      } else {
        targetAccordionHeading.addClass('panel-success');
      }
    } else {
      // no_required disabled prop
      targetAccordionHeading.addClass('panel-default');
    }
  };

  /* event bindings */

  $('#resources_resources').change(function resourcesResourcesChangeHandler() {
    selectResource($(this).val());
  });

  $(document).on('click', '.remove-resource', function removeResourceClickHandler() {
    const clicked = $(this);
    modal.Confirm(t('template_builder.template_builder'), t('js.template_builder.msg.confirm_delete'), 'danger').done(() => {
      removeResource(clicked.closest('tr').attr('resource-name'));
    });
  });

  $(document).on('click', '.add-resource', () => {
    const resourceName = $('#resource-name').val();
    if (resourceName === '') {
      modal.Alert(t('template_builder.template_builder'), t('js.template_builder.msg.resource_name_required'), 'danger');
    } else if ($('.property-heading.text-error').size() !== 0) {
      modal.Alert(t('template_builder.template_builder'), t('js.template_builder.msg.property_missing'), 'danger');
    } else {
      addResource(resourceName);
    }
  });

  $(document).on('click', '#build-template', () => {
    if ($('#template_name').val() === '') {
      modal.Alert(t('template_builder.template_builder'), t('js.template_builder.msg.subject_required'), 'danger');
      return;
    }
    if (isEmptyForSelectedResources()) {
      modal.Alert(t('template_builder.template_builder'), t('js.template_builder.msg.resources_empty'), 'danger');
      return;
    }

    $.ajax({
      url: '/template_builder',
      type: 'POST',
      data: {
        subject: $('#template_name').val(),
        detail: $('#template_detail').val(),
        resources: JSON.stringify(selectedResources),
        parameters: JSON.stringify(parameters),
      },
      success(data) {
        modal.Alert(t('template_builder.template_builder'), data).done(() => {
          window.location.href = '/cf_templates';
        });
      },
      error(xhr) {
        modal.Alert(t('template_builder.template_builder'), xhr.responseText, 'danger');
      },
    });
  });

  $(document).on('click', '.add-array-item', function addArrayItemClickHandler() {
    const propertyType = $(this).attr('property-type');
    addArrayItem(propertyType);
  });

  $(document).on('click', '.remove-array-item', function removeArrayItemClickHandler() {
    removeArrayItem($(this).closest('table').attr('property-type'), parseInt($(this).closest('tr').attr('item-number'), 10));
  });

  const propInput = propertyType => $(`.property-value[property-type=${propertyType}]`);
  const nestedPropInputs = propertyType => $(`input[property-type=${propertyType}][array-item=true],.add-array-item[property-type=${propertyType}]`);

  // Use this property checkbox
  $(document).on('change', '.enable-property', function enablePropertyChangeHandler() {
    const propType = $(this).attr('property-type');
    const isEnable = isEnableProperty(propType);
    const isParameterCheckbox = $(`.is_parameter[property-type=${propType}]`);

    propInput(propType).prop('disabled', !isEnable);
    nestedPropInputs(propType).prop('disabled', !isEnable);
    isParameterCheckbox.prop('disabled', !isEnable);
    isParameterCheckbox.trigger('change');
  });

  // update color
  $(document).on('change', '.property-value,.enable-property,.is_parameter', function propertyChangeHandler() {
    const propType = $(this).attr('property-type');
    refreshColorOfPropertyTitles(propType);
  });
  $(document).on('keyup', '.property-value[type=text]', function propertyValueKeyUpHandler() {
    const propType = $(this).attr('property-type');
    refreshColorOfPropertyTitles(propType);
  });

  // is_parameter checkbox
  $(document).on('change', '.is_parameter', function isParameterChangeHandler() {
    const propType = $(this).attr('property-type');
    const isParam = isParameter(propType);

    propInput(propType).prop('disabled', isParam);
    nestedPropInputs(propType).prop('disabled', isParam);
  });

  // リソース選択
  $('#resources_resources').change();
})();
