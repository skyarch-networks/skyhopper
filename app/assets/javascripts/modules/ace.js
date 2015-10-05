exports.install = function(Vue, options, mode, lines){
  Vue.directive("ace", {
      twoWay: true,
      bind: function () {
          this.editor = ace.edit(this.el);
          this.editor.setTheme("ace/theme/github");
          this.editor.getSession().setMode("ace/mode/"+mode);
          this.editor.getSession().setUseWrapMode(true);
          this.editor.$blockScrolling = Infinity;
          if(!lines)
            lines = Infinity;
          this.editor.setOptions({
            maxLines: lines,
            minLines: 15,
          });
          if (options){
            this.editor.setOptions({readOnly: options, highlightActiveLine: false, highlightGutterLine: false});
            this.editor.renderer.$cursorLayer.element.style.opacity=0;
          }

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
