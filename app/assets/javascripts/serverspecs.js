//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
//= require serverspec-gen/ast
//= require serverspec-gen/ui

$(document).on("click", ".show-value", function(){
  var serverspec_id = $(this).closest("tr").attr("data-serverspec-id");
  $.ajax({
    url : "/serverspecs/" + serverspec_id,
    type : "GET",
    success : function (data) {
      $("#value-information").html(data);
    }
  });
  document.getElementById('value').style.display='';
});
