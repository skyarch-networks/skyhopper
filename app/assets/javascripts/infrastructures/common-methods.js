const modal = require('modal');

// Vue common methods on pagination
const check_tag = function (r) {
  if (r.tags) {
    return (r.tags[0].key === 'Name');
  }
};

const has_selected = function (arg) {
  if (arg) {
    return arg.some(c => c.checked);
  }
};


module.exports = {
  check_tag,
  has_selected,
};
