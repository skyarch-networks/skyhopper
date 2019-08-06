// Vue common methods on pagination
const checkTag = (r) => {
  if (r.tags) {
    return (r.tags[0].key === 'Name');
  }
  return undefined;
};

const hasSelected = (arg) => {
  if (arg) {
    return arg.some(c => c.checked);
  }
  return undefined;
};


module.exports = {
  check_tag: checkTag,
  has_selected: hasSelected,
};
