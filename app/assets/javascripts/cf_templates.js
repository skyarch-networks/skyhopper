//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//
const queryString = require('query-string').parse(window.location.search);
const ace = require('brace');
require('brace/theme/github');
require('brace/mode/json');
require('brace/mode/yaml');
const JSZip = require('jszip');
const demoGrid = require('./demo-grid');
const modal = require('./modal');

{
  Vue.component('demo-grid', demoGrid);

  let editor;
  $(document).ready(() => {
    if ($('#description').length > 0) {
      editor = ace.edit('description');
      const textarea = $('#cf_template_value');
      editor.getSession().setValue(textarea.val());
      editor.getSession().on('change', () => {
        textarea.val(editor.getSession().getValue());
      });
      editor.setOptions({
        maxLines: 30,
        minLines: 15,
      });
      editor.setTheme('ace/theme/github');

      $('#cf_template_format').change(function cfTemplateFormatChangeHandler() {
        const format = $(this).val();
        if (format === 'YAML') {
          editor.getSession().setMode('ace/mode/yaml');
          return;
        }
        editor.getSession().setMode('ace/mode/json');
      }).change();

      $('#ace-loading').hide();
    }
  });

  if ($('#indexElement').length) {
    new Vue({
      el: '#indexElement',
      data: {
        searchQuery: '',
        gridColumns: ['cf_subject', 'details'],
        gridData: [],
        index: 'cf_templates',
        picked: {
          button_destroy_cft: null,
          button_edit_cft: null,
          id: null,
        },
        multiSelect: false,
        selections: [],
        url: `cf_templates?lang=${queryString.lang}`,
        is_empty: false,
        loading: true,
      },
      computed: {
        can_export() {
          return (
            (this.multiSelect === false && this.picked.id !== null)
            || (this.multiSelect && this.selections.length !== 0)
          );
        },
        can_edit() {
          return (!this.multiSelect && this.picked.button_edit_cft !== null);
        },
        can_delete() {
          return (!this.multiSelect && this.picked.button_destroy_cft !== null);
        },
      },
      methods: {
        delete_entry() {
          const self = this;
          modal.Confirm(t('cf_templates.cf_template'), t('cf_templates.msg.delete_cf_template'), 'danger').done(() => {
            $.ajax({
              type: 'POST',
              url: self.picked.button_destroy_cft,
              dataType: 'json',
              data: { _method: 'delete' },
              success() {
                window.location.reload();
              },
            }).fail(modal.AlertForAjaxStdError());
          });
        },
        show_template(cfTemplateId) {
          $.ajax({
            url: `/cf_templates/${cfTemplateId}`,
            type: 'GET',
            success(data) {
              $('#template-information').html(data);
            },
          }).done(() => {
            const viewer = ace.edit('cf_value');
            viewer.setOptions({
              maxLines: Infinity,
              minLines: 15,
              readOnly: true,
            });
            viewer.setTheme('ace/theme/github');
            const format = $('#template-information #cf_value').data('format');
            if (format === 'YAML') {
              viewer.getSession().setMode('ace/mode/yaml');
            } else {
              viewer.getSession().setMode('ace/mode/json');
            }
          });
        },
        confirm_export() {
          const self = this;
          const html = $('<div>', { class: 'panel panel-info', style: 'margin-bottom: 0px' });
          html.append(
            $('<div>', {
              class: 'panel-heading',
              text: t('cf_templates.msg.confirm_export'),
            }).prepend(
              $('<span>', { class: 'glyphicon glyphicon-info-sign' }),
            ),
            $('<ul>').append(
              this.selections.map(obj => $('<li>', { text: obj.cf_subject })),
            ),
          );
          modal.ConfirmHTML(t('cf_templates.cf_templates'), html).done(() => {
            self.export_templates(self.selections);
          });
        },
        export_templates(templates) {
          const self = this;
          const zip = new JSZip();
          templates.forEach((obj) => {
            const filename = `${self.escape_invalid_character(obj.cf_subject)}.json`;
            zip.file(filename, obj.value);
          });
          zip.generateAsync({ type: 'blob' }).then((content) => {
            self.download_blob('cf_templates.zip', content);
          });
        },
        export_selected() {
          if (this.multiSelect) {
            this.confirm_export();
          } else {
            this.download_blob(`${this.picked.cf_subject}.json`, this.picked.value);
          }
        },
        export_all() {
          this.export_templates(this.gridData);
        },
        download_blob(filename, value) {
          const file = new File([value], filename);
          const event = new MouseEvent('click');
          const url = window.URL.createObjectURL(file);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          a.dispatchEvent(event);
        },
        escape_invalid_character(str) {
          return str.replace(/[\\/:*?<>"|]/g, '-');
        },
        reload() {
          this.loading = true;
          this.$children[0].load_ajax(this.url, this.empty);
          this.selections = [];
          this.picked = {
            button_destroy_cft: null,
            button_edit_cft: null,
            id: null,
          };
        },
      },
      watch: {
        multiSelect() {
          this.selections = [];
        },
      },
    });
  }
}
