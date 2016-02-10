var queryString    = require('query-string').parse(location.search);
var Infrastructure = require('models/infrastructure').default;
var EC2Instance    = require('models/ec2_instance').default;
var createPdf      = require('pdfmake-browserified');
var map            = require('.././modules/ipam00303.map');
var data_mapping   = require('.././modules/ipam00303');
var tableRender    = require('.././modules/table_render');

module.exports = Vue.extend({
  template: '#view-rules-tabpane-template',

  props: {
    physical_id: {
      type: String,
      required: true,
    },
    security_groups: {
      type: Array,
      required: true,
    },
    instance_type:{
      type: String,
      required: true,
    },
    infra_id: {
      type: Number,
      required: true,
    },
  },

  data: function () { return{
    loading:        false,
    rules_summary:  null,
    ip: null,
    lang: queryString.lang,
  };},

  methods: {
    get_rules: function ()  {
      var self = this;
      var group_ids = [];
      var infra = new Infrastructure(self.infra_id);
      var ec2 = new EC2Instance(infra, this.physical_id);
      self.security_groups.forEach(function (value, key) {
        if(self.instance_type === 'elb' || self.instance_type === 'rds'){
          if(value.checked)
            group_ids.push(value.group_id);
        }else{
          group_ids.push(value.group_id);
        }
      });

      ec2.get_rules(group_ids).done(function (data) {
        self.rules_summary = data.rules_summary;
      });
    },

    show_ec2: function () {
      if(this.instance_type === 'elb'){
        this.$parent.show_elb(this.physical_id);
      }else if (this.instance_type === 'rds') {
        this.$parent.show_rds(this.physical_id);
      }else{
        this.$parent.show_ec2(this.physical_id);
      }
    },
    print_pdf: function(){
      var data = this.rules_summary;
      var defaultFont = Object.keys(map)[0];

      var docDefinition = {
        footer: function(currentPage, pageCount) {return {
          text: currentPage.toString() + ' of ' + pageCount};},
        content: [
          {
          text: t('security_groups.title'),
          style: 'header',
          alignment: 'center'
          },
          {
            text: [t('infrastructures.stackname')+': ', { text: this.$parent.$data.current_infra.stack.name+'\n',  bold: true}],
            alignment: 'left'
          },
          {
            text: [t('infrastructures.physical_id')+': ', { text: this.physical_id.toString()+'\n',  bold: true}],
            alignment: 'left'
          },
          {
            text: [t('infrastructures.date')+': ', { text: moment().format('YYYY-MM-DD, HH:mm:ss')+'\n',  bold: true}],
            alignment: 'left'
          },
          tableRender(data)
        ],
    styles: {
      header: {
        fontSize: 16,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableExample: {
        margin: [5, 5, 0, 15]
      },
      tableHeader: {
        bold: true,
        fontSize: 11,
        color: 'black'
      },
    },
    defaultStyle: {
      // alignment: 'justify'
      fontSize: 10,
      alignment: 'center',
      font: defaultFont
    },
    pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [15, 30, 20, 30 ]
    };

      createPdf(docDefinition, map, data_mapping).open();
      this.get_rules();
    },
  },
  compiled: function() {
    console.log(this);
    this.get_rules();
    this.$parent.loading = false;
  },
});
