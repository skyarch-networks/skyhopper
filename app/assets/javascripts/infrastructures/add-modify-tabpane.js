const { jsonParseErr } = require('./helper.js');

module.exports = Vue.extend({
  props: {
    templates: {
      type: Object,
      required: true,
    },
    result: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      selected_cft_id: null,
    };
  },

  template: '#add-modify-tabpane-template',

  methods: {
    select_cft() {
      const cft = this.templates.histories.concat(this.templates.globals).find(c => c.id === this.selected_cft_id);
      this.result.name = cft.name;
      this.result.detail = cft.detail;
      this.result.format = cft.format;
      this.result.value = cft.value;
      this.select_format();

      this.editor.getSession().setValue(cft.value);
    },

    select_format() {
      if (this.result.format === 'YAML') {
        this.editor.getSession().setMode('ace/mode/yaml');
        return;
      }
      this.editor.getSession().setMode('ace/mode/json');
    },

    submit() {
      if (this.parseErr) { return; }
      this.$parent.show_tabpane('insert-cf-params');
      this.$parent.loading = true;
    },
  },

  computed: {
    parseErr() {
      if (this.result.format === 'YAML') {
        if (this.result.value.trim() === '') {
          return 'YAML String is empty. Please input YAML.';
        }
        return undefined;
      }
      return jsonParseErr(this.result.value);
    },
  },
  filters: {
    created_at(date) {
      return moment(date).format('YYYY/MM/D H:mm');
    },
  },
  mounted() {
    this.$nextTick(function ready() {
      this.editor = ace.edit('add_modify_value_ace'); // eslint-disable-line no-undef
      this.editor.getSession().setValue(this.result.value);
      this.editor.getSession().on('change', () => {
        this.result.value = this.editor.getSession().getValue();
      });
      this.editor.setOptions({
        maxLines: 25,
        minLines: 15,
      });
      this.editor.setTheme('ace/theme/github');
      this.editor.getSession().setMode('ace/mode/json');
      this.editor.getSession().setUseWrapMode(true);
      this.editor.$blockScrolling = Infinity;
      this.select_format();
    });
  },
});
