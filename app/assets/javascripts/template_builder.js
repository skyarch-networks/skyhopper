//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

(function() {
  var modal = require('modal');

  /* structure of selected_resources
    selected_resources = {
      "###resource_name###": {resource_name: ###resource_name###, resource_type: ###resource_type###, instance_type: ###instance_type###},
      ...
    }
  */
  var selected_resources = {};
  var selected_resources_is_empty = function () {
    for (var i in selected_resources) {
      return false;
    }
    return true;
  };

  /*
     parameters = {
      ResourceA: ['Property1', 'Property2'],
      ResourceB: ['Property3', 'Property4']
     }
  */
  var parameters = {};



  var row_resource_summary = function (resource_name) {
    var summary = "";
    if ( selected_resources[resource_name] ) summary += t('js.template_builder.inserted_properties') + ":\n";

    $.each(selected_resources[resource_name], function (property_type, val) {
      if ( property_type !== "resource_name" && property_type !== "resource_type" ) {
        if (typeof(val) === "object") {
          summary += "\t" + property_type + ": " + JSON.stringify(val) + ", \n";
        }
        else {
          summary += "\t" + property_type + ": " + val + ", \n";
        }
      }
    });
    if (parameters[resource_name]) {
      summary += t('js.template_builder.to_be_parameterized') + ":\n\t" + parameters[resource_name];
    }
    var tr = $("<tr>");
    var td = $("<td>").attr("colspan", 3).addClass("hidden-row");
    $("<pre>").text(summary).appendTo(td);
    td.appendTo(tr);
    return tr;
  };

  var row_resource = function (resource_summary) {
    var tr = $("<tr>").attr("resource-name", resource_summary.resource_name);
    $("<td>").text(resource_summary.resource_name).appendTo(tr);
    $("<td>").text(resource_summary.resource_type).appendTo(tr);
    $("<td>").html("<span class='glyphicon glyphicon-trash remove-resource'></span>").appendTo(tr);

    return tr;
  };

  var refresh_selected_resources_list = function () {
    var list_resources = $("#selected-resources").children("tbody");
    list_resources.empty();

    $.each(selected_resources, function (resource_name, resource_summary) {
      list_resources.append( row_resource(resource_summary) ).append( row_resource_summary(resource_name) );
    });
  };

  var select_resource = function (resource_type) {
    $.ajax({
      url  : "/template_builder/resource_properties",
      type : "get",
      data : {
        resource_type: resource_type
      },
      success : function (data) {
        $("#resource-properties").html(data);
      },
      error   : function (data) {
        modal.Alert(t('template_builder.template_builder'), data.responseText, "danger");
      }
    });
  };

  var add_resource = function (resource_name) {
    var resource_type = $("#resources_resources").val();

    var properties = {
      resource_name: resource_name,
      resource_type: resource_type
    };

    var params = [];

    try {
      $.each( $(".property-heading"), function () {
        var property_type = $(this).attr("property-type");

        // continue
        if (! is_enable_property(property_type)) return true;
        if (is_parameter(property_type)) {
          params.push(property_type);
          return true;
        }


        var property_val = property_value(property_type);
        if ( property_val === null ) {
          throw new Error( t('js.template_builder.msg.property_missing') );
        }
        else {
          properties[property_type] = property_val;
        }
      });
    }
    catch (e) {
      modal.Alert(t('template_builder.template_builder'), e.message, "danger");
      return false;
    }


    selected_resources[resource_name] = properties;
    parameters[resource_name]         = params;

    refresh_selected_resources_list();
  };

  var remove_resource = function (resource_name) {
    delete selected_resources[resource_name];

    refresh_selected_resources_list();
  };


  // property入力

  // radio buttonの場合、enableならばtrueを返し、disableならばfalseを返す。
  // また、まだ選択されていなければnullを返す。
  // textboxの場合、内容が存在すればその内容を返し、存在しなければnullを返す。
  // TODO: nestedへの対応
  //// とりあえずhidden_inputを使ってnestedかを判断
  var property_value = function (property_name) {
    var property = $(".property-value[property-type=" + property_name + "]");

    // radio
    if ( property.attr("type") === "radio" ) {
      var val_radio = $(".property-value[property-type=" + property_name + "]:checked").val();
      if ( typeof val_radio === "undefined" ) {
        return null;
      }
      return ( val_radio === "enable" );
    }
    // nested
    else if ( property.attr("data-type") === "array" ) {
      if (nested_properties[property_name] && nested_properties[property_name].length > 0) {
        return nested_properties[property_name];
      }
      return null;
    }
    // text, select
    else {
      var val = property.val();
      if ( val === "" ) {
        return null;
      }
      else {
        return val;
      }
    }
  };


  /* structure of nested_properties
    nested_properties = {
      "###propery_name###": ["hoge", "fuga", ...],
      "###propery_name###": [{hoge: "fuga"}, {...}, ...]
    }
  */
  var nested_properties = {};

  var add_array_item = function (property_type) {
    if (!nested_properties[property_type]) {nested_properties[property_type] = [];}
    var array_item = {};
    $.each( $("input[array-item=true][property-type=" + property_type + "]"), function() {
      if ( $(this).attr("hash-key") ) {
        array_item[$(this).attr("hash-key")] = $(this).val();
      }
      else {
        array_item = $(this).val();
      }
    });
    //TODO: HashのArrayのときの重複チェックの方法を考える
    if ( $.inArray(array_item, nested_properties[property_type]) < 0 ) {
      nested_properties[property_type].push(array_item);

      refresh_table_of_array_items(property_type);
      refresh_color_of_property_titles(property_type);
    }
  };

  var remove_array_item = function (property_name, num) {
    nested_properties[property_name].splice(num, 1);

    refresh_table_of_array_items(property_name);
  };

  var row_array_item = function (item, num) {
    var tr = $("<tr>").attr("item-number", num);
    if ( typeof(item) === "object" ) {
      $.each(item, function(k, v) {
        $("<td>").text(v).appendTo(tr);
      });
    }
    else {
      $("<td>").text(item).appendTo(tr);
    }
    $("<td>").html("<span class='glyphicon glyphicon-trash remove-array-item'></span>").appendTo(tr);
    return tr;
  };

  var refresh_table_of_array_items = function (property_type) {
    var target = $("table[property-type=" + property_type + "]").children("tbody");
    target.empty();

    $.each(nested_properties[property_type], function(i) {
      target.append( row_array_item( nested_properties[property_type][i], i ) );
    });

    refresh_color_of_property_titles(property_type);
  };

  var is_required_property = function (property_type) {
    return $('.enable-property[property-type=' +  property_type + ']').size() === 0;
  };

  var is_enable_property = function (property_type) {
    if (is_required_property(property_type)) {
      return true;
    }
    else {
      return $(".enable-property[property-type=" + property_type + "]").prop("checked");
    }
  };

  var is_parameter = function (property_type) {
    return $('.is_parameter[property-type=' + property_type + ']').prop('checked');
  };

  var accordion_heading_reset_class = function (target) {
    target.removeClass("panel-primary panel-success panel-info panel-warning panel-danger panel-default");
  };

  var refresh_color_of_property_titles = function (property_type) {
    var target_accordion_heading = $(".accordion-toggle[property-type=" + property_type + "]").closest(".panel");
    accordion_heading_reset_class(target_accordion_heading);

    if (is_parameter(property_type)) {
      target_accordion_heading.addClass("panel-success");
    }
    else if (is_enable_property(property_type)) {
      //required prop or no_required enabled prop
      if (property_value(property_type) === null) {
        target_accordion_heading.addClass("panel-danger");
      }
      else {
        target_accordion_heading.addClass("panel-success");
      }
    }
    else {
      //no_required disabled prop
      target_accordion_heading.addClass("panel-default");
    }
  };



  /* event bindings */

  $("#resources_resources").change(function() {
    select_resource( $(this).val() );
  });


  $(document).on("click", ".remove-resource", function () {
    var clicked = $(this);
    modal.Confirm(t('template_builder.template_builder'), t('js.template_builder.msg.confirm_delete'), "danger").done(function () {
      remove_resource( clicked.closest("tr").attr("resource-name") );
    });
  });

  $(document).on("click", ".add-resource", function () {
    var resource_name = $("#resource-name").val();
    if ( resource_name === "" ) {
      modal.Alert(t('template_builder.template_builder'), t('js.template_builder.msg.resource_name_required'), "danger");
    }
    else if ($('.property-heading.text-error').size() !== 0) {
      modal.Alert(t('template_builder.template_builder'), t('js.template_builder.msg.property_missing'), "danger");
    }
    else {
      add_resource(resource_name);
    }
  });

  $(document).on("click", "#build-template", function () {
    if ( $("#template_name").val() === "" ) {
      modal.Alert(t('template_builder.template_builder'), t('js.template_builder.msg.subject_required'), "danger");
      return;
    }
    if ( selected_resources_is_empty() ) {
      modal.Alert(t('template_builder.template_builder'), t('js.template_builder.msg.resources_empty'), "danger");
      return;
    }

    $.ajax({
      url  : "/template_builder",
      type : "POST",
      data : {
        subject   : $("#template_name").val(),
        detail    : $("#template_detail").val(),
        resources : JSON.stringify(selected_resources),
        parameters: JSON.stringify(parameters)
      },
      success : function (data, status, xhr) {
        modal.Alert(t('template_builder.template_builder'), data).done(function () {
          location.href = '/cf_templates';
        });
      },
      error   : function (xhr, status, error) {
        modal.Alert(t('template_builder.template_builder'), xhr.responseText, "danger");
      }
    });
  });

  $(document).on("click", ".add-array-item", function () {
    var property_type = $(this).attr("property-type");
    add_array_item(property_type);
  });

  $(document).on("click", ".remove-array-item", function () {
    remove_array_item( $(this).closest("table").attr("property-type"), parseInt($(this).closest("tr").attr("item-number")) );
  });



  var prop_input = function (property_type) {
    return $('.property-value[property-type=' + property_type + ']');
  };
  var nested_prop_inputs = function (property_type) {
    return $("input[property-type=" + property_type + "][array-item=true],.add-array-item[property-type=" + property_type + "]");
  };

  // Use this property checkbox
  $(document).on('change', '.enable-property', function () {
    var prop_type = $(this).attr('property-type');
    var is_enable = is_enable_property(prop_type);
    var is_parameter_checkbox = $('.is_parameter[property-type=' + prop_type + ']');

    prop_input(prop_type).prop('disabled', !is_enable);
    nested_prop_inputs(prop_type).prop('disabled', !is_enable);
    is_parameter_checkbox.prop('disabled', !is_enable);
    is_parameter_checkbox.trigger('change');
  });

  // update color
  $(document).on("change", ".property-value,.enable-property,.is_parameter", function () {
    var prop_type = $(this).attr('property-type');
    refresh_color_of_property_titles(prop_type);
  });
  $(document).on("keyup", ".property-value[type=text]", function () {
    var prop_type = $(this).attr('property-type');
    refresh_color_of_property_titles(prop_type);
  });

  // is_parameter checkbox
  $(document).on('change', '.is_parameter', function () {
    var prop_type = $(this).attr('property-type');
    var is_param  = is_parameter(prop_type);

    prop_input(prop_type).prop('disabled', is_param);
    nested_prop_inputs(prop_type).prop('disabled', is_param);
  });





  // リソース選択
  $("#resources_resources").change();
})();
