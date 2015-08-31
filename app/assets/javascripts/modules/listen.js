module.exports = function (value, key, option, lang) {
  if(option[0] === 'infrastructure'){
    return render_infrastructures(value, key);
  }else if(option[0] === 'project'){
    return render_projects(value, key, lang);
  }else if (option[0] === 'client') {
    return render_clients(value, key, lang);
  }else{
    return value;
  }
};

function render_infrastructures(value, key){
  if(key === 'id'){
  var isEdit = $('#edit-'+value+'').attr('class');
  var href = $('#edit-'+value+'').attr('href');
  var isDelete = $('#delete-'+value+'').attr('class');
  var ret = "<a class='btn btn-xs btn-info show-infra' infrastructure-id="+value+" href='#'>"+t('helpers.links.show')+"</a> " +
    "<a class='btn btn-default btn-xs' href='/serverspecs?infrastructure_id="+value+"&amp;lang=en'>Serverspecs</a> " +
    "<a class='"+isEdit+"' href='"+href+"'>"+ t("helpers.links.edit")+"</a> " +
    "<a class='btn btn-xs btn-warning detach-infra' infrastructure-id="+value+" href='#'>"+t('helpers.links.detach')+"</a> "+
    "<div class='btn-group'>"+
        "<a class='"+isDelete+"' data-toggle='dropdown' href='#'>" +
        "    "+t('infrastructures.btn.delete_stack')+"&nbsp;<span class='caret'></span> " +
        " </a> " +
       "<ul class='dropdown-menu'>"+
        "<li> " +
         "<a class='delete-stack' infrastructure-id="+value+" href='#'>Execute</a> " +
      "</li>"+
      "</ul>"+
     "</div>";

    return ret;
  }else{
    if(value == "CREATE_COMPLETE")
      return "<span class='label label-success'>"+value+"</span>";
    else
      return value;
  }
}

function render_clients(value, key, lang){
  if(key === 'id'){
    var isEdit = $('#delete-'+value+'').attr('class');
    var isDelete = $('#delete-'+value+'').attr('class');
    var edit = '';
    var del = '';
    if(isEdit)
      edit = " <a class='btn btn-default btn-xs' href='/clients/"+value+"/edit?lang="+lang+"'>"+t("helpers.links.edit")+"</a>";
    if(isDelete)
      del = " <a data-confirm='Are you sure?'' class='btn btn-xs btn-danger' rel='nofollow' data-method='delete' href='/clients/"+value+"?lang="+lang+"'>Delete</a>";


    var ret = "<a class='btn btn-xs btn-info ' href='/projects?lang="+lang+"&amp;client_id="+value+"'' >"+t('clients.btn.show_projects')+"</a> ";
       return ret+edit+del;
  }else{
    return value;
  }
}

function render_projects(value, key, lang){
  if(key === 'id'){
    var isDelete = $('#delete-'+value+'').attr('class');
    var del;
    if(isDelete){
     del = "<a data-confirm='Are you sure?'' class='btn btn-xs btn-danger' rel='nofollow' data-method='delete' href='/projects/"+value+"?lang="+lang+"'>Delete</a>";
    }else{
     del = '';
    }

    var ret = "<a class='btn btn-xs btn-info ' href='/infrastructures?lang="+lang+"&amp;project_id="+value+"'' >"+t('projects.btn.show_infrastructures')+"</a> " +
      "<div class='btn-group'>" +
        "<a class='btn btn-default btn-xs dropdown-toggle' data-toggle='dropdown' href='#' aria-expanded='false'>" +
          t ('common.btn.settings')+ " <span class='caret'></span>" +
        "</a>" +
        "<ul class='dropdown-menu'>" +
          "<li>" +
            "<a href='/dishes?lang="+lang+"&amp;project_id="+value+"'>"+t('dishes.dishes')+"</a>" +
            "<a href='/key_pairs?lang="+lang+"&amp;project_id="+value+"'>"+t('key_pairs.key_pairs')+"</a>" +
          "</li>" +
        "</ul>" +
      "</div>" +
      "<a class='btn btn-default btn-xs' href='/projects/"+value+"/edit?lang="+lang+"'>"+t("helpers.links.edit")+"</a> ";
       return ret+del;
  }else{
    return value;
  }
}
