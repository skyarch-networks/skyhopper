exports.install = function(Vue, options){
  Vue.directive("ace", {
      twoWay: true,
      bind: function () {
          this.editor = ace.edit(this.el);
          this.editor.setTheme("ace/theme/github");
          this.editor.getSession().setMode("ace/mode/json");
          this.editor.getSession().setUseWrapMode(true);
          this.silent = false;
          this.handler = function () {
              if (!this.silent) {
                  this.set(this.editor.getSession().getValue(), true);
              }
          }.bind(this);
          this.editor.on("change", this.handler);
      },
      update: function (value, oldValue) {
          this.silent = true;
          this.editor.getSession().setValue(value);
          this.silent = false;
      }
  });

};
