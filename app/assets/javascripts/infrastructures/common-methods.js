var modal = require('modal');

// Vue common methods on pagination
var check_tag = function (r) {
  if(r.tags){
    return (r.tags[0].key === 'Name');
  }
};

var has_selected = function(arg){
  if(arg){
    return arg.some(function(c){
      return c.checked;
    });
  }
};


module.exports = {
  check_tag:            check_tag,
  has_selected:         has_selected,
};
