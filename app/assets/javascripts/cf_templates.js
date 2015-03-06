//
// Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

(function() {

  $(document).on("click", ".show-template", function () {
    var cf_template_id = $(this).closest("tr").attr("data-managejson-id");
    $.ajax({
      url : "/cf_templates/" + cf_template_id,
      type : "GET",
      success : function (data) {
        $("#template-information").html(data);
      }
    });
  });


})();
