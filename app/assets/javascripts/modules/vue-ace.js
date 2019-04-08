const ace = require('brace');

// `install` function is copied and modified from github.com/skyarch-networks/skyhopper
//
// Copyright (c) 2015 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
exports.install = (Vue, options, mode, lines) => {
  Vue.directive('ace', {
    twoWay: true,
    bind() {
      this.editor = ace.edit(this.el);
      this.editor.setTheme('ace/theme/github');
      this.editor.getSession().setMode(`ace/mode/${mode}`);
      this.editor.getSession().setUseWrapMode(true);
      this.editor.$blockScrolling = Infinity;

      if (!lines) {
        lines = Infinity;
      }

      this.editor.setOptions({
        maxLines: lines,
        minLines: 15,
      });

      if (options) {
        this.editor.setOptions({
          readOnly: options,
          highlightActiveLine: false,
          highlightGutterLine: false,
        });
        this.editor.renderer.$cursorLayer.element.style.opacity = 0;
      }

      this.silent = false;
      this.handler = () => {
        if (!this.silent) {
          this.set(this.editor.getSession().getValue(), true);
        }
      };
      this.editor.on('change', this.handler);
    },
    update(value, oldValue) {
      this.silent = true;
      this.editor.getSession().setValue(value);
      this.silent = false;
    },
  });
};
