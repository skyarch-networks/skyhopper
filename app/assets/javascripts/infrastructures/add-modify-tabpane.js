const jsonParseErr = require('./helper.js').jsonParseErr;

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
      const self = this;
      const cft = _.find(self.templates.histories.concat(self.templates.globals), c => c.id === self.selected_cft_id);
      self.result.name = cft.name;
      self.result.detail = cft.detail;
      self.result.format = cft.format;
      self.result.value = cft.value;
      self.select_format();

      self.editor.getSession().setValue(cft.value);
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
        if (_.trim(this.result.value) === '') {
          return 'YAML String is empty. Please input YAML.';
        }
        return;
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
    this.$nextTick(function () {
      const self = this;

      self.editor = ace.edit('add_modify_value_ace');
      self.editor.getSession().setValue(self.result.value);
      self.editor.getSession().on('change', () => {
        self.result.value = self.editor.getSession().getValue();
      });
      self.editor.setOptions({
        maxLines: 25,
        minLines: 15,
      });
      self.editor.setTheme('ace/theme/github');
      self.editor.getSession().setMode('ace/mode/json');
      self.editor.getSession().setUseWrapMode(true);
      self.editor.$blockScrolling = Infinity;
      self.select_format();
    });
  },
});
