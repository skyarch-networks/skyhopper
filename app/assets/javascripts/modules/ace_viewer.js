module.exports = function (args) {
  var editor = ace.edit(args);
  editor.setOptions({
    maxLines: Infinity,
    minLines: 15,
    readOnly: true
  });
  editor.setTheme("ace/theme/github");
  editor.getSession().setMode("ace/mode/json");
  // $("#ace-loading").hide();
};
