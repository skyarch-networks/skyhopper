exports.install = function(Vue, options, mode, lines){
  Vue.directive("ace", {
      twoWay: true,
      params: ['mode', 'theme','options', 'lines', 'ace_loader'],
      bind: function () {
          this.editor = ace.edit(this.el);
          if(this.params.mode && this.params.theme){
            this.editor.setTheme("ace/theme/"+this.params.theme);
            this.editor.getSession().setMode("ace/mode/"+this.params.mode);
          }else{
            this.editor.setTheme("ace/theme/github");
            this.editor.getSession().setMode("ace/mode/"+mode);
          }
          this.editor.getSession().setUseWrapMode(true);
          this.editor.$blockScrolling = Infinity;
          if(!lines)
            lines = Infinity;

          if(!this.params.mode){
            this.editor.setOptions({
              maxLines: lines,
              minLines: 30,
            });
          }else if(this.params.lines){
            this.editor.setOptions({
              maxLines: this.params.lines,
              minLines: 30,
            });
          }else{
            this.editor.setOptions({
              maxLines: Infinity,
              minLines: 30,
            });
          }


          if (options || this.params.options){
            this.editor.setOptions({readOnly: true, highlightActiveLine: false, highlightGutterLine: false});
            this.editor.renderer.$cursorLayer.element.style.opacity=0;
          }

          this.silent = false;
          this.handler = function () {
              if (!this.silent) {
                  this.set(this.editor.getSession().getValue(), true);
                  this.params.ace_loader = false;
              }
          }.bind(this);
          this.editor.on("change", this.handler);
      },
      update: function (value, oldValue) {
          this.silent = true;
          this.editor.getSession().setValue(value);
          this.editor.navigateLineEnd();
          this.silent = false;
      }
  });

};
