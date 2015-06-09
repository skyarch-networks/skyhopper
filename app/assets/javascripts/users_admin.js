//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

(function () {        //  for file local scope

  var ajax_users_admin = new AjaxSet.Resources("users_admin");
  ajax_users_admin.add_collection('sync_zabbix', 'PUT');

  var highlight_user_row = function (selected_user) {
    $(".user-row").removeClass("info");
    selected_user.addClass("info");
  };

  var is_exist_in_allowed_projects = function (project_id) {
    return ($("#allowed-projects").children("option[value='"+project_id+"']").length !== 0);
  };

  var set_projects_by_selected_client_id = function (client_id) {
    $.ajax({
      url      : "/projects.json",
      data     : { client_id : client_id },
      datatype : "json",
    }).done(function(data) {
      $("#projects").empty();
      $.each(data, function(num) {
        var option = $("<option>");
        option.val(data[num].id);
        option.text(data[num].name + "[" + data[num].code + "]");
        $("#projects").append(option);
      });

      if (! $('#projects').children().size()) {
        $('#projects').append($('<option>').html('&nbsp;'));
      }
    }).fail(function (XMLHttpRequest, textStatus, errorThrown) {
      bootstrap_alert(t('users.title'), textStatus, "danger");
    });
  };

  var add_selected_projects_to_allowed_projects = function() {
    if (!( $("#clients").val() && $("#projects").val() )) {
      bootstrap_alert(t('users.title'), t('js.users.msg.project_not_select'), "danger");
      return;
    }

    var client_name = $('#clients option:selected').text();

    $.each($('#projects option:selected'), function () {
      var project      = $(this);
      var project_id   = project.val();
      var project_name = project.text();

      if (!is_exist_in_allowed_projects(project_id)) {
        var title = client_name + ' / ' + project_name;

        var option = $("<option>");
        option.val(project_id);
        option.text(title);
        $("#allowed-projects").append(option);
      }
    });
  };

  var sync_zabbix = function (btn) {
    var f = function () {
      var reload = function (){
        // ここでdisabled を消さないと、何故かリロードしてもdisabledがついたままになる(FireFox で確認)
        btn.prop('disabled', false);
        location.reload();
      };

      btn.prop('disabled', true);
      var frag = $(document.createDocumentFragment());
      var p = $("<p>");
      frag.append(p);
      show_loading(p);
      btn.after(frag);
      ajax_users_admin.sync_zabbix().done(function (data) {
        bootstrap_alert(t('users.title'), data).done(reload);
      }).fail(modal_for_ajax_std_error(reload));
    };

    bootstrap_confirm(t('users.title'), t('users.msg.confirm_sync_zabbix')).done(f);
  };

  var remove_selected_allowed_projects = function () {
    $("#allowed-projects option:selected").remove();
  };


  $(".edit-user-permission").click(function (e) {
    e.preventDefault();

    var user_id = $(this).attr("user-id");
    highlight_user_row($(this).parent().parent());

    ajax_users_admin.edit({
      id: user_id
    }).done(function (data, status, xhr) {
      $("#user-permission-edit").html(data);
    }).fail(function (xhr, status, error) {
      console.error(xhr.responseText);
    });

  });

  $(document).on("change", "#clients", function () {
    var client_id = $(this).val();
    set_projects_by_selected_client_id(client_id);
  });

  $(document).on("click", "#add-allowed-projects", function (e) {
    e.preventDefault();
    add_selected_projects_to_allowed_projects();
  });

  $(document).on("dblclick", "#projects", function (e) {
    e.preventDefault();
    add_selected_projects_to_allowed_projects();
  });

  $(document).on("click", "#remove-allowed-projects", function (e) {
    e.preventDefault();
    remove_selected_allowed_projects();
  });

  $(document).on("dblclick", "#allowed-projects", function (e) {
    e.preventDefault();
    remove_selected_allowed_projects();
  });

  $(document).on("click", "#apply-permission-edit", function (e) {
    e.preventDefault();

    var user_id = $("#user-id").val();

    var password = $("input#password").val();
    var password_confirmation = $("input#password_confirmation").val();

    var is_checked_master = $("#user_master").is(':checked');
    var is_checked_admin  = $("#user_admin").is(':checked');

    var allowed_projects = [];

    if ($("#allowed-projects").children().size() > 0) {
      allowed_projects = $("#allowed-projects").children();

      allowed_projects = allowed_projects.map(function () {
        return $(this).val();
      });
    }

    allowed_projects = $.makeArray(allowed_projects);

    var params = {
      id: user_id,
      master: is_checked_master,
      admin: is_checked_admin,
      allowed_projects: allowed_projects
    };

    if (password && password_confirmation) {
      if (password === password_confirmation) {
        params.password = password;
        params.password_confirmation = password_confirmation;
      }
      else {
        bootstrap_alert(t("users.title"), "Password confirmation does not match Password", "danger");
        return;
      }
    }

    ajax_users_admin.update(params).done(function (data, status, xhr) {
      bootstrap_alert(t('users.title'), data).done(function () {
        location.reload();
      });
    }).fail(modal_for_ajax_std_error());
  });

  $(document).on('click', '#sync_zabbix', function () {
    sync_zabbix($(this));
  });
})();

$(document).ready(function () {
  var checkValue = [];
  var checkInput = $(".text_field");
  var checkbutton = $("input[value='Create New User']");
  checkbutton.attr('disabled', 'disabled');
  checkInput.bind("keyup change", function () {
    for (var i = 0; i < checkInput.length; i++) {
      if (checkInput.eq(i).val().length === 0) {
        checkValue[i] = 0;
      }
      else {
        checkValue[i] = 1;
      }
    }
    if ($.inArray(0, checkValue) === -1) {
      checkbutton.attr('disabled', false);
    }
    else {
      checkbutton.attr('disabled', 'disabled');
    }
  });
});
