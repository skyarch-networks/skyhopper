//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

$(document).ready(function() {
  var modal = require('modal');

  // ajaxで何度もこのファイルが読まれるため、イベントをアンバインドする必要がある
  $(document).off('click.edit_runlist dblclick.edit_runlist change.edit_runlist');


  // RunListにすでに存在するかどうか
  function chkAlreadyExists(runlist) {
    return ($("#runlist").children("option[value='"+runlist+"']").length !== 0);
  }

  // 選択したCookbookのRecipesを取得
  (function(){
    var cache = {};
    $(document).on("change.edit_runlist", "#cookbooks", function() {
      var cookbookList = $(this);
      var selectedCookbook = cookbookList.val();
      var list = $("#cookbooks").val();
      var recipes = $('#recipes');

      recipes.html('<option>&nbsp;</option>');

      if(! cache[list]){
        $.ajax({
          url      : "/nodes/recipes",
          data     : { cookbook : selectedCookbook },
          datatype : "json",
          success  : function (data) {
            recipes.empty();
            $.each(data, function(key, val) {
              var option = $("<option>");
              option.val(val);
              option.text(val);
              recipes.append(option);
            });
            cache[list] = recipes.children();
          },
          error    : function (XMLHttpRequest, textStatus, errorThrown) {
            modal.Alert(t('infrastructures.infrastructure'), textStatus, "danger");
          }
        });
      }else{
        recipes.html(cache[list]);
      }
    });
  })();

  // RecipeをRunlistに追加
  function addSelectedRecipes() {
    if (!($("#cookbooks").val() && $("#recipes").val())) {
      modal.Alert(t('infrastructures.infrastructure'), t('js.edit_runlist.msg.recipe_not_select'), "danger");
      return;
    }

    var cookbook_name = $("#cookbooks option:selected").val();
    $.each($('#recipes option:selected'), function () {
      var recipe = $(this);

      var newRecipe = "recipe[" + cookbook_name + "::" + recipe.val() + "]";
      if (!chkAlreadyExists(newRecipe)) {
        $("#runlist").append('<option value="'+newRecipe+'">'+newRecipe+'</option>');
      }
    });
  }

  $(document).on("click.edit_runlist", "#addRecipes", function() {
    addSelectedRecipes();
  });
  $(document).on("dblclick.edit_runlist", "#recipes", function() {
    addSelectedRecipes();
  });

  // RoleをRunlistに追加
  function addSelectedRoles() {
    if (!$("#roles").val()) {
      // TODO: I18n
      modal.Alert(t('infrastructures.infrastructure'), "Any roles are not selected.", "danger");
      return;
    }

    $.each($('#roles option:selected'), function () {
      var newRole = "role[" + $(this).text() + "]";
      if (!chkAlreadyExists(newRole)) {
        $("#runlist").append('<option value="'+newRole+'">'+newRole+'</option>');
      }
    });
  }

  $(document).on("click.edit_runlist", "#addRoles", function() {
    addSelectedRoles();
  });
  $(document).on("dblclick.edit_runlist", "#roles", function() {
    addSelectedRoles();
  });

  // Runlistの並び替え
  function moveUpElement() {
    // console.log("function");
    var selectbox = $('#runlist')[0];
    var option_list = selectbox.getElementsByTagName('option');
    for (var i = 0; i < option_list.length; i++) {
      if (option_list[i].selected && (i > 0 && !option_list[i-1].selected)) {
        selectbox.insertBefore(option_list[i], option_list[i-1]);
      }
    }
    selectbox.focus();
  }
  function moveDownElement() {
    var selectbox = $('#runlist')[0];
    var option_list = selectbox.getElementsByTagName('option');
    for (var i = option_list.length-1; i >= 0; i--) {
      if (option_list[i].selected) {
        if (i < option_list.length-1 && !option_list[i+1].selected) {
          selectbox.insertBefore(option_list[i+1], option_list[i]);
        }
      }
    }
    selectbox.focus();
  }


  $(document).on("click.edit_runlist", "#upRunlist", moveUpElement);
  $(document).on("click.edit_runlist", "#downRunlist", moveDownElement);

  // Runlist項目削除
  $(document).on("click.edit_runlist", "#removeRunlist", function() {
    $("#runlist option:selected").remove();
  });
  $(document).on("dblclick.edit_runlist", "#runlist", function() {
    $("#runlist option:selected").remove();
  });
});
